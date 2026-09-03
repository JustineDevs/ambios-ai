import { type OperationId, operationPath, serviceOriginsFromEnv } from "@ambios-ai/shared";
import type { D1Database } from "@cloudflare/workers-types";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type D1Workspace = {
  organization: { id: string; name: string };
  agent: { id: string; name: string; status: "active" } | null;
  incidents: Array<{
    id: string;
    title: string;
    service: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved";
    context: string;
  }>;
  actions: Array<Record<string, unknown>>;
  docs: Array<Record<string, unknown>>;
};

export async function getD1(): Promise<D1Database> {
  throw new Error("D1 access is owned by the Hono Worker; use the typed API client.");
}

async function backendGet<T>(
  operationId: OperationId,
  pathParams: Record<string, string> = {},
  query: Record<string, string> = {},
): Promise<T> {
  const result = await backendGetResult<T>(operationId, pathParams, query);
  return result.data as T;
}

export async function backendGetResult<T>(
  operationId: OperationId,
  pathParams: Record<string, string> = {},
  query: Record<string, string> = {},
): Promise<{ data: T | null; error?: string }> {
  const base = process.env.AMBIOS_WORKER_URL ?? serviceOriginsFromEnv(process.env).coreApiOrigin;
  const cookieHeader = (await cookies()).toString();
  const headers = new Headers({ Accept: "application/json" });
  if (cookieHeader) headers.set("Cookie", cookieHeader);
  try {
    const client = await createClient();
    const { data } = await client.auth.getSession();
    if (data.session?.access_token)
      headers.set("Authorization", `Bearer ${data.session.access_token}`);
  } catch {
    // Development auth bypass intentionally omits a bearer token.
  }
  try {
    const path = operationPath(operationId, pathParams);
    const queryString = new URLSearchParams(query).toString();
    const response = await fetch(`${base}${path}${queryString ? `?${queryString}` : ""}`, {
      headers,
      cache: "no-store",
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        code?: string;
      } | null;
      return {
        data: null,
        error: body?.error ?? body?.code ?? `Request failed (${response.status})`,
      };
    }
    return { data: (await response.json()) as T };
  } catch {
    return { data: null, error: "The AmbiOS backend could not be reached." };
  }
}

async function issueApprovalToken(
  userId: string,
  actionKey: string,
  details: { incidentId?: string; instruction?: string },
) {
  const token = crypto.randomUUID();
  const db = await getD1();
  await db
    .prepare(
      "INSERT INTO approval_tokens (token_hash, user_id, action_key, incident_id, instruction, expires_at) VALUES (?, ?, ?, ?, ?, datetime('now', '+5 minutes'))",
    )
    .bind(
      await hashRequest({ token }),
      userId,
      actionKey,
      details.incidentId ?? null,
      details.instruction ?? null,
    )
    .run();
  return token;
}

async function consumeApprovalToken(
  userId: string,
  actionKey: string,
  token: string,
  details: { incidentId?: string; instruction?: string },
) {
  const db = await getD1();
  const tokenHash = await hashRequest({ token });
  const approval = await db
    .prepare(
      "SELECT token_hash AS tokenHash, incident_id AS incidentId, instruction FROM approval_tokens WHERE token_hash = ? AND user_id = ? AND action_key = ? AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP LIMIT 1",
    )
    .bind(tokenHash, userId, actionKey)
    .first<{ tokenHash: string; incidentId: string | null; instruction: string | null }>();
  if (
    !approval ||
    approval.incidentId !== (details.incidentId ?? null) ||
    approval.instruction !== (details.instruction ?? null)
  )
    return false;
  const result = await db
    .prepare(
      "UPDATE approval_tokens SET status = 'consumed', consumed_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND user_id = ? AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP",
    )
    .bind(tokenHash, userId)
    .run();
  return (result.meta.changes ?? 0) === 1;
}

export async function getQueue() {
  throw new Error("Queue access is owned by the Hono Worker.");
}

export async function issueHotfixApproval(userId: string, incidentId: string, instruction: string) {
  return issueApprovalToken(userId, `hotfix:${incidentId}`, { incidentId, instruction });
}

export async function consumeHotfixApproval(
  userId: string,
  incidentId: string,
  instruction: string,
  token: string,
) {
  return consumeApprovalToken(userId, `hotfix:${incidentId}`, token, { incidentId, instruction });
}

