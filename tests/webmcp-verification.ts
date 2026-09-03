import assert from "node:assert/strict";
import { MCP_TOOLS } from "../packages/shared/mcp-tools.ts";
import { ambiosWebMCPTools, registerWebMCPTools } from "../webmcp/register.ts";
import { VENDOR_FEATURE_MAP } from "../webmcp/vendor-feature-map.ts";

const expected = new Set([
  "search_products",
  "ambios.nango.get_status",
  "ambios.nango.create_connect_session",
  "ambios.identity.get_current_user",
  "ambios.list_incidents",
  "ambios.incident.get_incident_context",
  "ambios.incident.suggest_hotfixes",
  "ambios.workspace.get_current_context",
  "ambios.workspace.set_context",
  "ambios.console.list_agent_actions",
  "ambios.docs.get_doc",
  "ambios.docs.propose_doc_update",
  "ambios.backend.get_status",
  "ambios.backend.deploy_service",
  "ambios.payments.check_budget",
  "ambios.guardrails.evaluate_guardrails",
  "ambios.incident.apply_hotfix",
  "ambios.integrations.get_status",
  "ambios.integrations.sync",
  "ambios.audit.get_action_log",
  "snyk.get_vulnerabilities",
  "snyk.scan_project",
  "snyk.suggest_fix",
  "socket.analyze_package",
  "socket.get_supply_chain_report",
  "socket.detect_malware",
  "github.dependabot.list_alerts",
  "github.code-scanning.list_alerts",
  "github.secret-scanning.list_alerts",
]);
assert.equal(ambiosWebMCPTools.length, expected.size);
for (const tool of ambiosWebMCPTools) {
  assert.ok(expected.has(tool.name));
  assert.ok(tool.description.length > 20);
  assert.ok(tool.description.length <= 500);
  assert.equal(tool.inputSchema.type, "object");
}

const registered: Array<{
  name: string;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
}> = [];
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    modelContext: {
      registerTool: async (tool: {
        name: string;
        execute: (input: Record<string, unknown>) => Promise<unknown>;
        annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
      }) => registered.push(tool),
    },
  },
});
const registration = await registerWebMCPTools();
const safeNames = new Set([
  "search_products",
  "ambios.nango.get_status",
  "ambios.identity.get_current_user",
  "ambios.list_incidents",
  "ambios.incident.get_incident_context",
  "ambios.incident.suggest_hotfixes",
  "ambios.workspace.get_current_context",
  "ambios.console.list_agent_actions",
  "ambios.docs.get_doc",
  "ambios.backend.get_status",
  "ambios.payments.check_budget",
  "ambios.guardrails.evaluate_guardrails",
  "ambios.integrations.get_status",
  "snyk.get_vulnerabilities",
  "socket.analyze_package",
  "github.dependabot.list_alerts",
  "github.code-scanning.list_alerts",
  "github.secret-scanning.list_alerts",
]);
assert.equal(registration.registered, safeNames.size);
assert.equal(registration.failed, 0);
for (const feature of VENDOR_FEATURE_MAP)
  assert.ok(ambiosWebMCPTools.some((tool) => tool.name === feature.toolName));
assert.deepEqual(new Set(registered.map((tool) => tool.name)), safeNames);
assert.ok(registered.every((tool) => typeof tool.execute === "function"));
const productSearch = ambiosWebMCPTools.find((tool) => tool.name === "search_products");
assert.ok(productSearch);
assert.deepEqual(await productSearch.execute({ query: "enterprise" }), {
  ok: true,
  data: {
    products: [
      {
        id: "ambios-enterprise",
        name: "AmbiOS Enterprise",
        category: "plans",
        description: "Policy-controlled operations with deployment evidence.",
      },
    ],
    count: 1,
    query: "enterprise",
    category: null,
  },
});
assert.equal(
  registered.find((tool) => tool.name === "ambios.identity.get_current_user")?.annotations
    ?.readOnlyHint,
  true,
);
assert.equal(
  registered.find((tool) => tool.name === "ambios.docs.get_doc")?.annotations?.untrustedContentHint,
  true,
);

const connectorSync = ambiosWebMCPTools.find((tool) => tool.name === "ambios.integrations.sync");
assert.ok(connectorSync);
assert.deepEqual(await connectorSync.execute({ provider: "unknown" }), {
  ok: false,
  error: { code: "INVALID_PROVIDER", message: "Unsupported connector." },
});

const nangoSession = ambiosWebMCPTools.find(
  (tool) => tool.name === "ambios.nango.create_connect_session",
);
assert.ok(nangoSession);
const providerEnum = (nangoSession.inputSchema.properties as { provider: { enum: string[] } })
  .provider.enum;
assert.ok(providerEnum.includes("snyk"));
assert.ok(providerEnum.includes("socket"));
assert.deepEqual(await nangoSession.execute({ provider: "unknown" }), {
  ok: false,
  error: { code: "INVALID_PROVIDER", message: "Unsupported connector." },
});
const hotfix = ambiosWebMCPTools.find((tool) => tool.name === "ambios.incident.apply_hotfix");
assert.ok(hotfix);
const rejected = await hotfix.execute({ approved: false });
assert.deepEqual(rejected, {
  ok: false,
  error: { code: "APPROVAL_REQUIRED", message: "Human approval is required." },
});
const guardrails = ambiosWebMCPTools.find(
  (tool) => tool.name === "ambios.guardrails.evaluate_guardrails",
);
assert.ok(guardrails);
assert.deepEqual(await guardrails.execute({}), {
  ok: false,
  error: { code: "INVALID_GUARDRAIL_INPUT", message: "instruction is required." },
});
for (const name of ["ambios.incident.get_incident_context", "ambios.incident.suggest_hotfixes"]) {
  const incidentTool = ambiosWebMCPTools.find((tool) => tool.name === name);
  assert.ok(incidentTool);
  assert.deepEqual(await incidentTool.execute({}), {
    ok: false,
    error: { code: "INVALID_INCIDENT_INPUT", message: "incidentId is required." },
  });
}
console.log(`WebMCP contract verification passed for ${ambiosWebMCPTools.length} tools.`);

for (const tool of MCP_TOOLS) {
  assert.equal(tool.inputSchema.type, "object");
  assert.equal(tool.outputSchema.type, "object");
  assert.ok(tool.operationIds.length > 0);
  assert.equal(typeof tool.annotations.readOnlyHint, "boolean");
  assert.equal(typeof tool.annotations.destructiveHint, "boolean");
  assert.equal(typeof tool.annotations.openWorldHint, "boolean");
  const serialized = JSON.stringify(tool.outputSchema);
  for (const forbidden of [
    "organizationId",
    "workspaceId",
    "sessionId",
    "traceId",
    "requestId",
    "access_token",
    "refresh_token",
  ])
    assert.equal(serialized.includes(forbidden), false, `${tool.name} exposes ${forbidden}`);
}
assert.equal(new Set(MCP_TOOLS.map((tool) => tool.name)).size, MCP_TOOLS.length);
console.log(`Remote MCP contract verification passed for ${MCP_TOOLS.length} tools.`);
