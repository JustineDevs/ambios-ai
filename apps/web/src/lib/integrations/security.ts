import { getD1, getOrganizationForUser } from "@/lib/ambios/d1";
import { error, json } from "@/lib/ambios/response";
import {
  auditToolCall,
  enforceRateLimit,
  persistenceUnavailable,
  requireToolUser,
  unauthorized,
} from "@/lib/ambios/security";
import { nangoActionRequest, nangoProxyRequest } from "@/lib/nango/server";

export async function securityRequest(options: {
  tool: string;
  provider: string;
  providerConfigKey: string;
  path: string;
  input: Record<string, unknown>;
  init?: RequestInit;
  scan?: { projectId: string; scanType: string };
  actionName?: string;
}) {
  const user = await requireToolUser();
  if (!user) return unauthorized();
  const limited = await enforceRateLimit(`security:${user.id}:${options.provider}`);
  if (limited) return limited;
  const organization = await getOrganizationForUser(user.id);
  if (!organization) return error("Organization membership required", 403, "ORGANIZATION_REQUIRED");
  let integration: { connectionId: string | null } | null;
  try {
    integration = await getD1().then((db) =>
      db
        .prepare(
          "SELECT connection_id AS connectionId FROM integrations WHERE organization_id = ? AND provider = ? AND status = 'connected' ORDER BY created_at DESC LIMIT 1",
        )
        .bind(organization.id, options.providerConfigKey)
        .first<{ connectionId: string | null }>(),
    );
  } catch {
    return persistenceUnavailable();
  }
  if (!integration?.connectionId)
    return error(
      `${options.provider} is not connected for this workspace.`,
      409,
      "INTEGRATION_NOT_CONNECTED",
    );
  let result: { status: number; payload: unknown };
  try {
    result = options.actionName
      ? await nangoActionRequest({
          providerConfigKey: options.providerConfigKey,
          connectionId: integration.connectionId,
          actionName: options.actionName,
          input: options.input,
        })
      : await nangoProxyRequest({
          providerConfigKey: options.providerConfigKey,
          connectionId: integration.connectionId,
          path: options.path,
          init: options.init,
        });
  } catch {
    return error("The secure provider connection is unavailable.", 502, "PROVIDER_UNAVAILABLE");
  }
  const { status, payload } = result;
  try {
    await auditToolCall(
      options.tool,
      user.id,
      status >= 200 && status < 300 ? "accepted" : "rejected",
      {
        input: options.input,
        output: payload,
        actorType: "agent",
      },
    );
  } catch {
    return persistenceUnavailable();
  }
  if (options.scan) {
    try {
      const db = await getD1();
      await db
        .prepare(
          "INSERT INTO security_scans (id, organization_id, provider, project_id, scan_type, status, result_json, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        )
        .bind(
          crypto.randomUUID(),
          organization.id,
          options.provider.toLowerCase().replaceAll(".", ""),
          options.scan.projectId,
          options.scan.scanType,
          status >= 200 && status < 300 ? "completed" : "failed",
          JSON.stringify(payload ?? {}),
        )
        .run();
    } catch {
      return persistenceUnavailable();
    }
  }
  if (status < 200 || status >= 300)
    return error(
      `${options.provider} returned HTTP ${status}.`,
      status >= 500 ? 502 : status,
      "SECURITY_VENDOR_ERROR",
    );
  return json(payload);
}

export function requiredQuery(value: string | null, _name: string) {
  return value && value.trim().length > 0 && value.length <= 200 ? value.trim() : null;
}