export async function issueActionApproval(userId: string, actionKey: string) {
  return issueApprovalToken(userId, actionKey, {});
}

export async function consumeActionApproval(userId: string, actionKey: string, token: string) {
  return consumeApprovalToken(userId, actionKey, token, {});
}

export async function getOrganizationForUser(userId: string) {
  void userId;
  const result = await backendGet<{
    organization: { id: string; name: string } | null;
    agent: unknown;
  }>("getWorkspace");
  return result?.organization ? { ...result.organization, role: "member" } : null;
}

export async function createWorkspaceForUser(userId: string, name: string) {
  const db = await getD1();
  const organizationId = crypto.randomUUID();
  const agentId = crypto.randomUUID();
  const now = new Date().toISOString();
  const period = now.slice(0, 7);
  await db.batch([
    db
      .prepare("INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)")
      .bind(organizationId, name, now),
    db
      .prepare(
        "INSERT INTO memberships (organization_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)",
      )
      .bind(organizationId, userId, now),
    db
      .prepare(
        "INSERT INTO agents (id, organization_id, name, status, created_at) VALUES (?, ?, 'AmbiOS agent', 'active', ?)",
      )
      .bind(agentId, organizationId, now),
    db
      .prepare(
        "INSERT INTO guardrail_policies (id, organization_id, agent_id, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), organizationId, agentId, now),
    db
      .prepare(
        "INSERT INTO budgets (id, organization_id, period, limit_amount, spent_amount, reserved_amount) VALUES (?, ?, ?, 10000, 0, 0)",
      )
      .bind(crypto.randomUUID(), organizationId, period),
    db
      .prepare(
        "INSERT INTO actions (id, organization_id, actor_type, actor_id, action_type, input_json, output_json, status, approval_state, summary, created_at) VALUES (?, ?, 'human', ?, 'ambios.create_workspace', ?, ?, 'completed', 'not_required', 'Workspace created', ?)",
      )
      .bind(
        crypto.randomUUID(),
        organizationId,
        userId,
        JSON.stringify({ name }),
        JSON.stringify({ organizationId, agentId }),
        now,
      ),
  ]);
  return {
    organization: { id: organizationId, name },
    agent: { id: agentId, name: "AmbiOS agent", status: "active" as const },
    incidents: [],
    actions: [],
    docs: [],
  } satisfies D1Workspace;
}

export async function getWorkspaceForUser(userId: string, limit = 50): Promise<D1Workspace | null> {
  return getWorkspaceForUserWithLimit(userId, limit);
}

export async function getWorkspaceForUserWithLimit(
  userId: string,
  limit = 50,
): Promise<D1Workspace | null> {
  void userId;
  void limit;
  const workspace = await backendGet<{
    organization: D1Workspace["organization"] | null;
    agent: D1Workspace["agent"];
  }>("getWorkspace");
  if (!workspace?.organization) return null;
  const [incidents, actions, docs] = await Promise.all([
    backendGet<{ data?: { incidents?: D1Workspace["incidents"] } }>("listIncidents"),
    backendGet<{ data?: { actions?: Array<Record<string, unknown>> } }>("listActions"),
    backendGet<{ data?: { docs?: Array<Record<string, unknown>> } }>("listDocs"),
  ]);
  return {
    organization: workspace.organization,
    agent: workspace.agent,
    incidents: incidents?.data?.incidents ?? [],
    actions: actions?.data?.actions ?? [],
    docs: docs?.data?.docs ?? [],
  };
}

export async function hashRequest(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function beginIdempotency(
  organizationId: string,
  operation: string,
  key: string,
  requestHash: string,
) {
  const db = await getD1();
  // ponytail: reclaim only abandoned reservations; fresh pending work remains serialized.
  await db
    .prepare(
      "DELETE FROM idempotency_keys WHERE id = ? AND organization_id = ? AND operation = ? AND status = 'pending' AND created_at <= datetime('now', '-10 minutes')",
    )
    .bind(key, organizationId, operation)
    .run();
  const result = await db
    .prepare(
      "INSERT OR IGNORE INTO idempotency_keys (id, organization_id, operation, request_hash) VALUES (?, ?, ?, ?)",
    )
    .bind(key, organizationId, operation, requestHash)
    .run();
  if ((result.meta.changes ?? 0) > 0) return { replay: false as const };
  const existing = await db
    .prepare(
      "SELECT request_hash AS requestHash, status, response_status AS responseStatus, response_json AS responseJson FROM idempotency_keys WHERE id = ? AND organization_id = ? AND operation = ?",
    )
    .bind(key, organizationId, operation)
    .first<{
      requestHash: string;
      status: string;
      responseStatus: number | null;
      responseJson: string | null;
    }>();
  if (!existing || existing.requestHash !== requestHash) return { conflict: true as const };
  if (existing.status === "completed" && existing.responseJson) {
    return {
      replay: true as const,
      status: existing.responseStatus ?? 200,
      body: JSON.parse(existing.responseJson),
    };
  }
  return { conflict: true as const };
}

export async function completeIdempotency(
  organizationId: string,
  operation: string,
  key: string,
  status: number,
  body: unknown,
) {
  const db = await getD1();
  await db
    .prepare(
      "UPDATE idempotency_keys SET status = 'completed', response_status = ?, response_json = ?, completed_at = ? WHERE id = ? AND organization_id = ? AND operation = ?",
    )
    .bind(status, JSON.stringify(body), new Date().toISOString(), key, organizationId, operation)
    .run();
}

export async function beginBootstrapIdempotency(
  userId: string,
  operation: string,
  key: string,
  requestHash: string,
) {
  const db = await getD1();
  await db
    .prepare(
      "DELETE FROM bootstrap_idempotency WHERE id = ? AND user_id = ? AND operation = ? AND status = 'pending' AND created_at <= datetime('now', '-10 minutes')",
    )
    .bind(key, userId, operation)
    .run();
  const result = await db
    .prepare(
      "INSERT OR IGNORE INTO bootstrap_idempotency (id, user_id, operation, request_hash) VALUES (?, ?, ?, ?)",
    )
    .bind(key, userId, operation, requestHash)
    .run();
  if ((result.meta.changes ?? 0) > 0) return { replay: false as const };
  const existing = await db
    .prepare(
      "SELECT request_hash AS requestHash, status, response_status AS responseStatus, response_json AS responseJson FROM bootstrap_idempotency WHERE id = ? AND user_id = ? AND operation = ?",
    )
    .bind(key, userId, operation)
    .first<{
      requestHash: string;
      status: string;
      responseStatus: number | null;
      responseJson: string | null;
    }>();
  if (!existing || existing.requestHash !== requestHash) return { conflict: true as const };
  if (existing.status === "completed" && existing.responseJson) {
    return {
      replay: true as const,
      status: existing.responseStatus ?? 200,
      body: JSON.parse(existing.responseJson),
    };
  }
  return { conflict: true as const };
}

export async function completeBootstrapIdempotency(
  userId: string,
  operation: string,
  key: string,
  status: number,
  body: unknown,
) {
  const db = await getD1();
  await db
    .prepare(
      "UPDATE bootstrap_idempotency SET status = 'completed', response_status = ?, response_json = ?, completed_at = ? WHERE id = ? AND user_id = ? AND operation = ?",
    )
    .bind(status, JSON.stringify(body), new Date().toISOString(), key, userId, operation)
    .run();
}

export async function getIncidentForUser(userId: string, incidentId: string) {
  void userId;
  const result = await backendGet<{ data?: Record<string, unknown> }>("getIncident", {
    id: incidentId,
  });
  const incident = result?.data;
  return incident
    ? ({
        ...incident,
        context:
          typeof incident.context === "string"
            ? incident.context
            : JSON.stringify(incident.context ?? {}),
      } as {
        id: string;
        title: string;
        service: string;
        severity: string;
        status: string;
        context: string;
      })
    : null;
}

export async function getSharedIncident(incidentId: string, shareLink: string) {
  const params = new URLSearchParams({ shareLink });
  return backendGet<{
    data?: {
      incident?: {
        id: string;
        title: string;
        service: string;
        severity: string;
        status: string;
        context: string;
      };
    };
  }>("getCanvas", { canvasId: incidentId }, { shareLink }).then(
    (result) => result?.data?.incident ?? null,
  );
}

export async function getCanvasForUser(userId: string, incidentId: string) {
  void userId;
  const result = await backendGet<{
    incident?: { id: string; title: string; service: string; status: string; context: string };
    nodes?: Array<Record<string, unknown>>;
    edges?: Array<Record<string, unknown>>;
  }>("getCanvas", { canvasId: incidentId });
  return result ?? null;
}

export async function getDocForUser(userId: string, docId: string) {
  void userId;
  const result = await backendGet<{ data?: { doc?: Record<string, unknown> } }>("getDoc", {
    id: docId,
  });
  return (result?.data?.doc ?? null) as {
    id: string;
    incidentId: string | null;
    title: string;
    body: string;
    rationale: string;
    version: number;
    status: string;
    createdAt: string;
  } | null;
}

export async function getBudgetForUser(userId: string) {
  const organization = await getOrganizationForUser(userId);
  if (!organization) return null;
  const db = await getD1();
  const period = new Date().toISOString().slice(0, 7);
  await db
    .prepare(
      "INSERT OR IGNORE INTO budgets (id, organization_id, period, limit_amount, spent_amount, reserved_amount) VALUES (?, ?, ?, 10000, 0, 0)",
    )
    .bind(crypto.randomUUID(), organization.id, period)
    .run();
  const budget = await db
    .prepare(
      "SELECT id, period, limit_amount AS limitAmount, spent_amount AS spentAmount, reserved_amount AS reservedAmount FROM budgets WHERE organization_id = ? AND period = ? LIMIT 1",
    )
    .bind(organization.id, period)
    .first<{
      id: string;
      period: string;
      limitAmount: number;
      spentAmount: number;
      reservedAmount: number;
    }>();
  return budget
    ? {
        ...budget,
        organizationId: organization.id,
        available: Math.max(0, budget.limitAmount - budget.spentAmount - budget.reservedAmount),
      }
    : null;
}

export async function reserveBudgetForUser(userId: string, actionKey: string, amount: number) {
  const organization = await getOrganizationForUser(userId);
  if (!organization) return { ok: false as const, reason: "organization_required" };
  const db = await getD1();
  const period = new Date().toISOString().slice(0, 7);
  await db
    .prepare(
      "INSERT OR IGNORE INTO budgets (id, organization_id, period, limit_amount, spent_amount, reserved_amount) VALUES (?, ?, ?, 10000, 0, 0)",
    )
    .bind(crypto.randomUUID(), organization.id, period)
    .run();
  const existing = await db
    .prepare(
      "SELECT id, amount, status FROM budget_reservations WHERE organization_id = ? AND action_key = ? LIMIT 1",
    )
    .bind(organization.id, actionKey)
    .first<{ id: string; amount: number; status: string }>();
  if (existing)
    return {
      ok: true as const,
      reservationId: existing.id,
      replay: true as const,
      amount: existing.amount,
      status: existing.status,
    };
  const reservationId = crypto.randomUUID();
  const results = await db.batch([
    db
      .prepare(
        "INSERT INTO budget_reservations (id, organization_id, action_key, period, amount, status) SELECT ?, ?, ?, ?, ?, 'reserved' WHERE EXISTS (SELECT 1 FROM budgets WHERE organization_id = ? AND period = ? AND (limit_amount - spent_amount - reserved_amount) >= ?)",
      )
      .bind(
        reservationId,
        organization.id,
        actionKey,
        period,
        amount,
        organization.id,
        period,
        amount,
      ),
    db
      .prepare(
        "UPDATE budgets SET reserved_amount = reserved_amount + ? WHERE organization_id = ? AND period = ? AND (limit_amount - spent_amount - reserved_amount) >= ?",
      )
      .bind(amount, organization.id, period, amount),
  ]);
  if ((results[0]?.meta.changes ?? 0) !== 1 || (results[1]?.meta.changes ?? 0) !== 1) {
    await db
      .prepare(
        "DELETE FROM budget_reservations WHERE id = ? AND organization_id = ? AND status = 'reserved'",
      )
      .bind(reservationId, organization.id)
      .run();
    return { ok: false as const, reason: "budget_exceeded" };
  }
  return {
    ok: true as const,
    reservationId,
    replay: false as const,
    amount,
    status: "reserved" as const,
  };
}

export async function settleBudgetForUser(userId: string, reservationId: string, spent: boolean) {
  const organization = await getOrganizationForUser(userId);
  if (!organization) throw new Error("AmbiOS user is not a member of an organization.");
  const db = await getD1();
  const reservation = await db
    .prepare(
      "SELECT amount, period, status FROM budget_reservations WHERE id = ? AND organization_id = ? LIMIT 1",
    )
    .bind(reservationId, organization.id)
    .first<{ amount: number; period: string; status: string }>();
  if (reservation?.status !== "reserved") return;
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        "UPDATE budgets SET reserved_amount = reserved_amount - ?, spent_amount = spent_amount + ? WHERE organization_id = ? AND period = ? AND reserved_amount >= ? AND EXISTS (SELECT 1 FROM budget_reservations WHERE id = ? AND organization_id = ? AND status = 'reserved')",
      )
      .bind(
        reservation.amount,
        spent ? reservation.amount : 0,
        organization.id,
        reservation.period,
        reservation.amount,
        reservationId,
        organization.id,
      ),
    db
      .prepare(
        "UPDATE budget_reservations SET status = ?, completed_at = ? WHERE id = ? AND organization_id = ? AND status = 'reserved'",
      )
      .bind(spent ? "spent" : "released", now, reservationId, organization.id),
    ...(spent
      ? [
          db
            .prepare(
              "INSERT INTO spend_log (id, organization_id, amount, reason) VALUES (?, ?, ?, ?)",
            )
            .bind(
              crypto.randomUUID(),
              organization.id,
              reservation.amount,
              `AmbiOS action ${reservationId}`,
            ),
        ]
      : []),
  ]);
}

