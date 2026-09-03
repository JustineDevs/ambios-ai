import { Hono } from "hono";
import { MCP_TOOLS } from "../packages/shared/mcp-tools";
import { operationPath } from "../packages/shared/operations";
import type { HonoBindings } from "./hono-app";
import {
  bearerToken,
  digest,
  findMcpToken,
  hasScope,
  isSafeRedirectUri,
  issuer,
  mcpConfiguration,
  mcpResource,
  oauthError,
  parseScope,
  pkceMatches,
  randomToken,
  tokenResponse,
  tokenTtls,
  validateMcpResource,
  validateMcpScopes,
} from "./mcp-oauth";

function publicToolResult(name: string, value: unknown) {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const organization = record.organization;
  const organizationName =
    organization && typeof organization === "object"
      ? (organization as { name?: unknown }).name
      : undefined;
  if (name === "get_current_workspace_context")
    return {
      name: typeof organizationName === "string" ? organizationName : "Authorized workspace",
      source: "workspace-record",
    };
  if (name === "get_workspace_readiness")
    return {
      ready: record.ready === true,
      integrations: Array.isArray(record.integrations)
        ? record.integrations.map((item) => {
            const integration =
              item && typeof item === "object"
                ? (item as { provider?: unknown; status?: unknown })
                : {};
            return {
              provider: typeof integration.provider === "string" ? integration.provider : "unknown",
              status: typeof integration.status === "string" ? integration.status : "unknown",
            };
          })
        : [],
      source: "workspace-record",
    };
  if (name === "list_active_incidents")
    return {
      incidents: Array.isArray(record.incidents)
        ? record.incidents.map((item) => {
            const incident =
              item && typeof item === "object" ? (item as Record<string, unknown>) : {};
            return {
              title: typeof incident.title === "string" ? incident.title : "Untitled incident",
              service: typeof incident.service === "string" ? incident.service : "Unknown service",
              severity: typeof incident.severity === "string" ? incident.severity : "unknown",
              status: typeof incident.status === "string" ? incident.status : "unknown",
            };
          })
        : [],
      source: "incident-records",
    };
  return {
    events: Array.isArray(record.events)
      ? record.events.map((item) => {
          const event = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            actionType: typeof event.actionType === "string" ? event.actionType : "unknown",
            status: typeof event.status === "string" ? event.status : "unknown",
            summary: typeof event.summary === "string" ? event.summary : "",
          };
        })
      : [],
    source: "audit-records",
  };
}

