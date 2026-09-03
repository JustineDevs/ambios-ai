import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  INTEGRATION_CATALOG,
  INTEGRATION_PERMISSIONS,
  safeIntegrationConnection,
} from "../packages/shared";
import {
  NANGO_PROVIDERS,
  nangoProviderConfigKey,
} from "../packages/shared/nango-provider-registry";
import { operationPath, operations } from "../packages/shared/operations";
import { serviceOriginsFromEnv } from "../packages/shared/service-origins";
import { buildCanvasTopology } from "./canvas-topology";
import { createMcpRoutes } from "./mcp-routes";
import { registerOperation } from "./operation-routes";
import { problem } from "./problem";
import { enforceSage } from "./sage-governance";

export type HonoBindings = {
  ENVIRONMENT?: string;
  AUTH_DISABLE?: string;
  DB?: D1Database;
  KV?: KVNamespace;
  R2?: R2Bucket;
  QUEUE?: Queue;
  NANGO_SECRET_KEY?: string;
  NANGO_HOST?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  MCP_AUTHORIZATION_SERVER_URL?: string;
  MCP_AUTH_UI_URL?: string;
  MCP_RESOURCE_URL?: string;
  OPENAI_APPS_CHALLENGE_TOKEN?: string;
  NEXT_PUBLIC_APP_URL?: string;
  AMBIOS_WORKER_URL?: string;
  AMBIOS_CONNECTOR_URL?: string;
  NANGO_WEBHOOK_URL?: string;
};

type HonoVariables = { userId: string };

function authDisabled(env: HonoBindings) {
  return ["development", "test"].includes(env.ENVIRONMENT ?? "") && env.AUTH_DISABLE === "true";
}