export async function createIncidentForUser(
  userId: string,
  incident: {
    id: string;
    title: string;
    service: string;
    severity: string;
    status: string;
    context: string;
  },
) {
  const organization = await getOrganizationForUser(userId);
  if (!organization) throw new Error("AmbiOS user is not a member of an organization.");
  const db = await getD1();
  await db
    .prepare(
      "INSERT INTO incidents (id, organization_id, title, service, severity, status, context) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      incident.id,
      organization.id,
      incident.title,
      incident.service,
      incident.severity,
      incident.status,
      incident.context,
    )
    .run();
  return incident;
}

export async function updateOrganizationForUser(userId: string, name: string) {
  const organization = await getOrganizationForUser(userId);
  if (!organization) throw new Error("AmbiOS user is not a member of an organization.");
  const db = await getD1();
  await db
    .prepare("UPDATE organizations SET name = ? WHERE id = ?")
    .bind(name, organization.id)
    .run();
  return { ...organization, name };
}

export async function createHotfixForUser(userId: string, incidentId: string, instruction: string) {
  const organization = await getOrganizationForUser(userId);
  if (!organization) throw new Error("AmbiOS user is not a member of an organization.");
  const db = await getD1();
  const incident = await db
    .prepare(
      "SELECT id, title, service, severity, status, context FROM incidents WHERE organization_id = ? AND id = ? LIMIT 1",
    )
    .bind(organization.id, incidentId)
    .first<{
      id: string;
      title: string;
      service: string;
      severity: string;
      status: string;
      context: string;
    }>();
  if (!incident) return null;
  const actionId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const now = new Date().toISOString();
  const doc = {
    id: docId,
    incidentId,
    title: `Runbook proposal: ${incident.title}`,
    status: "proposal",
    body: `Observed ${incident.service} incident. Proposed action: ${instruction}. Review before publishing.`,
  };
  const action = {
    id: actionId,
    incidentId,
    status: "completed",
    summary: instruction,
    createdAt: now,
  };
  await db.batch([
    db
      .prepare(
        "INSERT INTO actions (id, organization_id, actor_type, actor_id, incident_id, action_type, input_json, output_json, status, guardrail_decision_json, approval_state, related_resource_type, related_resource_id, summary, created_at, completed_at) VALUES (?, ?, 'human', ?, ?, 'ambios.incident.apply_hotfix', ?, ?, 'completed', ?, 'approved', 'incident', ?, ?, ?, ?)",
      )
      .bind(
        actionId,
        organization.id,
        userId,
        incidentId,
        JSON.stringify({ instruction }),
        JSON.stringify(action),
        JSON.stringify({ allowed: true, requiresApproval: true }),
        incidentId,
        instruction,
        now,
        now,
      ),
    db
      .prepare(
        "INSERT INTO docs (id, organization_id, incident_id, title, body, status) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(docId, organization.id, incidentId, doc.title, doc.body, doc.status),
    db
      .prepare("UPDATE incidents SET status = 'investigating' WHERE id = ? AND organization_id = ?")
      .bind(incidentId, organization.id),
  ]);
  return { incident, action, doc };
}
