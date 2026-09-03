import { Hono } from "hono";
import { INTEGRATION_CATALOG } from "../packages/shared/integration-catalog";
import {
  NANGO_PROVIDERS,
  nangoProviderConfigKey,
  nangoSafeReadRequest,
} from "../packages/shared/nango-provider-registry";
import { operationPath } from "../packages/shared/operations";
import { enforceSage, SageDeniedError } from "./sage-governance";

type Env = {
  ENVIRONMENT?: string;
  AUTH_DISABLE?: string;
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  QUEUE: Queue;
  NANGO_SECRET_KEY?: string;
  NANGO_HOST?: string;
  NANGO_WEBHOOK_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

type ConnectorVariables = { userId: string };

const providerConfig = nangoProviderConfigKey;

function isAvailableProvider(provider: string) {
  return (
    NANGO_PROVIDERS.has(provider) &&
    INTEGRATION_CATALOG.find((entry) => entry.provider === provider)?.phase !== "roadmap"
  );
}

function devAuth(env: Env) {
  return ["development", "test"].includes(env.ENVIRONMENT ?? "") && env.AUTH_DISABLE === "true";
}

async function verifyUser(c: { env: Env; req: { header(name: string): string | undefined } }) {
  const authorization = c.req.header("Authorization");
  if (!authorization?.startsWith("Bearer ") || !c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY)
    return null;
  const response = await fetch(`${c.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: c.env.SUPABASE_ANON_KEY, Authorization: authorization },
  });
  if (!response.ok) return null;
  const user = (await response.json().catch(() => null)) as { id?: string } | null;
  return user?.id ?? null;
}

function nangoHost(env: Env) {
  const host = (env.NANGO_HOST ?? "https://api.nango.dev").replace(/\/$/, "");
  if (!host.startsWith("https://")) throw new Error("NANGO_HOST must use HTTPS");
  if (!env.NANGO_SECRET_KEY) throw new Error("NANGO_SECRET_KEY is not configured");
  return host;
}

async function nangoAction(
  env: Env,
  organizationId: string,
  provider: string,
  connectionId: string,
  actionName: string,
  input: Record<string, unknown>,
) {
  const integration = await env.DB.prepare(
    "SELECT connection_id AS connectionId FROM integrations WHERE organization_id = ? AND provider = ? AND connection_id = ? AND status = 'connected' LIMIT 1",
  )
    .bind(organizationId, provider, connectionId)
    .first<{ connectionId: string }>();
  if (!integration) throw new Error("Connection is not verified or no longer connected");
  const response = await fetch(`${nangoHost(env)}/action/trigger`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.NANGO_SECRET_KEY}`,
      "Connection-Id": connectionId,
      "Provider-Config-Key": providerConfig(provider),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action_name: actionName, input }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Provider action failed (${response.status})`);
  return payload;
}

async function nangoSync(
  env: Env,
  provider: string,
  organizationId: string,
  syncJobId: string,
  connectionId: string,
) {
  const base = nangoHost(env);
  const integration = await env.DB.prepare(
    "SELECT connection_id AS connectionId FROM integrations WHERE organization_id = ? AND provider = ? AND connection_id = ? AND status = 'connected' LIMIT 1",
  )
    .bind(organizationId, provider, connectionId)
    .first<{ connectionId: string }>();
  if (!integration) throw new Error("Connected Nango integration not found");
  const request = nangoSafeReadRequest(provider);
  if (!request) throw new Error(`Unsupported Nango provider: ${provider}`);
  const response = await fetch(`${base}/proxy${request.path}`, {
    method: request.method,
    ...(request.body ? { body: request.body } : {}),
    headers: {
      Authorization: `Bearer ${env.NANGO_SECRET_KEY}`,
      "Connection-Id": connectionId,
      "Provider-Config-Key": providerConfig(provider),
      Accept: "application/json",
      ...(request.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!response.ok) throw new Error(`Provider sync failed (${response.status})`);
  const payload = await response.json().catch(() => null);
  const records = Array.isArray(payload)
    ? payload.length
    : Array.isArray((payload as { results?: unknown[] } | null)?.results)
      ? (payload as { results: unknown[] }).results.length
      : 1;
  return { provider, syncJobId, recordsSynced: records };
}

type QueueJob = {
  type?: string;
  provider?: string;
  organizationId?: string;
  syncJobId?: string;
  connectionId?: string;
  operationId?: string;
  actionName?: string;
  input?: Record<string, unknown>;
  actorId?: string;
  capability?: string;
  target?: string;
  argumentsHash?: string;
  approvalReferenceHash?: string;
  approvalValidated?: boolean;
};

function failureMessage(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause);
  return message.replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]").slice(0, 1000);
}

async function processQueue(batch: MessageBatch<unknown>, env: Env) {
  for (const message of batch.messages) {
    const job = message.body as QueueJob | null;
    if (!job?.type || !job.organizationId) throw new Error("Invalid AmbiOS connector queue job");
    try {
      if (job.type === "backend_deploy") {
        if (!job.provider || !job.connectionId || !job.operationId || !job.actionName)
          throw new Error("Deployment queue job is incomplete");
        await enforceSage(env.DB, {
          operationId: job.operationId,
          operationClass: "execution",
          actorId: job.actorId ?? "unknown-actor",
          organizationId: job.organizationId,
          workspaceId: job.organizationId,
          capability: job.capability ?? "deployment.execute",
          target: job.target ?? `${job.provider}:${job.connectionId}`,
          argumentsJson: JSON.stringify(job.input ?? {}),
          approvalValidated: job.approvalValidated === true,
          approvalReferenceHash: job.approvalReferenceHash,
          argumentsHash: job.argumentsHash,
        });
        const result = await nangoAction(
          env,
          job.organizationId,
          job.provider,
          job.connectionId,
          job.actionName,
          job.input ?? {},
        );
        const now = new Date().toISOString();
        await env.DB.prepare(
          "UPDATE operations SET state = 'succeeded', result_json = ?, completed_at = ?, heartbeat_at = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND state = 'queued'",
        )
          .bind(JSON.stringify(result), now, now, now, job.operationId, job.organizationId)
          .run();
        message.ack();
        continue;
      }
      if (job.type !== "nango_sync" || !job.provider || !job.syncJobId || !job.connectionId)
        throw new Error("Unsupported or incomplete connector queue job");
      await enforceSage(env.DB, {
        operationId: job.operationId ?? job.syncJobId,
        operationClass: "read",
        actorId: job.actorId ?? "system-queue",
        organizationId: job.organizationId,
        workspaceId: job.organizationId,
        capability: job.capability ?? "provider.resources.read",
        target: job.target ?? `${job.provider}:${job.connectionId}`,
        argumentsJson: JSON.stringify(job.input ?? {}),
        argumentsHash: job.argumentsHash,
      });
      const now = new Date().toISOString();
      const claim = await env.DB.prepare(
        "UPDATE sync_jobs SET status = 'processing', attempts = attempts + 1, started_at = COALESCE(started_at, ?), updated_at = ? WHERE id = ? AND organization_id = ? AND status IN ('queued', 'failed')",
      )
        .bind(now, now, job.syncJobId, job.organizationId)
        .run();
      if ((claim.meta.changes ?? 0) !== 1) {
        message.ack();
        continue;
      }
      const result = await nangoSync(
        env,
        job.provider,
        job.organizationId,
        job.syncJobId,
        job.connectionId,
      );
      await env.DB.prepare(
        "UPDATE sync_jobs SET status = 'completed', completed_at = ?, updated_at = ?, error = NULL, result_json = ? WHERE id = ? AND organization_id = ? AND status = 'processing'",
      )
        .bind(now, now, JSON.stringify(result), job.syncJobId, job.organizationId)
        .run();
      if (job.operationId)
        await env.DB.prepare(
          "UPDATE operations SET state = 'succeeded', result_json = ?, completed_at = ?, heartbeat_at = ?, updated_at = ? WHERE id = ? AND organization_id = ?",
        )
          .bind(JSON.stringify(result), now, now, now, job.operationId, job.organizationId)
          .run();
      await env.DB.prepare(
        "UPDATE integrations SET last_sync_at = ?, last_sync_status = 'completed', last_error = NULL, updated_at = ? WHERE organization_id = ? AND provider = ?",
      )
        .bind(now, now, job.organizationId, job.provider)
        .run();
      message.ack();
    } catch (cause) {
      const error = failureMessage(cause);
      const now = new Date().toISOString();
      if (job.syncJobId)
        await env.DB.prepare(
          "UPDATE sync_jobs SET status = 'failed', error = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND status = 'processing'",
        )
          .bind(error, now, job.syncJobId, job.organizationId)
          .run();
      if (job.operationId)
        await env.DB.prepare(
          "UPDATE operations SET state = 'retryable', error = ?, heartbeat_at = ?, updated_at = ? WHERE id = ? AND organization_id = ?",
        )
          .bind(error, now, now, job.operationId, job.organizationId)
          .run();
      if (cause instanceof SageDeniedError) {
        message.ack();
        continue;
      }
      message.retry({ delaySeconds: 30 });
    }
  }
}

function connectionId(request: Request) {
  return request.headers.get("X-Ambios-Connection-Id") ?? "";
}

const app = new Hono<{ Bindings: Env; Variables: ConnectorVariables }>();
const apiPrefix = operationPath("getConnectorHealth").replace(/\/[^/]+$/, "");
const connectorHealthPath = operationPath("getConnectorHealth");
const webhookPath = operationPath("nangoWebhook");

app.use("/*", async (c, next) => {
  if (
    c.req.path === connectorHealthPath ||
    c.req.path === operationPath("getConnectorRootHealth") ||
    c.req.path === webhookPath
  )
    return next();
  if (!c.req.path.startsWith(apiPrefix)) return next();
  if (devAuth(c.env) && !c.req.header("Authorization")) {
    c.set("userId", "dev-user");
    return next();
  }
  const userId = await verifyUser(c);
  if (!userId)
    return c.json({ code: "AUTH_REQUIRED", error: "A valid Supabase session is required." }, 401);
  c.set("userId", userId);
  return next();
});

app.get(operationPath("getConnectorRootHealth"), (c) =>
  c.json({ service: "ambios-connector", runtime: "hono", status: "ok" }),
);
app.get(operationPath("getConnectorHealth"), (c) =>
  c.json({ service: "ambios-connector", runtime: "hono", status: "ok" }),
);

app.all(operationPath("connectorProviderAction"), async (c, next) => {
  if (!devAuth(c.env) && !c.req.header("Authorization"))
    return c.json({ code: "AUTH_REQUIRED", error: "A user session is required." }, 401);
  if (!c.env.DB || !c.env.NANGO_SECRET_KEY)
    return c.json(
      { code: "CONNECTOR_NOT_CONFIGURED", error: "Connector runtime is not configured." },
      503,
    );
  const provider = c.req.param("provider");
  if (!provider)
    return c.json({ code: "PROVIDER_REQUIRED", error: "A provider is required." }, 400);
  const providerPrefix = operationPath("connectorProviderAction").split(":provider")[0];
  const suffix = c.req.path.split(`${providerPrefix}${provider}/`)[1] ?? "";
  if (["connection", "verify"].includes(suffix.split("/")[0] ?? "")) return next();
  const actionByPath: Record<string, string> = {
    "snyk/vulnerabilities": "get_vulnerabilities",
    "snyk/scan": "scan_project",
    "socket/analyze": "analyze_package",
    "socket/report": "get_supply_chain_report",
    "socket/malware": "detect_malware",
    "github/security": "get_security_alerts",
  };
  const key = `${provider}/${suffix.split("/")[0]}`;
  const actionName = actionByPath[key];
  if (!actionName)
    return c.json(
      {
        code: "UNSUPPORTED_CONNECTOR_ACTION",
        error: `No allowlisted AmbiOS action is registered for ${provider}/${suffix}.`,
        provider,
        path: suffix,
      },
      404,
    );
  const input =
    c.req.method === "GET"
      ? Object.fromEntries(new URL(c.req.url).searchParams.entries())
      : ((await c.req.json().catch(() => ({}))) as Record<string, unknown>);
  try {
    const organization = await c.env.DB.prepare(
      "SELECT o.id FROM organizations o JOIN memberships m ON m.organization_id = o.id WHERE m.user_id = ? ORDER BY o.created_at LIMIT 1",
    )
      .bind(c.get("userId"))
      .first<{ id: string }>();
    if (!organization)
      return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
    const output = await nangoAction(
      c.env,
      organization.id,
      provider,
      connectionId(c.req.raw),
      actionName,
      input,
    );
    return c.json({ data: output, execution: "nango" });
  } catch (cause) {
    return c.json(
      {
        code: "CONNECTOR_ACTION_FAILED",
        error: cause instanceof Error ? cause.message : "Provider action failed",
      },
      502,
    );
  }
});

app.post(operationPath("connectNango"), async (c) => {
  if (!devAuth(c.env) && !c.req.header("Authorization"))
    return c.json({ code: "AUTH_REQUIRED" }, 401);
  const body = (await c.req.json().catch(() => null)) as {
    provider?: string;
    connectionId?: string;
  } | null;
  if (!body?.provider)
    return c.json({ code: "VALIDATION_ERROR", error: "provider is required" }, 400);
  if (!isAvailableProvider(body.provider.trim().toLowerCase()))
    return c.json(
      { code: "UNSUPPORTED_PROVIDER", error: "Provider is not in the secure connection catalog." },
      400,
    );
  try {
    const response = await fetch(`${nangoHost(c.env)}/connect/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.NANGO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        allowed_integrations: [providerConfig(body.provider)],
        tags: {
          end_user_id: c.get("userId"),
          provider: body.provider,
        },
      }),
    });
    const payload = await response.json().catch(() => null);
    const data = (payload as { data?: Record<string, unknown> } | null)?.data ?? payload;
    const token =
      (data as { token?: unknown; connect_session_token?: unknown } | null)?.token ??
      (data as { connect_session_token?: unknown } | null)?.connect_session_token;
    if (typeof token !== "string") return c.json({ code: "NANGO_INVALID_RESPONSE" }, 502);
    const connection = body.connectionId ?? `ambios-${body.provider}-${crypto.randomUUID()}`;
    const organization = await c.env.DB.prepare(
      "SELECT o.id FROM organizations o JOIN memberships m ON m.organization_id = o.id WHERE m.user_id = ? ORDER BY o.created_at LIMIT 1",
    )
      .bind(c.get("userId"))
      .first<{ id: string }>();
    if (organization) {
      await c.env.DB.prepare(
        "INSERT INTO integrations (id, organization_id, workspace_id, provider, provider_display_name, provider_category, connection_id, status, metadata, created_by, updated_by) VALUES (?, ?, ?, ?, ?, 'provider', ?, 'pending', ?, ?, ?)",
      )
        .bind(
          crypto.randomUUID(),
          organization.id,
          organization.id,
          body.provider,
          body.provider,
          connection,
          JSON.stringify({ source: "nango" }),
          c.get("userId"),
          c.get("userId"),
        )
        .run();
    }
    return c.json(
      {
        data: {
          provider: body.provider,
          connectionId: connection,
          status: "pending",
          connectSessionToken: token,
          connectLink: (data as { connect_link?: string } | null)?.connect_link ?? null,
        },
      },
      201,
    );
  } catch {
    return c.json(
      { code: "NANGO_UNAVAILABLE", error: "Nango connection service is unavailable." },
      503,
    );
  }
});