async function verifySupabaseUser(c: {
  env: HonoBindings;
  req: { header(name: string): string | undefined };
}) {
  const authorization = c.req.header("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY) return null;
  try {
    const response = await fetch(`${c.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: c.env.SUPABASE_ANON_KEY, Authorization: authorization },
    });
    if (!response.ok) return null;
    const user = (await response.json().catch(() => null)) as { id?: string } | null;
    return user?.id ?? null;
  } catch {
    // Treat an unavailable identity provider as an unauthenticated request.
    // The middleware emits the structured auth response; it must not leak a 500.
    return null;
  }
}

async function organizationFor(c: { env: HonoBindings; get(name: "userId"): string }) {
  if (!c.env.DB) return null;
  return c.env.DB.prepare(
    "SELECT o.id, o.name, o.created_at AS createdAt FROM organizations o JOIN memberships m ON m.organization_id = o.id WHERE m.user_id = ? ORDER BY o.created_at LIMIT 1",
  )
    .bind(c.get("userId"))
    .first<{ id: string; name: string; createdAt: string }>();
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const INTEGRATION_PROVIDERS = INTEGRATION_CATALOG.map((entry) => entry.provider);
const PROVIDER_DISPLAY_NAMES = Object.fromEntries(
  INTEGRATION_CATALOG.map((entry) => [entry.provider, entry.label]),
);
const PROVIDER_CAPABILITY_LINES = Object.fromEntries(
  INTEGRATION_CATALOG.map((entry) => [
    entry.provider,
    [...INTEGRATION_PERMISSIONS[entry.provider]],
  ]),
);

function isAvailableProvider(provider: string) {
  return (
    NANGO_PROVIDERS.has(provider) &&
    INTEGRATION_CATALOG.find((entry) => entry.provider === provider)?.phase !== "roadmap"
  );
}

function nangoProviderKey(provider: string) {
  return nangoProviderConfigKey(provider);
}

async function nangoRequest(c: { env: HonoBindings }, path: string, init?: RequestInit) {
  const secret = c.env.NANGO_SECRET_KEY;
  if (!secret) throw new Error("NANGO_SECRET_KEY is not configured");
  const host = (c.env.NANGO_HOST ?? "https://api.nango.dev").replace(/\/$/, "");
  if (!host.startsWith("https://")) throw new Error("NANGO_HOST must use HTTPS");
  const response = await fetch(`${host}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const errorPayload =
      typeof payload === "object" && payload && "error" in payload ? payload.error : null;
    const detail =
      typeof errorPayload === "string"
        ? errorPayload
        : typeof errorPayload === "object" && errorPayload && "message" in errorPayload
          ? typeof errorPayload.message === "string"
            ? errorPayload.message
            : null
          : typeof payload === "object" && payload && "message" in payload
            ? typeof payload.message === "string"
              ? payload.message
              : null
            : typeof payload === "object" && payload && "detail" in payload
              ? typeof payload.detail === "string"
                ? payload.detail
                : null
              : null;
    throw new Error(
      `Nango request failed (${response.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`,
    );
  }
  return payload as Record<string, unknown>;
}

async function triggerNangoAction(
  c: {
    env: HonoBindings;
    req: { header: (name: string) => string | undefined };
    get: (key: "userId") => string;
  },
  provider: string,
  actionName: string,
  input: Record<string, unknown>,
  connectionId?: string,
) {
  if (!isAvailableProvider(provider)) {
    const error = new Error(`${PROVIDER_DISPLAY_NAMES[provider] ?? provider} is not available.`);
    error.name = "PROVIDER_UNAVAILABLE";
    throw error;
  }
  const authDisabled =
    ["development", "test"].includes(c.env.ENVIRONMENT ?? "") && c.env.AUTH_DISABLE === "true";
  if (!c.req.header("Authorization") && !authDisabled) {
    const error = new Error("A user session is required for this operation.");
    error.name = "AUTH_REQUIRED";
    throw error;
  }
  if (!c.env.DB) throw new Error("DB is not configured");
  const organization = await c.env.DB.prepare(
    "SELECT o.id FROM organizations o JOIN memberships m ON m.organization_id = o.id WHERE m.user_id = ? ORDER BY o.created_at LIMIT 1",
  )
    .bind(c.get("userId"))
    .first<{ id: string }>();
  if (!organization) throw new Error("Workspace not found");
  const connection = await c.env.DB.prepare(
    "SELECT connection_id AS connectionId FROM integrations WHERE organization_id = ? AND provider = ? AND status = 'connected' AND (? IS NULL OR connection_id = ?) ORDER BY created_at DESC LIMIT 1",
  )
    .bind(organization.id, provider, connectionId ?? null, connectionId ?? null)
    .first<{ connectionId: string }>();
  if (!connection?.connectionId) throw new Error(`Connect ${provider} before running this action`);
  const operationId = crypto.randomUUID();
  const readOnlyActions = new Set([
    "get_vulnerabilities",
    "analyze_package",
    "get_supply_chain_report",
    "detect_malware",
    "dependabot.list_alerts",
    "code_scanning.list_alerts",
    "secret_scanning.list_alerts",
  ]);
  const argumentsJson = JSON.stringify(input);
  const argumentsDigest = await sha256(argumentsJson);
  await enforceSage(c.env.DB, {
    operationId,
    operationClass: readOnlyActions.has(actionName) ? "read" : "mutation",
    actorId: c.get("userId"),
    organizationId: organization.id,
    workspaceId: organization.id,
    capability: `provider.${readOnlyActions.has(actionName) ? "read" : "proposal"}`,
    target: `${provider}:${connection.connectionId}`,
    argumentsJson,
    argumentsHash: argumentsDigest,
  });
  return nangoRequest(c, "/action/trigger", {
    method: "POST",
    headers: {
      "Connection-Id": connection.connectionId,
      "Provider-Config-Key": nangoProviderKey(provider),
    },
    body: JSON.stringify({ action_name: actionName, input }),
  });
}

/**
 * Cloudflare-native edge surface for the AmbiOS backend. The Next.js browser
 * application mounts the canonical WebMCP registry; Hono owns Worker-native
 * probes and the stable API/MCP gateway boundary.
 */
export function createHonoApp() {
  const app = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables }>();
  const apiPrefix = operationPath("getHealth").replace(/\/[^/]+$/, "");
  const healthPath = operationPath("getCoreHealth");
  const apiHealthPath = operationPath("getHealth");
  const readinessPath = operationPath("getReadiness");
  const mcpRequestPrefix = operationPath("mcpAuthorizationRequest").replace(/\/[^/]+$/, "");
  const publicMcpPaths = new Set([
    operationPath("mcpAuthorizationMetadata"),
    operationPath("mcpResourceMetadata"),
    operationPath("mcpResourceMetadataForMcp"),
    operationPath("mcpRegister"),
    operationPath("mcpAuthorize"),
    operationPath("mcpToken"),
    operationPath("mcpChallenge"),
  ]);

  // The canonical browser path is same-origin through Vercel rewrites. These
  // explicit origins support the canonical local browser and direct
  // authenticated Worker diagnostics. Credentials are never accepted from
  // arbitrary origins.
  app.use(
    "*",
    cors({
      origin: (origin, c) => {
        const configured = serviceOriginsFromEnv({
          NODE_ENV: c.env.ENVIRONMENT === "production" ? "production" : "development",
          NEXT_PUBLIC_APP_URL: c.env.NEXT_PUBLIC_APP_URL,
          AMBIOS_WORKER_URL: c.env.AMBIOS_WORKER_URL,
          AMBIOS_CONNECTOR_URL: c.env.AMBIOS_CONNECTOR_URL,
          MCP_RESOURCE_URL: c.env.MCP_RESOURCE_URL,
          MCP_AUTHORIZATION_SERVER_URL: c.env.MCP_AUTHORIZATION_SERVER_URL,
          NANGO_WEBHOOK_URL: c.env.NANGO_WEBHOOK_URL,
        });
        if (origin === configured.frontendOrigin) return origin;
        if (c.env.ENVIRONMENT !== "production" && origin === "http://127.0.0.1:3000") return origin;
        // Returning the configured origin for an unknown requester would make
        // CORS responses misleading. Reject unknown origins instead.
        return undefined;
      },
      allowHeaders: ["Authorization", "Content-Type", "X-API-Key", "X-Ambios-Connection-Id"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      maxAge: 600,
    }),
  );

  app.use("/*", async (c, next) => {
    if (
      publicMcpPaths.has(c.req.path) ||
      c.req.path === healthPath ||
      c.req.path === apiHealthPath ||
      c.req.path === readinessPath ||
      c.req.path.startsWith(mcpRequestPrefix)
    )
      return next();
    if (!c.req.path.startsWith(apiPrefix)) return next();
    if (authDisabled(c.env) && !c.req.header("Authorization")) {
      c.set("userId", "dev-user");
      return next();
    }
    const userId = await verifySupabaseUser(c);
    if (!userId)
      return problem(
        c,
        c.env.SUPABASE_URL ? 401 : 503,
        c.env.SUPABASE_URL ? "AUTH_REQUIRED" : "RUNTIME_BINDINGS_MISSING",
        c.env.SUPABASE_URL
          ? "A valid Supabase session is required."
          : "Worker authentication is not configured; set SUPABASE_URL and SUPABASE_ANON_KEY.",
        { operationId: "authenticatedRequest" },
      );
    c.set("userId", userId);
    return next();
  });

  app.use("*", async (c, next) => {
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();
    c.header("X-Request-ID", requestId);
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    c.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    c.header("Cross-Origin-Resource-Policy", "same-origin");
    if (c.req.path.startsWith(apiPrefix) || c.req.path === operationPath("mcp")) {
      c.header("Cache-Control", "no-store");
    }
    if (c.env.ENVIRONMENT === "production") {
      c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    // Cloudflare Workers Logs indexes structured fields. Keep this event
    // deliberately metadata-only: no query string, authorization header,
    // request body, email, vendor payload, or credential-shaped value.
    console.log({
      event: "http_request",
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - startedAt,
      environment: c.env.ENVIRONMENT ?? "unknown",
    });
  });

  registerOperation(app, operations.getCoreRoot, (c) =>
    c.json({ service: "ambios-ai", runtime: "hono", status: "ready" }),
  );

  registerOperation(app, operations.getCoreHealth, (c) =>
    c.json({ service: "ambios-ai", runtime: "hono", status: "ok" }),
  );

  registerOperation(app, operations.getHealth, (c) =>
    c.json({ service: "ambios-ai", runtime: "hono", status: "ok" }),
  );

  app.get(operationPath("getCanvas"), async (c) => {
    if (!readAccess(c))
      return c.json({ code: "AUTH_REQUIRED", error: "A user session is required." }, 401);
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const canvasId = c.req.param("canvasId");
    const shareLink = c.req.query("shareLink");
    const organization = await organizationFor(c);
    const row = shareLink
      ? await c.env.DB.prepare(
          "SELECT i.id, i.organization_id AS organizationId, i.title, i.context, i.status, i.service, i.severity FROM incidents i JOIN canvas_shares s ON s.canvas_id = i.id AND s.organization_id = i.organization_id WHERE i.id = ? AND s.share_link = ? AND s.mode = 'public' AND (s.expires_at IS NULL OR datetime(s.expires_at) > datetime('now')) LIMIT 1",
        )
          .bind(canvasId, shareLink)
          .first<{
            id: string;
            organizationId: string;
            title: string;
            context: string;
            status: string;
            service: string;
            severity: string;
          }>()
      : organization
        ? await c.env.DB.prepare(
            "SELECT id, organization_id AS organizationId, title, context, status, service, severity FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
          )
            .bind(canvasId, organization.id)
            .first<{
              id: string;
              organizationId: string;
              title: string;
              context: string;
              status: string;
              service: string;
              severity: string;
            }>()
        : null;
    if (!row)
      return c.json(
        { code: "CANVAS_NOT_FOUND", error: "Canvas is not available in this workspace." },
        404,
      );
    // Public share links intentionally expose only the shared incident. Related
    // lifecycle records are workspace-private and must never be inferred from a
    // caller's current organization.
    if (shareLink) {
      const { organizationId: _organizationId, ...incident } = row;
      const publicGraph = buildCanvasTopology({
        incident,
        actions: [],
        operations: [],
        decisions: [],
        docs: [],
        integrations: [],
      });
      return c.json({
        data: {
          incident,
          ...publicGraph,
          source: "public-share",
        },
      });
    }
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const [actionRows, operationRows, decisionRows, docRows, integrationRows] = await Promise.all([
      c.env.DB.prepare(
        "SELECT id, action_type AS actionType, status, approval_state AS approvalState, summary, operation_id AS operationId, related_resource_type AS relatedResourceType, related_resource_id AS relatedResourceId, created_at AS createdAt FROM actions WHERE organization_id = ? AND incident_id = ? ORDER BY created_at DESC LIMIT 50",
      )
        .bind(organization.id, canvasId)
        .all(),
      c.env.DB.prepare(
        "SELECT o.id, o.kind, o.state, o.resource_type AS resourceType, o.resource_id AS resourceId, o.updated_at AS updatedAt FROM operations o WHERE o.organization_id = ? AND EXISTS (SELECT 1 FROM actions a WHERE a.operation_id = o.id AND a.organization_id = ? AND a.incident_id = ?) ORDER BY o.updated_at DESC LIMIT 50",
      )
        .bind(organization.id, organization.id, canvasId)
        .all(),
      c.env.DB.prepare(
        "SELECT d.id, d.operation_id AS operationId, d.verdict, d.reason_code AS reasonCode, d.evaluated_at AS evaluatedAt FROM sage_decisions d WHERE d.organization_id = ? AND EXISTS (SELECT 1 FROM actions a WHERE a.operation_id = d.operation_id AND a.organization_id = ? AND a.incident_id = ?) ORDER BY d.evaluated_at DESC LIMIT 50",
      )
        .bind(organization.id, organization.id, canvasId)
        .all(),
      c.env.DB.prepare(
        "SELECT id, title, status, version FROM docs WHERE organization_id = ? AND incident_id = ? ORDER BY created_at DESC LIMIT 25",
      )
        .bind(organization.id, canvasId)
        .all(),
      c.env.DB.prepare(
        "SELECT id, provider, provider_display_name AS providerDisplayName, status, connection_health AS connectionHealth, resource_mapping_status AS resourceMappingStatus, mapped_resource_count AS mappedResourceCount FROM integrations WHERE organization_id = ? ORDER BY created_at DESC LIMIT 25",
      )
        .bind(organization.id)
        .all(),
    ]);
    const graph = buildCanvasTopology({
      incident: row,
      actions: actionRows.results as never,
      operations: operationRows.results as never,
      decisions: decisionRows.results as never,
      docs: docRows.results as never,
      integrations: integrationRows.results as never,
    });
    const { organizationId: _organizationId, ...incident } = row;
    return c.json({ data: { incident, ...graph } });
  });

  app.get(operationPath("getCanvasAccess"), async (c) => {
    if (!readAccess(c))
      return c.json({ code: "AUTH_REQUIRED", error: "A user session is required." }, 401);
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const canvasId = c.req.query("canvasId");
    const shareLink = c.req.query("shareLink");
    if (!canvasId) return c.json({ code: "VALIDATION_ERROR", error: "canvasId is required." }, 400);
    const organization = await organizationFor(c);
    if (organization) {
      const incident = await c.env.DB.prepare(
        "SELECT id FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
      )
        .bind(canvasId, organization.id)
        .first();
      if (incident)
        return c.json({
          data: { allowed: true, role: "member", permissions: { read: true, write: true } },
        });
    }
    if (!shareLink)
      return c.json({ data: { allowed: false, permissions: { read: false, write: false } } }, 403);
    const share = await c.env.DB.prepare(
      "SELECT mode, permissions FROM canvas_shares WHERE canvas_id = ? AND share_link = ? AND (expires_at IS NULL OR datetime(expires_at) > datetime('now')) LIMIT 1",
    )
      .bind(canvasId, shareLink)
      .first<{ mode: string; permissions: string }>();
    if (share?.mode !== "public") return c.json({ data: { allowed: false } }, 403);
    let permissions: Record<string, boolean>;
    try {
      permissions = JSON.parse(share.permissions) as Record<string, boolean>;
    } catch {
      return c.json({ code: "INVALID_SHARE" }, 403);
    }
    if (permissions.read === false) return c.json({ data: { allowed: false, permissions } }, 403);
    return c.json({
      data: { allowed: true, role: "viewer", permissions: { ...permissions, write: false } },
    });
  });

  app.get(operationPath("getCanvasRealtimeToken"), async (c) => {
    if (!readAccess(c))
      return c.json({ code: "AUTH_REQUIRED", error: "A user session is required." }, 401);
    return c.json(
      {
        code: "REALTIME_NOT_CONFIGURED",
        error: "Realtime authorization is not configured on this Worker.",
      },
      501,
    );
  });

  const readAccess = (c: {
    env: HonoBindings;
    req: { header(name: string): string | undefined };
  }) => Boolean(c.req.header("Authorization") || authDisabled(c.env));

  app.get(operationPath("getIdentity"), (c) => {
    if (!readAccess(c)) {
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    }
    if (authDisabled(c.env) && !c.req.header("Authorization")) {
      return c.json({
        id: "dev-user",
        email: "development@ambios.local",
        environment: "development",
      });
    }
    return c.json(
      {
        code: "IDENTITY_UNAVAILABLE",
        error: "Identity provider adapter is not attached to this Worker.",
      },
      501,
    );
  });

  app.get(operationPath("getWorkspace"), async (c) => {
    if (!readAccess(c)) {
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    }
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    try {
      const organization = await organizationFor(c);
      if (!organization) return c.json({ organization: null, agent: null });
      const agent = await c.env.DB.prepare(
        "SELECT id, name, status, created_at AS createdAt FROM agents WHERE organization_id = ? ORDER BY created_at LIMIT 1",
      )
        .bind(organization.id)
        .first<{ id: string; name: string; status: string; createdAt: string }>();
      return c.json({ organization, agent: agent ?? null });
    } catch {
      return c.json(
        {
          code: "WORKSPACE_UNAVAILABLE",
          error: "The workspace repository is not available in this runtime.",
        },
        503,
      );
    }
  });

  app.post(operationPath("createWorkspace"), async (c) => {
    if (!readAccess(c)) {
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    }
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const body = (await c.req.json<{ name?: string }>().catch(() => null)) as {
      name?: string;
    } | null;
    const name = body?.name?.trim();
    if (!name || name.length > 80)
      return c.json(
        { code: "VALIDATION_ERROR", error: "Workspace name must be 1–80 characters." },
        400,
      );
    const existing = await organizationFor(c);
    if (existing) return c.json({ organization: existing, agent: null, existing: true });
    const organizationId = crypto.randomUUID();
    const agentId = crypto.randomUUID();
    const userId = c.get("userId");
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO organizations (id, name) VALUES (?, ?)").bind(
        organizationId,
        name,
      ),
      c.env.DB.prepare(
        "INSERT INTO memberships (organization_id, user_id, role) VALUES (?, ?, 'owner')",
      ).bind(organizationId, userId),
      c.env.DB.prepare(
        "INSERT INTO agents (id, organization_id, name, status) VALUES (?, ?, 'AmbiOS AI', 'active')",
      ).bind(agentId, organizationId),
    ]);
    return c.json(
      {
        organization: { id: organizationId, name },
        agent: { id: agentId, name: "AmbiOS AI", status: "active" },
      },
      201,
    );
  });

  app.get(operationPath("getReadiness"), async (c) => {
    const missingBindings = ["DB", "KV", "R2", "QUEUE"].filter(
      (name) => !c.env[name as keyof HonoBindings],
    );
    if (missingBindings.length) {
      return c.json(
        { ready: false, runtime: "hono", blockers: ["runtime_bindings"], missingBindings },
        503,
      );
    }

    try {
      await c.env.DB?.prepare("SELECT 1 AS ok").first();
      // Readiness is a public binding probe. Tenant readiness is returned by authenticated workspace APIs.
      const workspace = null;
      const integrations = { results: [] as Record<string, unknown>[] };
      const integrationRows = integrations?.results ?? [];
      const blockers = ["workspace", "required_connectors"];
      return c.json({
        ready: false,
        runtime: "hono",
        blockers,
        workspace: workspace ?? null,
        integrations: integrationRows,
      });
    } catch {
      return c.json({ ready: false, runtime: "hono", blockers: ["database"] }, 503);
    }
  });

  app.get(operationPath("getCoreBackendStatus"), (c) =>
    c.json({
      data: {
        runtime: "hono",
        status: "ready",
        bindings: {
          db: Boolean(c.env.DB),
          kv: Boolean(c.env.KV),
          r2: Boolean(c.env.R2),
          queue: Boolean(c.env.QUEUE),
        },
      },
    }),
  );

  app.get(operationPath("getConsole"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const rows = await c.env.DB.prepare(
      "SELECT id, action_type AS actionType, status, approval_state AS approvalState, summary, created_at AS createdAt FROM actions WHERE organization_id = ? ORDER BY created_at DESC LIMIT 100",
    )
      .bind(organization.id)
      .all();
    return c.json({ data: { actions: rows.results ?? [] } });
  });

  // Keep the actions resource available as a first-class route for the dedicated
  // actions/approvals surfaces; the console remains the aggregate view.
  app.get(operationPath("listActions"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const rows = await c.env.DB.prepare(
      "SELECT id, action_type AS actionType, status, approval_state AS approvalState, summary, created_at AS createdAt FROM actions WHERE organization_id = ? ORDER BY created_at DESC LIMIT 100",
    )
      .bind(organization.id)
      .all();
    return c.json({ data: { actions: rows.results ?? [] } });
  });

  app.get(operationPath("listIncidents"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const rows = await c.env.DB.prepare(
      "SELECT id, title, service, severity, status, created_at AS createdAt FROM incidents WHERE organization_id = ? ORDER BY created_at DESC LIMIT 100",
    )
      .bind(organization.id)
      .all();
    return c.json({ data: { incidents: rows.results ?? [] } });
  });

  app.post(operationPath("createIncident"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);

    const idempotencyKey = c.req.header("Idempotency-Key");
    const body = (await c.req
      .json<{ title?: string; service?: string; severity?: string }>()
      .catch(() => null)) as { title?: string; service?: string; severity?: string } | null;

    const title = body?.title?.trim();
    const service = body?.service?.trim();
    const severity = body?.severity?.trim()?.toLowerCase();
    const VALID_SEVERITIES = new Set(["critical", "high", "medium", "low"]);

    if (!title || title.length > 200)
      return c.json({ code: "VALIDATION_ERROR", error: "title must be 1–200 characters." }, 400);
    if (!service || service.length > 100)
      return c.json({ code: "VALIDATION_ERROR", error: "service must be 1–100 characters." }, 400);
    if (!severity || !VALID_SEVERITIES.has(severity))
      return c.json(
        { code: "VALIDATION_ERROR", error: "severity must be critical, high, medium, or low." },
        400,
      );

    const organization = await organizationFor(c);
    if (!organization)
      return c.json(
        { code: "ORGANIZATION_REQUIRED", error: "Create an AmbiOS workspace first." },
        403,
      );

    if (idempotencyKey) {
      const existing = await c.env.DB.prepare(
        "SELECT response_json, response_status FROM idempotency_keys WHERE id = ? AND organization_id = ? AND operation = 'create_incident' LIMIT 1",
      )
        .bind(idempotencyKey, organization.id)
        .first<{ response_json: string; response_status: number }>();
      if (existing?.response_json)
        return c.json(JSON.parse(existing.response_json), existing.response_status as 201);
    }

    const incidentId = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      "INSERT INTO incidents (id, organization_id, title, service, severity, status) VALUES (?, ?, ?, ?, ?, 'open')",
    )
      .bind(incidentId, organization.id, title, service, severity)
      .run();

    const result = {
      data: { id: incidentId, title, service, severity, status: "open", createdAt: now },
    };

    if (idempotencyKey) {
      await c.env.DB.prepare(
        "INSERT INTO idempotency_keys (id, organization_id, operation, request_hash, status, response_status, response_json, completed_at) VALUES (?, ?, 'create_incident', ?, 'completed', 201, ?, ?) ON CONFLICT DO NOTHING",
      )
        .bind(idempotencyKey, organization.id, title, JSON.stringify(result), now)
        .run();
    }
    return c.json(result, 201);
  });

  app.get(operationPath("getIncident"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const incidentId = c.req.param("id");
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const incident = await c.env.DB.prepare(
      "SELECT id, title, service, severity, status, context, created_at AS createdAt FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
    )
      .bind(incidentId, organization.id)
      .first<{
        id: string;
        title: string;
        service: string;
        severity: string;
        status: string;
        context: string;
        createdAt: string;
      }>();
    if (!incident) return c.json({ code: "NOT_FOUND", error: "Incident not found." }, 404);
    return c.json({ data: { ...incident, context: JSON.parse(incident.context ?? "{}") } });
  });

  app.get(operationPath("getIncidentContext"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const incidentId = c.req.param("id");
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const incident = await c.env.DB.prepare(
      "SELECT id, title, service, severity, status, context, created_at AS createdAt FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
    )
      .bind(incidentId, organization.id)
      .first<{
        id: string;
        title: string;
        service: string;
        severity: string;
        status: string;
        context: string;
        createdAt: string;
      }>();
    if (!incident) return c.json({ code: "NOT_FOUND", error: "Incident not found." }, 404);

    const integrations = await c.env.DB.prepare(
      "SELECT provider, status FROM integrations WHERE organization_id = ? ORDER BY created_at DESC",
    )
      .bind(organization.id)
      .all();

    const ctx = JSON.parse(incident.context ?? "{}") as Record<string, unknown>;
    return c.json({
      data: {
        incidentId: incident.id,
        title: incident.title,
        service: incident.service,
        environment: (ctx.environment as string | undefined) ?? "staging",
        severity: incident.severity,
        status: incident.status,
        currentVersion: (ctx.currentVersion as string | undefined) ?? null,
        proposedVersion: (ctx.proposedVersion as string | undefined) ?? null,
        rollbackAvailable: (ctx.rollbackAvailable as boolean | undefined) ?? true,
        connectedProviders:
          integrations.results?.filter((i) => i.status === "connected").map((i) => i.provider) ??
          [],
        createdAt: incident.createdAt,
      },
    });
  });

  app.get(operationPath("suggestHotfixes"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const incidentId = c.req.param("id");
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const incident = await c.env.DB.prepare(
      "SELECT id, title, service, severity, status, context FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
    )
      .bind(incidentId, organization.id)
      .first<{
        id: string;
        title: string;
        service: string;
        severity: string;
        status: string;
        context: string;
      }>();
    if (!incident) return c.json({ code: "NOT_FOUND", error: "Incident not found." }, 404);

    const ctx = JSON.parse(incident.context ?? "{}") as Record<string, unknown>;
    const currentVersion = ctx.currentVersion as string | undefined;
    const proposedVersion = ctx.proposedVersion as string | undefined;
    const environment = (ctx.environment as string | undefined) ?? "staging";
    const risk = incident.severity === "critical" || incident.severity === "high" ? "high" : "low";
    const action =
      currentVersion && proposedVersion
        ? `Upgrade ${incident.service} from ${currentVersion} to ${proposedVersion} in ${environment}`
        : `Apply targeted remediation to ${incident.service} in ${environment}`;

    return c.json({
      data: {
        incidentId: incident.id,
        proposal: {
          action,
          target: incident.service,
          environment,
          risk,
          reason: `Resolve ${incident.severity} severity incident: ${incident.title}`,
          verification: [
            "Run dependency scan",
            `Run ${incident.service} health check`,
            "Confirm rollback artifact exists",
          ],
          approvalRequired: true,
          executionMode: "fixture",
          executionNote:
            "This action will be recorded in the AmbiOS audit log. Provider-backed execution requires a real connected adapter.",
        },
      },
    });
  });

  app.post(operationPath("evaluateGuardrails"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const body = (await c.req
      .json<{ instruction?: string; environment?: string }>()
      .catch(() => null)) as { instruction?: string; environment?: string } | null;

    const instruction = body?.instruction?.trim();
    const environment = body?.environment?.trim()?.toLowerCase() ?? "unknown";
    if (!instruction || instruction.length > 2000)
      return c.json(
        { code: "VALIDATION_ERROR", error: "instruction must be 1–2000 characters." },
        400,
      );

    const BLOCKED_PATTERNS = [
      /\b(delete|destroy|drop|truncate|wipe)\b/i,
      /\bproduction\b.*\b(delete|destroy|drop|remove)\b/i,
    ];
    const APPROVAL_PATTERNS = [
      /\bproduction\b/i,
      /\bdeploy\b/i,
      /\brollback\b/i,
      /\bhotfix\b/i,
      /\bupgrade\b/i,
      /\bpatch\b/i,
      /\bexecute\b/i,
      /\bapply\b/i,
    ];

    const blockedReasons: string[] = [];
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(instruction))
        blockedReasons.push(`Blocked pattern matched: ${pattern.source}`);
    }
    const requiresApproval =
      APPROVAL_PATTERNS.some((p) => p.test(instruction)) || environment === "production";
    const constraints: string[] = [];
    if (environment === "staging") constraints.push("staging only");
    if (environment !== "production") constraints.push("production excluded");
    if (/rollback/i.test(instruction)) constraints.push("rollback required");
    if (/scan/i.test(instruction)) constraints.push("post-deploy scan required");

    return c.json({
      data: {
        allowed: blockedReasons.length === 0,
        approvalRequired: requiresApproval,
        blockedReasons,
        constraints,
        policyVersion: "v1.0.0-semantic",
        environment,
        evaluatedAt: new Date().toISOString(),
      },
    });
  });

  app.post(operationPath("requestHotfixApproval"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);

    const body = (await c.req
      .json<{ incidentId?: string; instruction?: string; environment?: string }>()
      .catch(() => null)) as {
      incidentId?: string;
      instruction?: string;
      environment?: string;
    } | null;

    const incidentId = body?.incidentId?.trim();
    const instruction = body?.instruction?.trim();
    if (!incidentId || !instruction)
      return c.json(
        { code: "VALIDATION_ERROR", error: "incidentId and instruction are required." },
        400,
      );

    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);

    const incident = await c.env.DB.prepare(
      "SELECT id, title, service FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
    )
      .bind(incidentId, organization.id)
      .first<{ id: string; title: string; service: string }>();
    if (!incident)
      return c.json({ code: "NOT_FOUND", error: "Incident not found in this workspace." }, 404);

    const userId = c.get("userId");
    const environment = body?.environment?.trim()?.toLowerCase() ?? "staging";
    const tokenHash = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const capabilityHash = await sha256("ambios.incident.apply_hotfix");
    const argumentsHash = await sha256(JSON.stringify({ incidentId, instruction, environment }));

    await c.env.DB.prepare(
      "INSERT INTO approval_tokens (token_hash, user_id, organization_id, action_key, capability_hash, arguments_hash, incident_id, instruction, status, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
    )
      .bind(
        tokenHash,
        userId,
        organization.id,
        "ambios.incident.apply_hotfix",
        capabilityHash,
        argumentsHash,
        incidentId,
        instruction.slice(0, 2000),
        expiresAt,
      )
      .run();

    return c.json(
      {
        data: {
          approvalToken: tokenHash,
          incidentId,
          instruction: instruction.slice(0, 200) + (instruction.length > 200 ? "…" : ""),
          environment,
          expiresAt,
          approvedBy: userId,
          note: "Single-use token, expires in 5 minutes. The execution endpoint consumes it transactionally.",
        },
      },
      201,
    );
  });

  app.post(operationPath("executeHotfix"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);

    const idempotencyKey = c.req.header("Idempotency-Key");
    const body = (await c.req
      .json<{
        incidentId?: string;
        instruction?: string;
        environment?: string;
        approved?: boolean;
        approvalSource?: string;
        approvalToken?: string;
      }>()
      .catch(() => null)) as {
      incidentId?: string;
      instruction?: string;
      environment?: string;
      approved?: boolean;
      approvalSource?: string;
      approvalToken?: string;
    } | null;

    if (!body?.approved || body.approvalSource !== "human")
      return c.json(
        { code: "APPROVAL_REQUIRED", error: "A human approval token is required." },
        403,
      );

    const incidentId = body.incidentId?.trim();
    const instruction = body.instruction?.trim();
    const environment = body.environment?.trim().toLowerCase() ?? "staging";
    const approvalToken = body.approvalToken?.trim();
    if (!incidentId || !instruction || !approvalToken)
      return c.json(
        {
          code: "VALIDATION_ERROR",
          error: "incidentId, instruction, and approvalToken are required.",
        },
        400,
      );

    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);

    if (idempotencyKey) {
      const existing = await c.env.DB.prepare(
        "SELECT response_json, response_status FROM idempotency_keys WHERE id = ? AND organization_id = ? AND operation = 'apply_hotfix' LIMIT 1",
      )
        .bind(idempotencyKey, organization.id)
        .first<{ response_json: string; response_status: number }>();
      if (existing?.response_json)
        return c.json(JSON.parse(existing.response_json), existing.response_status as 200);
    }

    const incident = await c.env.DB.prepare(
      "SELECT id, title, service, severity, context FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
    )
      .bind(incidentId, organization.id)
      .first<{
        id: string;
        title: string;
        service: string;
        severity: string;
        context: string;
      }>();
    if (!incident)
      return c.json({ code: "NOT_FOUND", error: "Incident not found in this workspace." }, 404);

    const now = new Date().toISOString();

    // Transactionally consume approval token
    const tokenRow = await c.env.DB.prepare(
      "SELECT token_hash, user_id, organization_id, capability_hash, arguments_hash, incident_id, instruction, expires_at FROM approval_tokens WHERE token_hash = ? AND organization_id = ? AND action_key = 'ambios.incident.apply_hotfix' AND status = 'pending' LIMIT 1",
    )
      .bind(approvalToken, organization.id)
      .first<{
        token_hash: string;
        user_id: string;
        organization_id: string;
        capability_hash: string;
        arguments_hash: string;
        incident_id: string;
        instruction: string;
        expires_at: string;
      }>();
    if (!tokenRow)
      return c.json(
        { code: "APPROVAL_INVALID", error: "Approval token not found or already consumed." },
        403,
      );
    const requesterId = c.get("userId");
    if (tokenRow.user_id !== requesterId)
      return c.json(
        { code: "APPROVAL_FORBIDDEN", error: "Approval belongs to a different user." },
        403,
      );
    if (tokenRow.capability_hash !== (await sha256("ambios.incident.apply_hotfix")))
      return c.json(
        { code: "APPROVAL_MISMATCH", error: "Approval token capability does not match." },
        403,
      );
    if (tokenRow.incident_id !== incidentId)
      return c.json(
        { code: "APPROVAL_MISMATCH", error: "Approval token is for a different incident." },
        403,
      );
    const expectedArgumentsHash = await sha256(
      JSON.stringify({
        incidentId,
        instruction,
        environment,
      }),
    );
    if (tokenRow.arguments_hash !== expectedArgumentsHash)
      return c.json(
        { code: "APPROVAL_MISMATCH", error: "Approval token is for different arguments." },
        403,
      );
    if (new Date(tokenRow.expires_at) < new Date())
      return c.json({ code: "APPROVAL_EXPIRED", error: "Approval token has expired." }, 403);

    const consumed = await c.env.DB.prepare(
      "UPDATE approval_tokens SET status = 'consumed', consumed_at = ? WHERE token_hash = ? AND organization_id = ? AND user_id = ? AND action_key = 'ambios.incident.apply_hotfix' AND status = 'pending'",
    )
      .bind(now, approvalToken, organization.id, requesterId)
      .run();
    if ((consumed.meta.changes ?? 0) !== 1)
      return c.json(
        { code: "APPROVAL_CONFLICT", error: "Approval token was already consumed." },
        409,
      );

    const executionEnvironment = environment;
    const actionId = crypto.randomUUID();
    const operationId = crypto.randomUUID();
    const docId = crypto.randomUUID();
    const operationInput = { incidentId, instruction: instruction.slice(0, 500), environment };
    const requestHash = await sha256(JSON.stringify(operationInput));

    await c.env.DB.batch([
      // Operation lineage
      c.env.DB.prepare(
        "INSERT INTO operations (id, organization_id, actor_id, kind, tool, resource_type, resource_id, request_hash, state, result_json, created_at, updated_at) VALUES (?, ?, ?, 'hotfix', 'ambios.incident.apply_hotfix', 'incident', ?, ?, 'recorded', ?, ?, ?)",
      ).bind(
        operationId,
        organization.id,
        tokenRow.user_id,
        incidentId,
        requestHash,
        JSON.stringify({ ...operationInput, executionMode: "not_executed" }),
        now,
        now,
      ),
      // Append-only audit action
      c.env.DB.prepare(
        "INSERT INTO actions (id, organization_id, operation_id, incident_id, action_type, actor_id, actor_type, tool_id, input_json, approval_state, status, summary, created_at) VALUES (?, ?, ?, ?, 'hotfix', ?, 'human', 'ambios.incident.apply_hotfix', ?, 'approved', 'recorded', ?, ?)",
      ).bind(
        actionId,
        organization.id,
        operationId,
        incidentId,
        tokenRow.user_id,
        JSON.stringify({
          incidentId,
          instruction: instruction.slice(0, 500),
          environment,
          approvalToken: "[consumed]",
        }),
        `Hotfix: ${incident.title} on ${incident.service}`,
        now,
      ),
      // Update incident status
      c.env.DB.prepare(
        "UPDATE incidents SET status = 'in_progress' WHERE id = ? AND organization_id = ?",
      ).bind(incidentId, organization.id),
      // Doc proposal
      c.env.DB.prepare(
        "INSERT INTO docs (id, organization_id, incident_id, title, body, rationale, version, status) VALUES (?, ?, ?, ?, ?, ?, 1, 'proposal')",
      ).bind(
        docId,
        organization.id,
        incidentId,
        `Hotfix: ${incident.title}`,
        `Applied hotfix to ${incident.service}: ${instruction.slice(0, 500)}`,
        `Resolved ${incident.severity} incident with human-approved action.`,
      ),
    ]);

    const result = {
      data: {
        operationId,
        actionId,
        docId,
        incidentId,
        status: "recorded",
        executionMode: "not_executed",
        instruction: instruction.slice(0, 200) + (instruction.length > 200 ? "…" : ""),
        environment: executionEnvironment,
        approvedBy: tokenRow.user_id,
        executedAt: now,
        note: "No provider write was executed. This approved request was recorded for a configured provider adapter and requires a separate execution path.",
      },
    };

    if (idempotencyKey) {
      await c.env.DB.prepare(
        "INSERT INTO idempotency_keys (id, organization_id, operation, request_hash, status, response_status, response_json, completed_at) VALUES (?, ?, 'apply_hotfix', ?, 'completed', 200, ?, ?) ON CONFLICT DO NOTHING",
      )
        .bind(idempotencyKey, organization.id, approvalToken, JSON.stringify(result), now)
        .run();
    }
    return c.json(result);
  });

  app.get(operationPath("listIntegrations"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const organization = await organizationFor(c);
    if (!organization) return c.json({ data: { integrations: [], nextCursor: null } });
    const rows = await c.env.DB.prepare(
      "SELECT id, provider, status, connection_id AS connectionId, metadata, connection_health AS connectionHealth, capability_status AS capabilityStatus, capabilities_json AS capabilitiesJson, resource_mapping_status AS resourceMappingStatus, mapped_resource_count AS mappedResourceCount, last_connection_check_at AS lastConnectionCheckAt, last_successful_verification_at AS lastSuccessfulVerificationAt, last_sync_at AS lastSyncAt, last_sync_status AS lastSyncStatus, last_error AS lastError, created_at AS createdAt, updated_at AS updatedAt, version FROM integrations WHERE organization_id = ? ORDER BY created_at DESC LIMIT 100",
    )
      .bind(organization.id)
      .all<Record<string, unknown>>();
    const persisted = new Map<string, Record<string, unknown>>();
    for (const row of rows.results ?? []) {
      const provider = String(row.provider);
      if (!persisted.has(provider)) persisted.set(provider, row);
    }
    const providers = [...INTEGRATION_PROVIDERS].map((provider) => {
      const row = persisted.get(provider);
      const isRoadmapProvider = !isAvailableProvider(provider);
      const rawStatus = isRoadmapProvider ? "unsupported" : String(row?.status ?? "not_configured");
      const metadata =
        typeof row?.metadata === "string"
          ? (JSON.parse(row.metadata as string) as Record<string, unknown>)
          : {};
      const connectionStatus = rawStatus === "pending" ? "authorization_pending" : rawStatus;
      return safeIntegrationConnection({
        connectionId: typeof row?.connectionId === "string" ? row.connectionId : null,
        organizationId: organization.id,
        workspaceId: organization.id,
        providerId: provider,
        providerDisplayName: PROVIDER_DISPLAY_NAMES[provider] ?? provider,
        providerCategory:
          provider === "openai"
            ? "ai-client"
            : provider === "snyk" || provider === "socket"
              ? "security"
              : isRoadmapProvider
                ? "roadmap"
                : "productivity",
        connectionMode: provider === "openai" ? "provider_api_key" : "provider_oauth",
        connectionStatus: [
          "not_configured",
          "authorization_started",
          "authorization_pending",
          "connected",
          "disconnected",
          "error",
          "revoked",
          "reauthentication_required",
          "unsupported",
        ].includes(connectionStatus)
          ? (connectionStatus as never)
          : "error",
        connectionHealth:
          rawStatus === "connected"
            ? typeof row?.connectionHealth === "string"
              ? (row.connectionHealth as never)
              : "degraded"
            : rawStatus === "error"
              ? "failed"
              : "unknown",
        capabilityStatus:
          rawStatus === "connected"
            ? typeof row?.capabilityStatus === "string"
              ? (row.capabilityStatus as never)
              : "unverified"
            : rawStatus === "unsupported"
              ? "unsupported"
              : "unverified",
        capabilities:
          typeof row?.capabilitiesJson === "string"
            ? (() => {
                try {
                  const value = JSON.parse(row.capabilitiesJson);
                  const persisted = Array.isArray(value)
                    ? value.filter((entry): entry is string => typeof entry === "string")
                    : [];
                  return persisted.length > 0
                    ? persisted
                    : (PROVIDER_CAPABILITY_LINES[provider] ?? []);
                } catch {
                  return PROVIDER_CAPABILITY_LINES[provider] ?? [];
                }
              })()
            : (PROVIDER_CAPABILITY_LINES[provider] ?? []),
        resourceMappingStatus:
          typeof row?.resourceMappingStatus === "string"
            ? (row.resourceMappingStatus as never)
            : "not_required",
        mappedResourceCount:
          typeof row?.mappedResourceCount === "number" ? Math.max(0, row.mappedResourceCount) : 0,
        lastConnectionCheckAt:
          typeof row?.lastConnectionCheckAt === "string" ? row.lastConnectionCheckAt : null,
        lastSuccessfulVerificationAt:
          typeof row?.lastSuccessfulVerificationAt === "string"
            ? row.lastSuccessfulVerificationAt
            : null,
        lastSyncAt: typeof row?.lastSyncAt === "string" ? row.lastSyncAt : null,
        lastSyncStatus:
          row?.lastSyncStatus === "completed"
            ? "succeeded"
            : row?.lastSyncStatus === "processing"
              ? "running"
              : row?.lastSyncStatus === "failed"
                ? "failed"
                : "never_synced",
        lastErrorCode: typeof metadata.lastErrorCode === "string" ? metadata.lastErrorCode : null,
        lastErrorMessageSafe:
          typeof row?.lastError === "string" ? String(row.lastError).slice(0, 240) : null,
        nextAction:
          rawStatus === "pending"
            ? "Complete provider authorization"
            : rawStatus === "connected"
              ? "Verify access with a safe read"
              : "Connect to inspect available workspace resources",
        connectionCreatedAt: typeof row?.createdAt === "string" ? row.createdAt : null,
        connectionUpdatedAt: typeof row?.updatedAt === "string" ? row.updatedAt : null,
        providerMetadataVersion: String(metadata.providerMetadataVersion ?? "1"),
        version: typeof row?.version === "number" ? row.version : 1,
      });
    });
    return c.json({ data: { integrations: providers, nextCursor: null } });
  });

  app.get(operationPath("getMcpConnectionState"), async (c) => {
    if (!c.env.DB)
      return problem(
        c,
        503,
        "RUNTIME_BINDINGS_MISSING",
        "MCP connection state storage is not configured.",
        { operationId: "getMcpConnectionState" },
      );
    const token = await c.env.DB.prepare(
      "SELECT expires_at AS expiresAt, revoked_at AS revokedAt, created_at AS createdAt, scope FROM mcp_access_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    )
      .bind(c.get("userId"))
      .first<{ expiresAt: string; revokedAt: string | null; createdAt: string; scope: string }>();
    const state = !token
      ? "not_connected"
      : token.revokedAt
        ? "revoked"
        : new Date(token.expiresAt).getTime() <= Date.now()
          ? "expired"
          : "authorized";
    return c.json({
      data: {
        state,
        createdAt: token?.createdAt ?? null,
        expiresAt: token?.expiresAt ?? null,
        scopes: token?.scope?.split(/\\s+/).filter(Boolean) ?? [],
        auditAvailable: Boolean(token),
      },
    });
  });

  app.post(operationPath("checkBudget"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const body = (await c.req.json<{ estimatedCost?: number }>().catch(() => null)) as {
      estimatedCost?: number;
    } | null;
    if (
      typeof body?.estimatedCost !== "number" ||
      !Number.isInteger(body.estimatedCost) ||
      body.estimatedCost < 0
    )
      return c.json(
        { code: "VALIDATION_ERROR", error: "estimatedCost must be a non-negative integer." },
        400,
      );
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({
        data: { available: false, affordable: false, reason: "Workspace not found." },
      });
    const period = new Date().toISOString().slice(0, 7);
    const budget = await c.env.DB.prepare(
      "SELECT limit_amount AS limitAmount, spent_amount AS spentAmount, reserved_amount AS reservedAmount FROM budgets WHERE organization_id = ? AND period = ? LIMIT 1",
    )
      .bind(organization.id, period)
      .first<{ limitAmount: number; spentAmount: number; reservedAmount: number }>();
    if (!budget)
      return c.json({
        data: {
          available: false,
          affordable: false,
          reason: "No budget is configured for the current period.",
          period,
        },
      });
    const remaining = budget.limitAmount - budget.spentAmount - budget.reservedAmount;
    return c.json({
      data: {
        available: remaining > 0,
        affordable: body.estimatedCost <= remaining,
        remaining,
        period,
      },
    });
  });

  app.get(operationPath("getBudget"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const organization = await organizationFor(c);
    const period = new Date().toISOString().slice(0, 7);
    const budget = organization
      ? await c.env.DB.prepare(
          "SELECT limit_amount AS limitAmount, spent_amount AS spentAmount, reserved_amount AS reservedAmount FROM budgets WHERE organization_id = ? AND period = ? LIMIT 1",
        )
          .bind(organization.id, period)
          .first<{ limitAmount: number; spentAmount: number; reservedAmount: number }>()
      : null;
    if (!budget) return c.json({ data: { budget: null, period, configured: false } });
    return c.json({
      data: {
        configured: true,
        budget: {
          ...budget,
          available: budget.limitAmount - budget.spentAmount - budget.reservedAmount,
          period,
        },
      },
    });
  });

  app.post(operationPath("syncWorkspace"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const body = (await c.req
      .json<{ provider?: string; connectionId?: string }>()
      .catch(() => null)) as {
      provider?: string;
      connectionId?: string;
    } | null;
    const provider = body?.provider?.trim().toLowerCase();
    if (!provider || !isAvailableProvider(provider))
      return c.json({ code: "INVALID_PROVIDER", error: "Unsupported connector." }, 400);
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const integration = await c.env.DB.prepare(
      "SELECT connection_id AS connectionId FROM integrations WHERE organization_id = ? AND provider = ? AND status = 'connected' ORDER BY created_at DESC LIMIT 1",
    )
      .bind(organization.id, provider)
      .first<{ connectionId: string }>();
    if (!integration || (body?.connectionId && body.connectionId !== integration.connectionId))
      return c.json(
        { code: "INTEGRATION_NOT_CONNECTED", error: "Connect this provider before syncing." },
        409,
      );
    const syncJobId = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO sync_jobs (id, organization_id, provider, status, result_json) VALUES (?, ?, ?, 'queued', '{}')",
    )
      .bind(syncJobId, organization.id, provider)
      .run();
    return c.json({ data: { syncJobId, provider, status: "queued" } }, 202);
  });

  app.get(operationPath("listDocs"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const organization = await organizationFor(c);
    if (!organization) return c.json({ data: { docs: [] } });
    const rows = await c.env.DB.prepare(
      "SELECT id, title, status, version, created_at AS createdAt FROM docs WHERE organization_id = ? ORDER BY created_at DESC LIMIT 100",
    )
      .bind(organization.id)
      .all();
    return c.json({ data: { docs: rows.results ?? [] } });
  });

  app.get(operationPath("getDoc"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const doc = await c.env.DB.prepare(
      "SELECT id, title, body, rationale, version, status, incident_id AS incidentId, created_at AS createdAt FROM docs WHERE id = ? AND organization_id = ? LIMIT 1",
    )
      .bind(c.req.param("id"), organization.id)
      .first();
    if (!doc) return c.json({ code: "NOT_FOUND", error: "Document not found." }, 404);
    return c.json({ data: { doc } });
  });

  app.post(operationPath("createDocProposal"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const body = (await c.req
      .json<{ incidentId?: string; title?: string; body?: string; rationale?: string }>()
      .catch(() => null)) as {
      incidentId?: string;
      title?: string;
      body?: string;
      rationale?: string;
    } | null;
    const incidentId = body?.incidentId?.trim();
    const title = body?.title?.trim();
    const documentBody = body?.body?.trim();
    const rationale = body?.rationale?.trim();
    if (
      !incidentId ||
      !title ||
      !documentBody ||
      !rationale ||
      title.length > 200 ||
      documentBody.length > 20000 ||
      rationale.length > 2000
    )
      return c.json(
        {
          code: "VALIDATION_ERROR",
          error: "incidentId, title, body, and rationale are required within allowed limits.",
        },
        400,
      );
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const incident = await c.env.DB.prepare(
      "SELECT id FROM incidents WHERE id = ? AND organization_id = ? LIMIT 1",
    )
      .bind(incidentId, organization.id)
      .first();
    if (!incident)
      return c.json({ code: "NOT_FOUND", error: "Incident not found in this workspace." }, 404);
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO docs (id, organization_id, incident_id, title, body, rationale, version, status) VALUES (?, ?, ?, ?, ?, ?, 1, 'proposal')",
    )
      .bind(id, organization.id, incidentId, title, documentBody, rationale)
      .run();
    return c.json({ data: { id, incidentId, title, status: "proposal", version: 1 } }, 201);
  });

  app.get(operationPath("getSnykVulnerabilities"), async (c) => {
    const projectId = c.req.query("projectId");
    const severity = c.req.query("severity");
    try {
      const result = await triggerNangoAction(c, "snyk", "get_vulnerabilities", {
        ...(projectId ? { projectId } : {}),
        ...(severity ? { severity } : {}),
      });
      return c.json({ data: result });
    } catch (error) {
      return c.json(
        {
          code: "VENDOR_ACTION_UNAVAILABLE",
          error: error instanceof Error ? error.message : "Snyk action failed.",
        },
        503,
      );
    }
  });

  app.post(operationPath("runSnykScan"), async (c) => {
    const input = (await c.req.json<Record<string, unknown>>().catch(() => null)) ?? {};
    if (typeof input.projectId !== "string" || typeof input.scanType !== "string")
      return c.json(
        { code: "VALIDATION_ERROR", error: "projectId and scanType are required." },
        400,
      );
    try {
      const result = await triggerNangoAction(c, "snyk", "scan_project", input);
      return c.json({ data: result });
    } catch (error) {
      return c.json(
        {
          code: "VENDOR_ACTION_UNAVAILABLE",
          error: error instanceof Error ? error.message : "Snyk action failed.",
        },
        503,
      );
    }
  });

  app.post(operationPath("getSnykFix"), async (c) => {
    try {
      const result = await triggerNangoAction(c, "snyk", "suggest_fix", {
        vulnerabilityId: c.req.param("vulnerabilityId"),
      });
      return c.json({ data: result });
    } catch (error) {
      return c.json(
        {
          code: "VENDOR_ACTION_UNAVAILABLE",
          error: error instanceof Error ? error.message : "Snyk action failed.",
        },
        503,
      );
    }
  });

  app.get(operationPath("analyzeSocketPackage"), async (c) => {
    const packageName = c.req.query("package");
    const version = c.req.query("version");
    if (!packageName)
      return c.json({ code: "VALIDATION_ERROR", error: "package is required." }, 400);
    try {
      const result = await triggerNangoAction(c, "socket", "analyze_package", {
        packageName,
        ...(version ? { version } : {}),
      });
      return c.json({ data: result });
    } catch (error) {
      return c.json(
        {
          code: "VENDOR_ACTION_UNAVAILABLE",
          error: error instanceof Error ? error.message : "Socket action failed.",
        },
        503,
      );
    }
  });

  app.get(operationPath("getSocketReport"), async (c) => {
    try {
      const result = await triggerNangoAction(c, "socket", "get_supply_chain_report", {
        projectId: c.req.param("projectId"),
      });
      return c.json({ data: result });
    } catch (error) {
      return c.json(
        {
          code: "VENDOR_ACTION_UNAVAILABLE",
          error: error instanceof Error ? error.message : "Socket action failed.",
        },
        503,
      );
    }
  });

  app.get(operationPath("detectSocketMalware"), async (c) => {
    const packageName = c.req.query("package");
    if (!packageName)
      return c.json({ code: "VALIDATION_ERROR", error: "package is required." }, 400);
    try {
      const result = await triggerNangoAction(c, "socket", "detect_malware", { packageName });
      return c.json({ data: result });
    } catch (error) {
      return c.json(
        {
          code: "VENDOR_ACTION_UNAVAILABLE",
          error: error instanceof Error ? error.message : "Socket action failed.",
        },
        503,
      );
    }
  });

  app.get(operationPath("getGithubSecurity"), async (c) => {
    const kind = c.req.query("kind");
    const repo = c.req.query("repo");
    const actions = new Set(["dependabot", "code-scanning", "secret-scanning"]);
    if (!kind || !actions.has(kind) || !repo)
      return c.json({ code: "VALIDATION_ERROR", error: "kind and repo are required." }, 400);
    try {
      const result = await triggerNangoAction(
        c,
        "github",
        `${kind.replaceAll("-", "_")}.list_alerts`,
        { repo },
      );
      return c.json({ data: result });
    } catch (error) {
      return c.json(
        {
          code: "VENDOR_ACTION_UNAVAILABLE",
          error: error instanceof Error ? error.message : "GitHub security action failed.",
        },
        503,
      );
    }
  });

  app.post(operationPath("connectNango"), async (c) => {
    if (!c.req.header("Authorization") && !authDisabled(c.env))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const body = ((await c.req
      .json<{ provider?: string; connectionId?: string }>()
      .catch(() => null)) ?? {}) as { provider?: string; connectionId?: string };
    const provider = (c.req.param("providerId") ?? body.provider)?.trim().toLowerCase();
    if (!provider || !isAvailableProvider(provider))
      return c.json(
        {
          code: "INVALID_PROVIDER",
          error: "This connector is not available in the secure connection catalog.",
        },
        400,
      );
    const organization = await organizationFor(c);
    if (!organization)
      return c.json(
        {
          code: "ORGANIZATION_REQUIRED",
          error: "Create an AmbiOS workspace before connecting a provider.",
        },
        403,
      );
    try {
      const result = await nangoRequest(c, "/connect/sessions", {
        method: "POST",
        body: JSON.stringify({
          allowed_integrations: [nangoProviderKey(provider)],
          tags: {
            end_user_id: c.get("userId"),
            organization_id: organization.id,
            provider,
          },
        }),
      });
      const data = (result.data ?? result) as Record<string, unknown>;
      const token = data.token ?? data.connect_session_token;
      const connectLink = data.connect_link;
      if (typeof token !== "string" || !token)
        throw new Error("Nango did not return a connect session token");
      const connectionId = body.connectionId ?? `ambios-${provider}-${crypto.randomUUID()}`;
      await c.env.DB.prepare(
        "INSERT INTO integrations (id, organization_id, provider, connection_id, status, metadata) VALUES (?, ?, ?, ?, 'pending', ?)",
      )
        .bind(
          crypto.randomUUID(),
          organization.id,
          provider,
          connectionId,
          JSON.stringify({ source: "nango", provider }),
        )
        .run();
      return c.json(
        {
          data: {
            provider,
            connectionId,
            status: "pending",
            connectSessionToken: token,
            connectLink: typeof connectLink === "string" ? connectLink : null,
          },
        },
        201,
      );
    } catch (error) {
      return c.json(
        {
          code: "NANGO_UNAVAILABLE",
          error: error instanceof Error ? error.message : "Secure connection service unavailable.",
        },
        503,
      );
    }
  });

  app.delete(operationPath("disconnectIntegration"), async (c) => {
    if (!c.req.header("Authorization") && !authDisabled(c.env))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const body = ((await c.req
      .json<{ provider?: string; connectionId?: string }>()
      .catch(() => null)) ?? {}) as { provider?: string; connectionId?: string };
    const provider = (c.req.param("providerId") ?? body.provider)?.trim().toLowerCase();
    const connectionId = body.connectionId?.trim();
    if (!provider || !isAvailableProvider(provider) || !connectionId)
      return c.json(
        { code: "VALIDATION_ERROR", error: "A valid provider and connectionId are required." },
        400,
      );
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const integration = await c.env.DB.prepare(
      "SELECT id, organization_id FROM integrations WHERE organization_id = ? AND provider = ? AND connection_id = ? LIMIT 1",
    )
      .bind(organization.id, provider, connectionId)
      .first<{ id: string; organization_id: string }>();
    if (!integration)
      return c.json({ code: "INTEGRATION_NOT_FOUND", error: "Integration not found." }, 404);
    try {
      await nangoRequest(
        c,
        `/connections/${encodeURIComponent(connectionId)}?provider_config_key=${encodeURIComponent(nangoProviderKey(provider))}`,
        { method: "DELETE" },
      );
      await c.env.DB.prepare(
        "UPDATE integrations SET status = 'disconnected', metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
        .bind(JSON.stringify({ source: "nango", provider, disconnected: true }), integration.id)
        .run();
      return c.json({ provider, connectionId, status: "disconnected" });
    } catch (error) {
      return c.json(
        {
          code: "NANGO_UNAVAILABLE",
          error: error instanceof Error ? error.message : "Secure connection service unavailable.",
        },
        503,
      );
    }
  });

  app.get(operationPath("streamLogs"), (c) => {
    if (!c.req.header("Authorization") && !authDisabled(c.env)) {
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    }
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const write = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        write({
          id: crypto.randomUUID(),
          level: "INFO",
          message: "AmbiOS runtime log stream connected.",
          timestamp: new Date().toISOString(),
        });
        const heartbeat = setInterval(() => {
          write({
            id: crypto.randomUUID(),
            level: "DEBUG",
            message: "Runtime heartbeat.",
            timestamp: new Date().toISOString(),
          });
        }, 15000);
        const close = () => clearInterval(heartbeat);
        c.req.raw.signal.addEventListener("abort", close, { once: true });
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
      },
    });
  });

  // MCP OAuth and Streamable HTTP are owned by the Core Worker. WebMCP is a
  // separate in-page registry and does not replace this authenticated server.
  app.route("/", createMcpRoutes());

  app.post(operationPath("requestDeploymentApproval"), async (c) => {
    if (!c.env.DB)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB is not configured." }, 503);
    const body = (await c.req
      .json<{ service?: string; environment?: string; operation?: string }>()
      .catch(() => null)) as { service?: string; environment?: string; operation?: string } | null;
    const service = body?.service?.trim().toLowerCase();
    const environment = body?.environment?.trim().toLowerCase();
    const operation = body?.operation?.trim().toLowerCase();
    if (
      !service ||
      !["cloudflare", "vercel"].includes(service) ||
      !environment ||
      !["development", "staging", "production"].includes(environment) ||
      !operation ||
      !["deploy", "rollback"].includes(operation)
    )
      return c.json(
        {
          code: "VALIDATION_ERROR",
          error: "service, environment, and operation are invalid or missing.",
        },
        400,
      );
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const userId = c.get("userId");
    const actionKey = "ambios.backend.deploy_service";
    const tokenHash = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await c.env.DB.prepare(
      "INSERT INTO approval_tokens (token_hash, user_id, organization_id, action_key, capability_hash, arguments_hash, status, expires_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)",
    )
      .bind(
        tokenHash,
        userId,
        organization.id,
        actionKey,
        await sha256(actionKey),
        await sha256(JSON.stringify({ service, environment, operation })),
        expiresAt,
      )
      .run();
    return c.json(
      {
        data: {
          approvalToken: tokenHash,
          service,
          environment,
          operation,
          expiresAt,
          approvedBy: userId,
        },
      },
      201,
    );
  });

  app.post(operationPath("deployBackend"), async (c) => {
    if (!readAccess(c))
      return c.json(
        { code: "AUTH_REQUIRED", error: "A user session is required for this operation." },
        401,
      );
    if (!c.env.DB || !c.env.QUEUE)
      return c.json({ code: "RUNTIME_BINDINGS_MISSING", error: "DB and QUEUE are required." }, 503);
    const body = (await c.req
      .json<{
        service?: string;
        environment?: string;
        operation?: string;
        approved?: boolean;
        approvalSource?: string;
        approvalToken?: string;
      }>()
      .catch(() => null)) as {
      service?: string;
      environment?: string;
      operation?: string;
      approved?: boolean;
      approvalSource?: string;
      approvalToken?: string;
    } | null;
    const service = body?.service?.trim().toLowerCase();
    const environment = body?.environment?.trim().toLowerCase();
    const operation = body?.operation?.trim().toLowerCase();
    if (
      !service ||
      !["cloudflare", "vercel"].includes(service) ||
      !environment ||
      !["development", "staging", "production"].includes(environment) ||
      !operation ||
      !["deploy", "rollback"].includes(operation)
    )
      return c.json(
        {
          code: "VALIDATION_ERROR",
          error: "service, environment, and operation are invalid or missing.",
        },
        400,
      );
    if (body?.approved !== true || body.approvalSource !== "human" || !body.approvalToken)
      return c.json(
        {
          code: "APPROVAL_REQUIRED",
          error: "Explicit human approval and a fresh approval token are required.",
        },
        403,
      );
    const organization = await organizationFor(c);
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const connection = await c.env.DB.prepare(
      "SELECT connection_id AS connectionId FROM integrations WHERE organization_id = ? AND provider = ? AND status = 'connected' ORDER BY created_at DESC LIMIT 1",
    )
      .bind(organization.id, service)
      .first<{ connectionId: string }>();
    if (!connection?.connectionId)
      return c.json(
        { code: "INTEGRATION_NOT_CONNECTED", error: `Connect ${service} before deploying.` },
        409,
      );
    const actionName = operation === "deploy" ? "deploy_service" : "rollback_service";
    const actionKey = "ambios.backend.deploy_service";
    const expectedArgumentsHash = await sha256(JSON.stringify({ service, environment, operation }));
    const expectedCapabilityHash = await sha256(actionKey);
    const requesterId = c.get("userId");
    const token = await c.env.DB.prepare(
      "SELECT token_hash, user_id, organization_id, action_key, capability_hash, arguments_hash, expires_at FROM approval_tokens WHERE token_hash = ? AND organization_id = ? AND user_id = ? AND action_key = ? AND status = 'pending' LIMIT 1",
    )
      .bind(body.approvalToken, organization.id, requesterId, actionKey)
      .first<{
        token_hash: string;
        user_id: string;
        organization_id: string;
        action_key: string;
        capability_hash: string;
        arguments_hash: string;
        expires_at: string;
      }>();
    if (!token || new Date(token.expires_at) < new Date())
      return c.json(
        { code: "APPROVAL_INVALID", error: "Approval token not found or expired." },
        403,
      );
    if (
      token.capability_hash !== expectedCapabilityHash ||
      token.arguments_hash !== expectedArgumentsHash
    )
      return c.json(
        {
          code: "APPROVAL_MISMATCH",
          error: "Approval token does not match this deployment scope.",
        },
        403,
      );
    const operationId = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare(
        "UPDATE approval_tokens SET status = 'consumed', consumed_at = ? WHERE token_hash = ? AND organization_id = ? AND user_id = ? AND action_key = ? AND status = 'pending'",
      ).bind(now, body.approvalToken, organization.id, requesterId, actionKey),
      c.env.DB.prepare(
        "INSERT INTO operations (id, organization_id, actor_id, kind, tool, resource_type, resource_id, state, input_json, created_at, updated_at) VALUES (?, ?, ?, 'backend_deploy', 'ambios.backend.deploy_service', 'service', ?, 'queued', ?, ?, ?)",
      ).bind(
        operationId,
        organization.id,
        requesterId,
        service,
        JSON.stringify({ service, environment, operation }),
        now,
        now,
      ),
    ]);
    await c.env.QUEUE.send({
      type: "backend_deploy",
      provider: service,
      organizationId: organization.id,
      connectionId: connection.connectionId,
      operationId,
      actionName,
      input: { service, environment, operation },
      actorId: requesterId,
      capability: "deployment.execute",
      target: `${service}:${environment}`,
      argumentsHash: expectedArgumentsHash,
      approvalReferenceHash: await sha256(body.approvalToken),
      approvalValidated: true,
    });
    return c.json(
      { data: { operationId, provider: service, status: "queued", environment, operation } },
      202,
    );
  });

  const unsupported = (c: Parameters<typeof problem>[0]) =>
    problem(
      c,
      501,
      "UNSUPPORTED_OPERATION",
      "This AmbiOS capability is not available in the current deployment.",
      {
        operationId: "unsupportedApiOperation",
      },
    );
  for (const operationId of [
    "unsupportedTunnels",
    "unsupportedTools",
    "unsupportedRuns",
    "unsupportedSchedules",
    "unsupportedOauthSecrets",
    "unsupportedExtract",
    "unsupportedSummarize",
  ] as const) {
    app.all(operationPath(operationId), unsupported);
  }

  app.notFound((c) => problem(c, 404, "NOT_FOUND", "The requested AmbiOS route does not exist."));
  return app;
}