async function supabaseUser(env: HonoBindings, request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ") || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY)
    return null;
  try {
    const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: authorization },
    });
    if (!response.ok) return null;
    const user = (await response.json().catch(() => null)) as { id?: string } | null;
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export function createMcpRoutes() {
  const app = new Hono<{ Bindings: HonoBindings }>();
  const allowLocalhostRedirects = (env: HonoBindings) => env.ENVIRONMENT !== "production";
  async function recordOAuthEvent(env: HonoBindings, userId: string | null, summary: string) {
    if (!env.DB || !userId) return;
    const organization = await env.DB.prepare(
      "SELECT organization_id AS organizationId FROM memberships WHERE user_id = ? ORDER BY created_at LIMIT 1",
    )
      .bind(userId)
      .first<{ organizationId: string }>();
    if (!organization) return;
    await env.DB.prepare(
      "INSERT INTO actions (id, organization_id, actor_type, actor_id, action_type, input_json, output_json, status, approval_state, summary) VALUES (?, ?, 'mcp', ?, 'mcp_oauth_event', '{}', '{}', 'succeeded', 'not_required', ?)",
    )
      .bind(crypto.randomUUID(), organization.organizationId, userId, summary.slice(0, 240))
      .run();
  }
  app.get(operationPath("mcpChallenge"), (c) => {
    const token = c.env.OPENAI_APPS_CHALLENGE_TOKEN?.trim();
    if (!token) {
      return c.text("OpenAI app challenge is not configured", 503, {
        "Cache-Control": "no-store",
      });
    }
    return c.text(token, 200, {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
  });
  app.get(operationPath("mcpAuthorizationMetadata"), (c) => {
    const configuration = mcpConfiguration(c.env);
    const root = configuration.issuer;
    return c.json({
      issuer: root,
      authorization_endpoint: configuration.authorizationEndpoint,
      token_endpoint: configuration.tokenEndpoint,
      registration_endpoint: configuration.registrationEndpoint,
      response_types_supported: [...configuration.supportedResponseTypes],
      grant_types_supported: [...configuration.supportedGrantTypes],
      code_challenge_methods_supported: [...configuration.supportedCodeChallengeMethods],
      scopes_supported: [...configuration.scopes],
      token_endpoint_auth_methods_supported: ["none"],
    });
  });
  const resourceMetadata = (c: { env: HonoBindings }) => ({
    resource: mcpConfiguration(c.env).resource,
    authorization_servers: [issuer(c.env)],
    scopes_supported: [...mcpConfiguration(c.env).scopes],
    bearer_methods_supported: ["header"],
  });
  app.get(operationPath("mcpResourceMetadata"), (c) => c.json(resourceMetadata(c)));
  app.get(operationPath("mcpResourceMetadataForMcp"), (c) => c.json(resourceMetadata(c)));

  app.post(operationPath("mcpRegister"), async (c) => {
    if (!c.env.DB) return c.json({ error: "temporarily_unavailable" }, 503);
    const body = (await c.req.json().catch(() => null)) as {
      client_name?: string;
      client_uri?: string;
      redirect_uris?: string[];
    } | null;
    const redirects = body?.redirect_uris;
    const clientUri = body?.client_uri;
    if (
      !body?.client_name?.trim() ||
      !Array.isArray(redirects) ||
      redirects.length < 1 ||
      redirects.length > 10 ||
      redirects.some(
        (uri) => typeof uri !== "string" || !isSafeRedirectUri(uri, allowLocalhostRedirects(c.env)),
      ) ||
      (clientUri !== undefined &&
        (typeof clientUri !== "string" ||
          !isSafeRedirectUri(clientUri, allowLocalhostRedirects(c.env))))
    )
      return c.json({ error: "invalid_client_metadata" }, 400);
    const clientId = randomToken(24);
    await c.env.DB.prepare(
      "INSERT INTO mcp_clients (client_id, client_name, redirect_uris_json, client_uri) VALUES (?, ?, ?, ?)",
    )
      .bind(
        clientId,
        body.client_name.trim().slice(0, 120),
        JSON.stringify(redirects),
        clientUri?.slice(0, 500) ?? null,
      )
      .run();
    return c.json(
      {
        client_id: clientId,
        client_name: body.client_name.trim().slice(0, 120),
        redirect_uris: redirects,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      },
      201,
    );
  });

  app.get(operationPath("mcpAuthorizationRequest"), async (c) => {
    if (!c.env.DB) return c.json({ error: "temporarily_unavailable" }, 503);
    const request = await c.env.DB.prepare(
      "SELECT r.client_id AS clientId, r.scope, r.resource, r.expires_at AS expiresAt, c.client_name AS clientName FROM mcp_authorization_requests r JOIN mcp_clients c ON c.client_id = r.client_id WHERE r.request_id = ? LIMIT 1",
    )
      .bind(c.req.param("requestId"))
      .first<{
        clientId: string;
        clientName: string;
        scope: string;
        resource: string;
        expiresAt: string;
      }>();
    if (!request || Date.parse(request.expiresAt) <= Date.now())
      return c.json(
        { error: "invalid_request", error_description: "Authorization request expired." },
        404,
      );
    return c.json({
      clientName: request.clientName,
      resource: request.resource,
      scopes: request.scope.split(" "),
      expiresAt: request.expiresAt,
    });
  });
  // The Vercel proxy forwards the API namespace to Core before Next route handlers in
  // development and production. Keep this read-only alias so consent UI can
  // fetch request details without relying on filesystem routing precedence.
  app.get(operationPath("mcpAuthorizationRequestApi"), async (c) => {
    if (!c.env.DB) return c.json({ error: "temporarily_unavailable" }, 503);
    const request = await c.env.DB.prepare(
      "SELECT r.scope, r.resource, r.expires_at AS expiresAt, c.client_name AS clientName FROM mcp_authorization_requests r JOIN mcp_clients c ON c.client_id = r.client_id WHERE r.request_id = ? LIMIT 1",
    )
      .bind(c.req.param("requestId"))
      .first<{ clientName: string; scope: string; resource: string; expiresAt: string }>();
    if (!request || Date.parse(request.expiresAt) <= Date.now())
      return c.json(
        { error: "invalid_request", error_description: "Authorization request expired." },
        404,
      );
    return c.json({
      clientName: request.clientName,
      resource: request.resource,
      scopes: request.scope.split(" "),
      expiresAt: request.expiresAt,
    });
  });

  app.get(operationPath("mcpAuthorize"), async (c) => {
    if (!c.env.DB) return c.json({ error: "temporarily_unavailable" }, 503);
    const q = c.req.query();
    const redirect = q.redirect_uri;
    const safeRedirect =
      redirect && isSafeRedirectUri(redirect, allowLocalhostRedirects(c.env))
        ? redirect
        : undefined;
    if (
      q.response_type !== "code" ||
      q.code_challenge_method !== "S256" ||
      !q.client_id ||
      !safeRedirect ||
      !q.code_challenge
    )
      return oauthError(
        "invalid_request",
        "Authorization Code with S256 PKCE and an exact redirect_uri is required.",
      );
    const client = await c.env.DB.prepare(
      "SELECT client_id AS clientId, redirect_uris_json AS redirectUrisJson FROM mcp_clients WHERE client_id = ? LIMIT 1",
    )
      .bind(q.client_id)
      .first<{ clientId: string; redirectUrisJson: string }>();
    if (!client) return c.json({ error: "unauthorized_client" }, 400);
    let redirects: unknown;
    try {
      redirects = JSON.parse(client.redirectUrisJson);
    } catch {
      redirects = [];
    }
    if (!Array.isArray(redirects) || !redirects.includes(safeRedirect))
      return oauthError("invalid_request", "redirect_uri is not registered.");
    const requestedScope = validateMcpScopes(q.scope ?? null);
    const resource = mcpConfiguration(c.env).resource;
    const resourceResult = validateMcpResource(q.resource, c.env);
    if (!resourceResult.ok || !requestedScope.ok)
      return oauthError(
        resourceResult.ok ? "invalid_scope" : resourceResult.code,
        resourceResult.ok
          ? "scope must contain registered AmbiOS capabilities."
          : "resource must identify the configured AmbiOS MCP server.",
        safeRedirect,
        q.state,
      );
    // Revalidate the persisted request at consent time. A request may remain
    // open across a registry/configuration change and must never mint a code
    // for a resource or scope that is no longer accepted.
    if (!validateMcpResource(resource, c.env).ok || !validateMcpScopes(requestedScope.value).ok)
      return c.json(
        { error: "invalid_target", error_description: "Authorization target changed." },
        409,
      );
    const requestId = randomToken(24);
    await c.env.DB.prepare(
      "INSERT INTO mcp_authorization_requests (request_id, client_id, redirect_uri, resource, scope, code_challenge, code_challenge_method, state, expires_at) VALUES (?, ?, ?, ?, ?, ?, 'S256', ?, ?)",
    )
      .bind(
        requestId,
        q.client_id,
        safeRedirect,
        resource,
        requestedScope.value,
        q.code_challenge,
        q.state ?? null,
        new Date(Date.now() + tokenTtls.AUTH_REQUEST_TTL_SECONDS * 1000).toISOString(),
      )
      .run();
    if (!c.env.MCP_AUTH_UI_URL)
      return c.json(
        {
          error: "temporarily_unavailable",
          error_description: "MCP consent UI is not configured.",
        },
        503,
      );
    const ui = new URL(c.env.MCP_AUTH_UI_URL);
    ui.searchParams.set("request_id", requestId);
    return c.redirect(ui.toString(), 302);
  });

  app.post(operationPath("mcpConsent"), async (c) => {
    if (!c.env.DB) return c.json({ error: "temporarily_unavailable" }, 503);
    const userId = await supabaseUser(c.env, c.req.raw);
    const body = (await c.req.json().catch(() => null)) as {
      request_id?: string;
      approve?: boolean;
    } | null;
    if (!userId) return c.json({ error: "invalid_token" }, 401);
    if (!body?.request_id || typeof body.approve !== "boolean")
      return c.json({ error: "invalid_request" }, 400);
    const request = await c.env.DB.prepare(
      "SELECT request_id AS requestId, client_id AS clientId, redirect_uri AS redirectUri, resource, scope, code_challenge AS codeChallenge, expires_at AS expiresAt, consumed_at AS consumedAt, state FROM mcp_authorization_requests WHERE request_id = ? LIMIT 1",
    )
      .bind(body.request_id)
      .first<{
        requestId: string;
        clientId: string;
        redirectUri: string;
        resource: string;
        scope: string;
        codeChallenge: string;
        expiresAt: string;
        consumedAt: string | null;
        state: string | null;
      }>();
    if (!request || request.consumedAt || Date.parse(request.expiresAt) <= Date.now())
      return c.json({ error: "invalid_request" }, 400);
    if (!isSafeRedirectUri(request.redirectUri, allowLocalhostRedirects(c.env)))
      return c.json(
        {
          error: "invalid_request",
          error_description: "The registered redirect_uri is not allowed in this deployment.",
        },
        400,
      );
    if (!body.approve) {
      const consumed = await c.env.DB.prepare(
        "UPDATE mcp_authorization_requests SET consumed_at = CURRENT_TIMESTAMP WHERE request_id = ? AND consumed_at IS NULL",
      )
        .bind(body.request_id)
        .run();
      if ((consumed.meta.changes ?? 0) !== 1) return c.json({ error: "invalid_request" }, 400);
      const denied = new URL(request.redirectUri);
      denied.searchParams.set("error", "access_denied");
      denied.searchParams.set("error_description", "The user denied MCP access.");
      if (request.state) denied.searchParams.set("state", request.state);
      await recordOAuthEvent(c.env, userId, "MCP OAuth consent denied");
      return c.json({ redirect_uri: denied.toString() });
    }
    const membership = await c.env.DB.prepare(
      "SELECT organization_id AS organizationId FROM memberships WHERE user_id = ? ORDER BY created_at LIMIT 1",
    )
      .bind(userId)
      .first<{ organizationId: string }>();
    if (!membership)
      return c.json(
        { error: "invalid_request", error_description: "No authorized workspace is available." },
        403,
      );
    const code = randomToken();
    const consumed = await c.env.DB.prepare(
      "UPDATE mcp_authorization_requests SET consumed_at = CURRENT_TIMESTAMP WHERE request_id = ? AND consumed_at IS NULL",
    )
      .bind(body.request_id)
      .run();
    if ((consumed.meta.changes ?? 0) !== 1) return c.json({ error: "invalid_request" }, 400);
    await c.env.DB.batch([
      c.env.DB.prepare(
        "INSERT INTO mcp_authorization_codes (code_hash, request_id, client_id, user_id, organization_id, redirect_uri, resource, scope, code_challenge, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        await digest(code),
        request.requestId,
        request.clientId,
        userId,
        membership.organizationId,
        request.redirectUri,
        request.resource,
        request.scope,
        request.codeChallenge,
        new Date(Date.now() + tokenTtls.AUTH_CODE_TTL_SECONDS * 1000).toISOString(),
      ),
    ]);
    await recordOAuthEvent(c.env, userId, "MCP OAuth consent granted");
    const redirect = new URL(request.redirectUri);
    redirect.searchParams.set("code", code);
    if (request.state) redirect.searchParams.set("state", request.state);
    return c.json({ redirect_uri: redirect.toString() });
  });

  app.post(operationPath("mcpToken"), async (c) => {
    if (!c.env.DB) return c.json({ error: "temporarily_unavailable" }, 503);
    const form = await c.req.parseBody();
    const clientId = String(form.client_id ?? "");
    const resourceResult = validateMcpResource(String(form.resource ?? ""), c.env);
    const resource = resourceResult.ok ? resourceResult.value : null;
    if (!clientId || !resource) return c.json({ error: "invalid_request" }, 400);
    if (String(form.grant_type) === "authorization_code") {
      const rawCode = String(form.code ?? "");
      const row = await c.env.DB.prepare(
        "SELECT code_hash AS codeHash, client_id AS clientId, user_id AS userId, organization_id AS organizationId, redirect_uri AS redirectUri, resource, scope, code_challenge AS codeChallenge, expires_at AS expiresAt, consumed_at AS consumedAt FROM mcp_authorization_codes WHERE code_hash = ? LIMIT 1",
      )
        .bind(await digest(rawCode))
        .first<{
          codeHash: string;
          clientId: string;
          userId: string;
          organizationId: string | null;
          redirectUri: string;
          resource: string;
          scope: string;
          codeChallenge: string;
          expiresAt: string;
          consumedAt: string | null;
        }>();
      const valid =
        row &&
        row.clientId === clientId &&
        row.resource === resource &&
        !row.consumedAt &&
        Date.parse(row.expiresAt) > Date.now() &&
        (await pkceMatches(String(form.code_verifier ?? ""), row.codeChallenge)) &&
        typeof form.redirect_uri === "string" &&
        String(form.redirect_uri) === row.redirectUri;
      if (!valid || !row) return c.json({ error: "invalid_grant" }, 400);
      const access = randomToken();
      const refresh = randomToken();
      const consumed = await c.env.DB.prepare(
        "UPDATE mcp_authorization_codes SET consumed_at = CURRENT_TIMESTAMP WHERE code_hash = ? AND consumed_at IS NULL",
      )
        .bind(row.codeHash)
        .run();
      if ((consumed.meta.changes ?? 0) !== 1) return c.json({ error: "invalid_grant" }, 400);
      await c.env.DB.batch([
        c.env.DB.prepare(
          "INSERT INTO mcp_access_tokens (token_hash, client_id, user_id, organization_id, resource, scope, issuer, audience, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).bind(
          await digest(access),
          row.clientId,
          row.userId,
          row.organizationId,
          row.resource,
          row.scope,
          issuer(c.env),
          mcpResource(c.env),
          new Date(Date.now() + tokenTtls.ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
        ),
        c.env.DB.prepare(
          "INSERT INTO mcp_refresh_tokens (token_hash, client_id, user_id, organization_id, resource, scope, issuer, audience, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).bind(
          await digest(refresh),
          row.clientId,
          row.userId,
          row.organizationId,
          row.resource,
          row.scope,
          issuer(c.env),
          mcpResource(c.env),
          new Date(Date.now() + tokenTtls.REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
        ),
      ]);
      await recordOAuthEvent(c.env, row.userId, "MCP OAuth access and refresh tokens issued");
      return c.json(tokenResponse(access, refresh, row.scope));
    }
    if (String(form.grant_type) === "refresh_token") {
      const raw = String(form.refresh_token ?? "");
      const row = await c.env.DB.prepare(
        "SELECT token_hash AS tokenHash, client_id AS clientId, user_id AS userId, organization_id AS organizationId, resource, scope, issuer, audience, expires_at AS expiresAt, rotated_at AS rotatedAt FROM mcp_refresh_tokens WHERE token_hash = ? LIMIT 1",
      )
        .bind(await digest(raw))
        .first<{
          tokenHash: string;
          clientId: string;
          userId: string;
          organizationId: string | null;
          resource: string;
          scope: string;
          issuer: string;
          audience: string;
          expiresAt: string;
          rotatedAt: string | null;
        }>();
      if (!row) return c.json({ error: "invalid_grant" }, 400);
      if (row.rotatedAt) {
        await c.env.DB.batch([
          c.env.DB.prepare(
            "UPDATE mcp_refresh_tokens SET rotated_at = COALESCE(rotated_at, CURRENT_TIMESTAMP) WHERE client_id = ? AND user_id = ? AND resource = ? AND organization_id = ?",
          ).bind(row.clientId, row.userId, row.resource, row.organizationId),
          c.env.DB.prepare(
            "UPDATE mcp_access_tokens SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE client_id = ? AND user_id = ? AND resource = ? AND organization_id = ?",
          ).bind(row.clientId, row.userId, row.resource, row.organizationId),
        ]);
        await recordOAuthEvent(c.env, row.userId, "MCP OAuth refresh-token reuse detected");
        return c.json({ error: "invalid_grant" }, 400);
      }
      if (
        row.clientId !== clientId ||
        row.resource !== resource ||
        row.issuer !== issuer(c.env) ||
        row.audience !== mcpResource(c.env) ||
        row.rotatedAt ||
        Date.parse(row.expiresAt) <= Date.now()
      )
        return c.json({ error: "invalid_grant" }, 400);
      const access = randomToken();
      const nextRefresh = randomToken();
      const rotated = await c.env.DB.prepare(
        "UPDATE mcp_refresh_tokens SET rotated_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND rotated_at IS NULL",
      )
        .bind(row.tokenHash)
        .run();
      if ((rotated.meta.changes ?? 0) !== 1) return c.json({ error: "invalid_grant" }, 400);
      await c.env.DB.batch([
        c.env.DB.prepare(
          "INSERT INTO mcp_access_tokens (token_hash, client_id, user_id, organization_id, resource, scope, issuer, audience, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).bind(
          await digest(access),
          row.clientId,
          row.userId,
          row.organizationId,
          row.resource,
          row.scope,
          issuer(c.env),
          mcpResource(c.env),
          new Date(Date.now() + tokenTtls.ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
        ),
        c.env.DB.prepare(
          "INSERT INTO mcp_refresh_tokens (token_hash, client_id, user_id, organization_id, resource, scope, issuer, audience, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).bind(
          await digest(nextRefresh),
          row.clientId,
          row.userId,
          row.organizationId,
          row.resource,
          row.scope,
          issuer(c.env),
          mcpResource(c.env),
          new Date(Date.now() + tokenTtls.REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
        ),
      ]);
      await recordOAuthEvent(c.env, row.userId, "MCP OAuth tokens rotated");
      return c.json(tokenResponse(access, nextRefresh, row.scope));
    }
    return c.json({ error: "unsupported_grant_type" }, 400);
  });

  app.post(operationPath("mcpRevoke"), async (c) => {
    if (!c.env.DB) return c.json({ error: "temporarily_unavailable" }, 503);
    const token = await findMcpToken(
      c.env.DB,
      bearerToken(c.req.raw),
      issuer(c.env),
      mcpResource(c.env),
    );
    if (!token) return c.json({ error: "invalid_token" }, 401);
    await c.env.DB.prepare(
      "UPDATE mcp_access_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ?",
    )
      .bind(await digest(bearerToken(c.req.raw) ?? ""))
      .run();
    await c.env.DB.prepare(
      "UPDATE mcp_refresh_tokens SET rotated_at = CURRENT_TIMESTAMP WHERE client_id = ? AND user_id = ? AND resource = ? AND organization_id = ? AND rotated_at IS NULL",
    )
      .bind(token.clientId, token.userId, token.resource, token.organizationId)
      .run();
    await recordOAuthEvent(c.env, token.userId, "MCP OAuth connection revoked");
    return c.body(null, 200);
  });

  app.all(operationPath("mcp"), async (c) => {
    const resource = mcpResource(c.env);
    const token = await findMcpToken(c.env.DB, bearerToken(c.req.raw), issuer(c.env), resource);
    const membership =
      token && c.env.DB
        ? await c.env.DB.prepare(
            "SELECT 1 AS present FROM memberships WHERE user_id = ? AND organization_id = ? LIMIT 1",
          )
            .bind(token.userId, token.organizationId)
            .first<{ present: number }>()
        : null;
    if (!token || token.resource !== resource || !parseScope(token.scope) || !membership) {
      c.header(
        "WWW-Authenticate",
        `Bearer resource_metadata="${issuer(c.env)}/.well-known/oauth-protected-resource"`,
      );
      return c.json(
        {
          error: "invalid_token",
          error_description: "A valid AmbiOS MCP bearer token is required.",
        },
        401,
      );
    }
    if (c.req.method === "GET")
      return c.json({
        name: "ambios-ai",
        version: "1.0.0",
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        tools: MCP_TOOLS.filter((tool) => hasScope(token.scope, tool.scope)).map((tool) => ({
          name: tool.name,
          description: tool.description,
          operationIds: tool.operationIds,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
          annotations: tool.annotations,
        })),
      });
    const body = (await c.req.json().catch(() => null)) as {
      jsonrpc?: string;
      id?: string | number;
      method?: string;
    } | null;
    if (body?.method === "initialize")
      return c.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "ambios-ai", version: "1.0.0" },
        },
      });
    if (body?.method === "tools/list")
      return c.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          tools: MCP_TOOLS.filter((tool) => hasScope(token.scope, tool.scope)).map((tool) => ({
            name: tool.name,
            description: tool.description,
            operationIds: tool.operationIds,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
            annotations: tool.annotations,
          })),
        },
      });
    if (body?.method === "tools/call") {
      const call = (body as { params?: { name?: string; arguments?: Record<string, unknown> } })
        .params;
      const name = call?.name;
      const tool = MCP_TOOLS.find((candidate) => candidate.name === name);
      if (!name || !tool || !hasScope(token.scope, tool.scope)) {
        return c.json({
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32602, message: "Unknown or unavailable tool." },
        });
      }
      const args = call?.arguments ?? {};
      if (!args || typeof args !== "object" || Array.isArray(args))
        return c.json({
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32602, message: "Tool arguments must be an object." },
        });
      const allowedArgumentKeys: Record<string, readonly string[]> = {
        get_workspace_readiness: [],
        get_current_workspace_context: [],
        list_active_incidents: [],
        get_audit_timeline: [],
        get_incident_context: ["incidentRef"],
        create_structured_proposal: ["incidentRef", "objective", "requestedAction"],
        get_approval_status: ["actionRef"],
        inspect_action_or_run: ["actionRef"],
        get_verification_result: ["actionRef"],
      };
      const unknownArgument = Object.keys(args).find(
        (key) => !allowedArgumentKeys[name]?.includes(key),
      );
      if (unknownArgument)
        return c.json({
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32602, message: `Unsupported tool argument: ${unknownArgument}.` },
        });
      const incidentRef = typeof args.incidentRef === "string" ? args.incidentRef.trim() : "";
      const actionRef = typeof args.actionRef === "string" ? args.actionRef.trim() : "";
      if (["get_incident_context", "create_structured_proposal"].includes(name) && !incidentRef)
        return c.json({
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32602, message: "incidentRef is required." },
        });
      if (
        ["get_approval_status", "inspect_action_or_run", "get_verification_result"].includes(
          name,
        ) &&
        !actionRef
      )
        return c.json({
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32602, message: "actionRef is required." },
        });
      if (!c.env.DB)
        return c.json({
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32603, message: "Workspace storage is unavailable." },
        });
      const organization = token.organizationId
        ? await c.env.DB.prepare("SELECT id, name FROM organizations WHERE id = ? LIMIT 1")
            .bind(token.organizationId)
            .first<{ id: string; name: string }>()
        : null;
      if (!organization)
        return c.json({
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32003, message: "No workspace is available for this user." },
        });
      let result: unknown;
      if (name === "get_current_workspace_context") {
        result = publicToolResult(name, { organization });
      } else if (name === "get_workspace_readiness") {
        const integrations = await c.env.DB.prepare(
          "SELECT provider, status, last_sync_at AS lastSyncAt FROM integrations WHERE organization_id = ? ORDER BY provider",
        )
          .bind(organization.id)
          .all<{ provider: string; status: string; lastSyncAt: string | null }>();
        const connected = integrations.results.filter((item) => item.status === "connected");
        result = publicToolResult(name, {
          ready: connected.length > 0,
          integrations: integrations.results,
        });
      } else if (name === "list_active_incidents") {
        const incidents = await c.env.DB.prepare(
          "SELECT id, title, service, severity, status, created_at AS createdAt FROM incidents WHERE organization_id = ? AND status NOT IN ('resolved', 'closed') ORDER BY created_at DESC LIMIT 100",
        )
          .bind(organization.id)
          .all();
        result = publicToolResult(name, { incidents: incidents.results });
      } else if (name === "get_incident_context") {
        const incident = await c.env.DB.prepare(
          "SELECT id, title, service, severity, status, context FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
        )
          .bind(incidentRef, organization.id)
          .first<{
            id: string;
            title: string;
            service: string;
            severity: string;
            status: string;
            context: string;
          }>();
        if (!incident)
          return c.json({
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32004, message: "Incident is unavailable in this workspace." },
          });
        let context: Record<string, unknown> = {};
        try {
          const parsed = JSON.parse(incident.context || "{}");
          if (parsed && typeof parsed === "object") context = parsed as Record<string, unknown>;
        } catch {
          context = {};
        }
        const strings = (value: unknown) =>
          Array.isArray(value)
            ? value.filter((item): item is string => typeof item === "string").slice(0, 20)
            : [];
        result = {
          incidentRef: incident.id,
          title: incident.title,
          service: incident.service,
          severity: incident.severity,
          status: incident.status,
          verifiedFacts: strings(context.verifiedFacts),
          unknowns: strings(context.unknowns),
          source: "incident-record",
        };
      } else if (name === "create_structured_proposal") {
        const objective = typeof args.objective === "string" ? args.objective.trim() : "";
        const requestedAction =
          typeof args.requestedAction === "string" ? args.requestedAction.trim() : "";
        if (
          objective.length < 10 ||
          objective.length > 1000 ||
          requestedAction.length < 10 ||
          requestedAction.length > 1000
        )
          return c.json({
            jsonrpc: "2.0",
            id: body.id,
            error: {
              code: -32602,
              message: "objective and requestedAction must each be 10–1000 characters.",
            },
          });
        const incident = await c.env.DB.prepare(
          "SELECT id FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
        )
          .bind(incidentRef, organization.id)
          .first<{ id: string }>();
        if (!incident)
          return c.json({
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32004, message: "Incident is unavailable in this workspace." },
          });
        const proposalRef = crypto.randomUUID();
        await c.env.DB.prepare(
          "INSERT INTO actions (id, organization_id, actor_type, actor_id, incident_id, action_type, input_json, output_json, status, approval_state, summary, operation_id) VALUES (?, ?, 'mcp', ?, ?, 'structured_proposal', ?, '{}', 'proposed', 'pending', ?, 'requestHotfixApproval')",
        )
          .bind(
            proposalRef,
            organization.id,
            token.userId,
            incidentRef,
            JSON.stringify({ objective, requestedAction }),
            objective.slice(0, 240),
          )
          .run();
        result = {
          proposalRef,
          status: "proposed",
          approvalRequired: true,
          source: "action-record",
        };
      } else if (
        ["get_approval_status", "inspect_action_or_run", "get_verification_result"].includes(name)
      ) {
        const action = await c.env.DB.prepare(
          "SELECT id, status, approval_state AS approvalState, summary, output_json AS outputJson FROM actions WHERE id = ? AND organization_id = ? LIMIT 1",
        )
          .bind(actionRef, organization.id)
          .first<{
            id: string;
            status: string;
            approvalState: string;
            summary: string;
            outputJson: string;
          }>();
        if (!action)
          return c.json({
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32004, message: "Action is unavailable in this workspace." },
          });
        if (name === "get_approval_status")
          result = {
            actionRef: action.id,
            status: action.status,
            approvalState: action.approvalState,
            source: "action-record",
          };
        else if (name === "inspect_action_or_run")
          result = {
            actionRef: action.id,
            status: action.status,
            summary: action.summary,
            source: "action-record",
          };
        else {
          let output: Record<string, unknown> = {};
          try {
            output = JSON.parse(action.outputJson || "{}");
          } catch {
            output = {};
          }
          const available = Boolean(
            output.verification || output.verified || output.verificationStatus,
          );
          result = {
            actionRef: action.id,
            status: available ? "available" : "not_available",
            available,
            source: "action-record",
          };
        }
      } else {
        const actions = await c.env.DB.prepare(
          "SELECT id, action_type AS actionType, status, summary, created_at AS createdAt, completed_at AS completedAt FROM actions WHERE organization_id = ? ORDER BY created_at DESC LIMIT 100",
        )
          .bind(organization.id)
          .all();
        result = publicToolResult(name, { events: actions.results });
      }
      const auditId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO actions (id, organization_id, actor_type, actor_id, action_type, input_json, output_json, status, approval_state, summary) VALUES (?, ?, 'mcp', ?, 'mcp_tool_call', ?, ?, 'succeeded', 'not_required', ?)",
      )
        .bind(
          auditId,
          organization.id,
          token.userId,
          JSON.stringify(call?.arguments ?? {}),
          JSON.stringify(result),
          `MCP tool ${name}`,
        )
        .run();
      return c.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        },
      });
    }
    return c.json({
      jsonrpc: "2.0",
      id: body?.id ?? null,
      error: { code: -32601, message: "Tool execution is not available for this request." },
    });
  });
  return app;
}