app.post(operationPath("verifyIntegration"), async (c) => {
  const provider = (c.req.param("providerId") ?? "").trim().toLowerCase();
  if (!provider) return c.json({ code: "VALIDATION_ERROR", error: "providerId is required" }, 400);
  const body = (await c.req.json().catch(() => null)) as { connectionId?: string } | null;
  const connectionIdFromCallback = body?.connectionId?.trim();
  const organization = await c.env.DB.prepare(
    "SELECT o.id FROM organizations o JOIN memberships m ON m.organization_id = o.id WHERE m.user_id = ? LIMIT 1",
  )
    .bind(c.get("userId"))
    .first<{ id: string }>();
  if (!organization)
    return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
  const row = await c.env.DB.prepare(
    connectionIdFromCallback
      ? "SELECT id, connection_id AS connectionId, metadata FROM integrations WHERE organization_id = ? AND provider = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1"
      : "SELECT id, connection_id AS connectionId, metadata FROM integrations WHERE organization_id = ? AND provider = ? ORDER BY created_at DESC LIMIT 1",
  )
    .bind(organization.id, provider)
    .first<{ id: string; connectionId: string | null; metadata: string }>();
  if (!row || (!row.connectionId && !connectionIdFromCallback))
    return c.json(
      { code: "INTEGRATION_NOT_CONNECTED", error: "Authorize this provider before verification." },
      409,
    );
  if (connectionIdFromCallback && row.connectionId !== connectionIdFromCallback) {
    await c.env.DB.prepare(
      "UPDATE integrations SET connection_id = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND status = 'pending'",
    )
      .bind(connectionIdFromCallback, new Date().toISOString(), row.id, organization.id)
      .run();
    row.connectionId = connectionIdFromCallback;
  }
  const effectiveConnectionId = row.connectionId;
  if (!effectiveConnectionId) {
    return c.json(
      { code: "INTEGRATION_NOT_CONNECTED", error: "Authorize this provider before verification." },
      409,
    );
  }
  await enforceSage(c.env.DB, {
    operationId: crypto.randomUUID(),
    operationClass: "read",
    actorId: c.get("userId"),
    organizationId: organization.id,
    workspaceId: organization.id,
    capability: "provider.resources.read",
    target: `${provider}:${effectiveConnectionId}`,
    argumentsJson: JSON.stringify({ verification: "safe-read", provider }),
  });
  const request = nangoSafeReadRequest(provider);
  if (!request)
    return c.json(
      {
        code: "UNSUPPORTED_PROVIDER",
        error: "Safe verification is not implemented for this provider.",
      },
      501,
    );
  try {
    const response = await fetch(`${nangoHost(c.env)}/proxy${request.path}`, {
      method: request.method,
      ...(request.body ? { body: request.body } : {}),
      headers: {
        Authorization: `Bearer ${c.env.NANGO_SECRET_KEY}`,
        "Connection-Id": effectiveConnectionId,
        "Provider-Config-Key": providerConfig(provider),
        Accept: "application/json",
        ...(request.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!response.ok)
      return c.json(
        { code: "PROVIDER_VERIFICATION_FAILED", error: "Provider safe-read verification failed." },
        502,
      );
    const metadata = JSON.parse(row.metadata || "{}");
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      "UPDATE integrations SET status = 'connected', metadata = ?, last_error = NULL, updated_at = ? WHERE id = ?",
    )
      .bind(
        JSON.stringify({
          ...metadata,
          lastConnectionCheckAt: now,
          lastSuccessfulVerificationAt: now,
          verificationId: crypto.randomUUID(),
        }),
        now,
        row.id,
      )
      .run();
    return c.json({
      data: {
        providerId: provider,
        connectionId: effectiveConnectionId,
        verifiedAt: now,
        outcome: "succeeded",
      },
    });
  } catch {
    return c.json(
      { code: "PROVIDER_VERIFICATION_FAILED", error: "Provider safe-read verification failed." },
      502,
    );
  }
});

app.delete(operationPath("disconnectIntegration"), async (c) => {
  const provider = (c.req.param("providerId") ?? "").trim().toLowerCase();
  const body = (await c.req.json().catch(() => null)) as { connectionId?: string } | null;
  const connectionId = body?.connectionId?.trim();
  if (!provider || !connectionId)
    return c.json(
      { code: "VALIDATION_ERROR", error: "providerId and connectionId are required" },
      400,
    );
  const organization = await c.env.DB.prepare(
    "SELECT o.id FROM organizations o JOIN memberships m ON m.organization_id = o.id WHERE m.user_id = ? LIMIT 1",
  )
    .bind(c.get("userId"))
    .first<{ id: string }>();
  if (!organization)
    return c.json({ code: "ORGANIZATION_REQUIRED", error: "Workspace not found." }, 403);
  const row = await c.env.DB.prepare(
    "SELECT id FROM integrations WHERE organization_id = ? AND provider = ? AND connection_id = ? LIMIT 1",
  )
    .bind(organization.id, provider, connectionId)
    .first<{ id: string }>();
  if (!row)
    return c.json({ code: "INTEGRATION_NOT_FOUND", error: "Provider connection not found." }, 404);
  try {
    await fetch(
      `${nangoHost(c.env)}/connections/${encodeURIComponent(connectionId)}?provider_config_key=${encodeURIComponent(providerConfig(provider))}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${c.env.NANGO_SECRET_KEY}` } },
    );
  } catch {
    return c.json(
      { code: "NANGO_UNAVAILABLE", error: "Provider disconnect could not be completed." },
      503,
    );
  }
  await c.env.DB.prepare(
    "UPDATE integrations SET status = 'disconnected', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  )
    .bind(row.id)
    .run();
  return c.json({ data: { providerId: provider, connectionId, connectionStatus: "disconnected" } });
});

app.post(operationPath("nangoWebhook"), async (c) => {
  if (!c.env.NANGO_WEBHOOK_SECRET)
    return c.json(
      { code: "WEBHOOK_NOT_CONFIGURED", error: "Nango webhook verification is not configured." },
      503,
    );
  const raw = await c.req.raw.text();
  const eventId = c.req.header("X-Nango-Event-Id") ?? c.req.header("Nango-Event-Id");
  if (!eventId) return c.json({ code: "WEBHOOK_ID_REQUIRED" }, 400);
  const signature = c.req.header("X-Nango-Hmac-Sha256");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(c.env.NANGO_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const expectedHex = Array.from(new Uint8Array(expected), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const provided = signature?.trim().toLowerCase() ?? "";
  let mismatch = provided.length !== expectedHex.length ? 1 : 0;
  for (let index = 0; index < expectedHex.length; index++) {
    mismatch |= (provided.charCodeAt(index) || 0) ^ expectedHex.charCodeAt(index);
  }
  if (mismatch !== 0) return c.json({ code: "INVALID_WEBHOOK_SIGNATURE" }, 401);
  let event: {
    event?: string;
    provider?: string;
    connection_id?: string;
    connectionId?: string;
    operation?: string;
    status?: string;
    success?: boolean;
  };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return c.json({ code: "WEBHOOK_INVALID_JSON", error: "Webhook body must be valid JSON." }, 400);
  }
  const connectionId = event.connection_id ?? event.connectionId;
  const integration = connectionId
    ? await c.env.DB.prepare(
        "SELECT id, organization_id, provider FROM integrations WHERE connection_id = ? AND status IN ('connected', 'pending') LIMIT 1",
      )
        .bind(connectionId)
        .first<{ id: string; organization_id: string; provider: string }>()
    : null;
  if (!integration?.organization_id || !connectionId)
    return c.json(
      {
        code: "WEBHOOK_MAPPING_REQUIRED",
        error: "Webhook connection is not mapped to a workspace.",
      },
      422,
    );
  const duplicate = await c.env.DB.prepare(
    "SELECT id FROM webhook_events WHERE provider = 'nango' AND organization_id = ? AND external_id = ? LIMIT 1",
  )
    .bind(integration.organization_id, eventId)
    .first();
  if (duplicate) return c.json({ accepted: true, duplicate: true });
  const payloadHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hash = Array.from(new Uint8Array(payloadHash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  await c.env.DB.prepare(
    "INSERT INTO webhook_events (id, external_id, organization_id, connection_id, provider, event_type, payload_hash, status, received_at) VALUES (?, ?, ?, ?, 'nango', ?, ?, 'received', ?)",
  )
    .bind(
      crypto.randomUUID(),
      eventId,
      integration.organization_id,
      connectionId,
      event.event ?? "unknown",
      hash,
      new Date().toISOString(),
    )
    .run();
  const eventName = (event.event ?? "").toLowerCase();
  const eventOperation = (event.operation ?? "").toLowerCase();
  const eventStatus = (event.status ?? "").toLowerCase();
  const isAuthSuccess =
    ["auth", "connection_created", "connection.created"].includes(eventName) &&
    !["failed", "failure", "error"].includes(eventStatus) &&
    ["", "create", "created", "creation"].includes(eventOperation) &&
    event.success !== false;
  const isDisconnect = ["connection_deleted", "connection.deleted", "disconnect"].includes(
    eventName,
  );
  if (isAuthSuccess || isDisconnect) {
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      "UPDATE integrations SET status = ?, connection_health = ?, capability_status = 'unverified', last_connection_check_at = ?, last_error = NULL, updated_at = ? WHERE id = ? AND organization_id = ?",
    )
      .bind(
        isDisconnect ? "disconnected" : "connected",
        isDisconnect ? "unknown" : "healthy",
        now,
        now,
        integration.id,
        integration.organization_id,
      )
      .run();
  }
  return c.json({ accepted: true }, 202);
});

export default {
  fetch: app.fetch,
  queue: processQueue,
};
