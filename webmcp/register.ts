import { requestOperation } from "../apps/web/src/lib/api-client.ts";
import { createClient as createSupabaseBrowserClient } from "../apps/web/src/lib/supabase/client.ts";
import { type OperationId, operations } from "../packages/shared/operations.ts";
import { NANGO_CONNECTOR_CAPABILITIES, PROVIDER_CAPABILITIES } from "./capabilities.ts";
import { VENDOR_FEATURES } from "./vendor-feature-map.ts";

export type WebMCPExecutionContext = { signal?: AbortSignal };
export type WebMCPTool = {
  name: string;
  description: string;
  operationIds: readonly OperationId[];
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: Record<string, unknown>, context?: WebMCPExecutionContext) => Promise<unknown>;
};

type ModelContext = {
  registerTool(
    tool: Omit<WebMCPTool, "execute"> & { execute: WebMCPTool["execute"] },
  ): Promise<void>;
  unregisterTool?: (name: string) => Promise<void> | void;
};
type RegistrationResult = {
  registered: number;
  failed: number;
  errors?: string[];
  reason?: "unsupported";
  cleanup?: () => Promise<void>;
};

class ApiToolError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiToolError";
    this.code = code;
    this.status = status;
  }
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Navigator {
    modelContext?: ModelContext;
  }
}

const jsonHeaders = { "Content-Type": "application/json" };
const readOnlyTools = new Set([
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
const connectorProviders = NANGO_CONNECTOR_CAPABILITIES.map((capability) => capability.provider);
const untrustedContentTools = new Set([
  "ambios.nango.get_status",
  "ambios.list_incidents",
  "ambios.incident.get_incident_context",
  "ambios.incident.suggest_hotfixes",
  "ambios.docs.get_doc",
  "ambios.integrations.get_status",
]);

let activeSignal: AbortSignal | undefined;

async function callApi(
  operationId: OperationId,
  init?: RequestInit,
  params: Record<string, string> = {},
) {
  try {
    const headers = new Headers({ ...jsonHeaders, ...init?.headers });
    try {
      const {
        data: { session },
      } = await createSupabaseBrowserClient().auth.getSession();
      if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
      }
    } catch {
      // The API returns the canonical auth error when no browser session exists.
    }
    const template = operations[operationId].pathTemplate;
    const pathParams = new Set(
      [...template.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => match[1]),
    );
    const response = await requestOperation(
      operationId,
      { ...init, signal: init?.signal ?? activeSignal, headers },
      Object.fromEntries([...pathParams].map((key) => [key, params[key]])),
      Object.fromEntries(Object.entries(params).filter(([key]) => !pathParams.has(key))),
    );
    const payload = (await response.json().catch(() => null)) as {
      data?: unknown;
      detail?: string;
      code?: string;
    } | null;
    if (!response.ok) {
      const apiError =
        payload?.data && typeof payload.data === "object" && "error" in payload.data
          ? (payload.data as { error?: { code?: string; message?: string } }).error
          : undefined;
      const message =
        payload?.detail ?? apiError?.message ?? `AmbiOS request failed (${response.status})`;
      throw new ApiToolError(
        message,
        payload?.code ?? apiError?.code ?? `HTTP_${response.status}`,
        response.status,
      );
    }
    return { ok: true, data: payload?.data ?? null };
  } catch (cause) {
    if (cause instanceof ApiToolError)
      return {
        ok: false,
        error: { code: cause.code, message: cause.message, status: cause.status },
      };
    return {
      ok: false,
      error: { code: "TRANSPORT_ERROR", message: "AmbiOS API transport failed." },
    };
  }
}

type WebMCPToolDefinition = Omit<WebMCPTool, "operationIds">;

const toolDefinitions: WebMCPToolDefinition[] = [
  {
    name: "ambios.nango.get_status",
    description: "Read authenticated connector status and workspace readiness.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: async () => callApi("listIntegrations"),
  },
  {
    name: "ambios.nango.create_connect_session",
    description: "Start an authenticated connection session for a supported connector.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        provider: { type: "string", enum: connectorProviders },
        connectionId: { type: "string", minLength: 1, maxLength: 128 },
      },
      required: ["provider"],
    },
    execute: async (input) => {
      if (!connectorProviders.includes(input.provider as (typeof connectorProviders)[number]))
        return {
          ok: false,
          error: { code: "INVALID_PROVIDER", message: "Unsupported connector." },
        };
      const result = await callApi("connectNango", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          provider: input.provider,
          ...(typeof input.connectionId === "string" ? { connectionId: input.connectionId } : {}),
        }),
      });
      // Connect-session tokens are browser/UI credentials, never model-visible
      // WebMCP output. The Plugins UI calls the same endpoint directly when it
      // needs to hand the token to Nango's embedded connection flow.
      if (result.ok && result.data && typeof result.data === "object") {
        const data = result.data as Record<string, unknown>;
        const nested =
          data.data && typeof data.data === "object"
            ? (data.data as Record<string, unknown>)
            : data;
        const { connectSessionToken: _token, ...safeNested } = nested;
        return data.data && typeof data.data === "object"
          ? { ...data, data: safeNested }
          : { ...data, ...safeNested };
      }
      return result;
    },
  },
  {
    name: "ambios.identity.get_current_user",
    description: "Get the authenticated AmbiOS user, organization, and agent context.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: async () => callApi("getIdentity"),
  },
  {
    name: "ambios.list_incidents",
    description: "Read open AmbiOS incidents for the authenticated workspace.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: async () => callApi("listIncidents"),
  },
  {
    name: "ambios.incident.get_incident_context",
    description: "Read the authenticated context for one incident before proposing a change.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: { incidentId: { type: "string", minLength: 1, maxLength: 128 } },
      required: ["incidentId"],
    },
    execute: async (input) => {
      if (typeof input.incidentId !== "string" || input.incidentId.trim().length === 0)
        return {
          ok: false,
          error: { code: "INVALID_INCIDENT_INPUT", message: "incidentId is required." },
        };
      return callApi("getIncidentContext", undefined, { id: input.incidentId });
    },
  },
  {
    name: "ambios.incident.suggest_hotfixes",
    description: "Generate guardrail-evaluated hot-fix suggestions for one incident.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: { incidentId: { type: "string", minLength: 1, maxLength: 128 } },
      required: ["incidentId"],
    },
    execute: async (input) => {
      if (typeof input.incidentId !== "string" || input.incidentId.trim().length === 0)
        return {
          ok: false,
          error: { code: "INVALID_INCIDENT_INPUT", message: "incidentId is required." },
        };
      return callApi("suggestHotfixes", undefined, { id: input.incidentId });
    },
  },
  {
    name: "ambios.workspace.get_current_context",
    description: "Read the authenticated AmbiOS workspace, agent, incidents, actions, and docs.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: async () => callApi("getWorkspace"),
  },
  {
    name: "ambios.console.list_agent_actions",
    description: "Read the authenticated workspace activity console actions.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: async () => callApi("getConsole"),
  },
  {
    name: "ambios.docs.get_doc",
    description: "Read documentation proposals for the authenticated AmbiOS workspace.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: { docId: { type: "string", minLength: 1, maxLength: 128 } },
      required: ["docId"],
    },
    execute: async (input) => {
      if (typeof input.docId !== "string" || input.docId.trim().length === 0)
        return { ok: false, error: { code: "INVALID_DOC_INPUT", message: "docId is required." } };
      return callApi("getDoc", undefined, { id: input.docId });
    },
  },
  {
    name: "ambios.backend.get_status",
    description: "Read the current AmbiOS backend service status.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: async () => callApi("getCoreBackendStatus"),
  },
  {
    name: "ambios.payments.check_budget",
    description: "Check the authenticated workspace budget and estimated action cost.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: { estimatedCost: { type: "integer", minimum: 0, maximum: 1000000 } },
      required: ["estimatedCost"],
    },
    execute: async (input) => {
      if (
        typeof input.estimatedCost !== "number" ||
        !Number.isInteger(input.estimatedCost) ||
        input.estimatedCost < 0
      )
        return {
          ok: false,
          error: {
            code: "INVALID_BUDGET_INPUT",
            message: "estimatedCost must be a non-negative integer.",
          },
        };
      return callApi("checkBudget", {
        method: "POST",
        body: JSON.stringify({ estimatedCost: input.estimatedCost }),
      });
    },
  },
  {
    name: "ambios.guardrails.evaluate_guardrails",
    description: "Evaluate an instruction against AmbiOS guardrails before execution.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        instruction: { type: "string", minLength: 1, maxLength: 2000 },
        environment: { type: "string", enum: ["development", "staging", "production"] },
      },
      required: ["instruction"],
    },
    execute: async (input) => {
      if (typeof input.instruction !== "string" || input.instruction.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_GUARDRAIL_INPUT", message: "instruction is required." },
        };
      }
      return callApi("evaluateGuardrails", {
        method: "POST",
        body: JSON.stringify({
          instruction: input.instruction,
          environment: input.environment ?? "production",
        }),
      });
    },
  },
  {
    name: "ambios.incident.apply_hotfix",
    description:
      "Execute an approved, reviewable hot-fix and create a documentation proposal. Requires explicit human approval.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        incidentId: { type: "string", minLength: 1, maxLength: 128 },
        instruction: { type: "string", minLength: 1, maxLength: 2000 },
        approved: { type: "boolean", const: true, description: "Explicit human approval." },
        approvalSource: { type: "string", const: "human", description: "Human approval source." },
        approvalToken: {
          type: "string",
          minLength: 1,
          maxLength: 128,
          description: "Short-lived token issued after human review.",
        },
      },
      required: ["incidentId", "instruction", "approved", "approvalSource", "approvalToken"],
    },
    execute: async (input) => {
      if (input.approved !== true) {
        return {
          ok: false,
          error: { code: "APPROVAL_REQUIRED", message: "Human approval is required." },
        };
      }
      if (input.approvalSource !== "human" || typeof input.instruction !== "string") {
        return {
          ok: false,
          error: {
            code: "INVALID_HOTFIX_INPUT",
            message: "Human approval and instruction are required.",
          },
        };
      }
      if (typeof input.incidentId !== "string" || input.incidentId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_HOTFIX_INPUT", message: "incidentId is required." },
        };
      }
      if (typeof input.approvalToken !== "string" || input.approvalToken.trim().length === 0) {
        return {
          ok: false,
          error: {
            code: "APPROVAL_REQUIRED",
            message: "A fresh human approval token is required.",
          },
        };
      }
      try {
        return await callApi("executeHotfix", {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID(), "Content-Type": "application/json" },
          body: JSON.stringify({
            incidentId: input.incidentId,
            instruction: input.instruction,
            approved: true,
            approvalSource: "human",
            approvalToken: input.approvalToken,
          }),
        });
      } catch (cause) {
        if (cause instanceof ApiToolError)
          return {
            ok: false,
            error: { code: cause.code, message: cause.message, status: cause.status },
          };
        return {
          ok: false,
          error: {
            code: "TRANSPORT_ERROR",
            message: "AmbiOS could not reach the hot-fix API.",
          },
        };
      }
    },
  },
];

const toolOperationIds: Record<string, readonly OperationId[]> = {
  "ambios.nango.get_status": ["listIntegrations"],
  "ambios.nango.create_connect_session": ["connectNango"],
  "ambios.identity.get_current_user": ["getIdentity"],
  "ambios.list_incidents": ["listIncidents"],
  "ambios.incident.get_incident_context": ["getIncidentContext"],
  "ambios.incident.suggest_hotfixes": ["suggestHotfixes"],
  "ambios.workspace.get_current_context": ["getWorkspace"],
  "ambios.console.list_agent_actions": ["getConsole"],
  "ambios.docs.get_doc": ["getDoc"],
  "ambios.backend.get_status": ["getCoreBackendStatus"],
  "ambios.payments.check_budget": ["checkBudget"],
  "ambios.guardrails.evaluate_guardrails": ["evaluateGuardrails"],
  "ambios.incident.apply_hotfix": ["executeHotfix"],
  "ambios.integrations.get_status": ["listIntegrations"],
  "snyk.get_vulnerabilities": ["getSnykVulnerabilities"],
  "snyk.scan_project": ["runSnykScan"],
  "snyk.suggest_fix": ["getSnykFix"],
  "socket.analyze_package": ["analyzeSocketPackage"],
  "socket.get_supply_chain_report": ["getSocketReport"],
  "socket.detect_malware": ["detectSocketMalware"],
  "github.dependabot.list_alerts": ["getGithubSecurity"],
  "github.code-scanning.list_alerts": ["getGithubSecurity"],
  "github.secret-scanning.list_alerts": ["getGithubSecurity"],
  "ambios.integrations.sync": ["syncWorkspace"],
  "ambios.workspace.set_context": ["getWorkspace"],
  "ambios.audit.get_action_log": ["getConsole"],
  "ambios.docs.propose_doc_update": ["createDocProposal"],
  "ambios.backend.deploy_service": ["deployBackend"],
  search_products: [],
};

toolDefinitions.push({
  name: "ambios.integrations.get_status",
  description: "Read connector readiness and sync status for the authenticated workspace.",
  inputSchema: { type: "object", additionalProperties: false, properties: {} },
  execute: async () => callApi("listIntegrations"),
});
toolDefinitions.push({
  name: "search_products",
  description: "Search the public AmbiOS demo product catalog by name, category, or description.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: "string", maxLength: 100 },
      category: { type: "string", maxLength: 50 },
      limit: { type: "integer", minimum: 1, maximum: 20 },
    },
  },
  execute: async (input) => {
    const catalog = [
      {
        id: "ambios-starter",
        name: "AmbiOS Starter",
        category: "plans",
        description: "Governed workspace automation for small teams.",
      },
      {
        id: "ambios-team",
        name: "AmbiOS Team",
        category: "plans",
        description: "Shared approvals, audit trails, and provider connections.",
      },
      {
        id: "ambios-enterprise",
        name: "AmbiOS Enterprise",
        category: "plans",
        description: "Policy-controlled operations with deployment evidence.",
      },
      {
        id: "secure-connector",
        name: "Secure Connector",
        category: "connectors",
        description: "Credential-isolated provider access through Nango.",
      },
    ];
    const query = typeof input.query === "string" ? input.query.trim().toLowerCase() : "";
    const category = typeof input.category === "string" ? input.category.trim().toLowerCase() : "";
    const limit =
      typeof input.limit === "number" && Number.isInteger(input.limit)
        ? Math.min(20, Math.max(1, input.limit))
        : 10;
    const products = catalog
      .filter((product) => !category || product.category === category)
      .filter(
        (product) =>
          !query ||
          `${product.name} ${product.category} ${product.description}`
            .toLowerCase()
            .includes(query),
      )
      .slice(0, limit);
    return {
      ok: true,
      data: { products, count: products.length, query: query || null, category: category || null },
    };
  },
});
toolDefinitions.push({
  name: "snyk.get_vulnerabilities",
  description: "Read Snyk vulnerability issues for a configured organization.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: { severity: { type: "string" } },
  },
  execute: (input) =>
    callApi(
      "getSnykVulnerabilities",
      undefined,
      input.severity ? { severity: String(input.severity) } : {},
    ),
});
toolDefinitions.push({
  name: "snyk.scan_project",
  description: "Request a Snyk project scan through the connected workspace security account.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      projectId: { type: "string", minLength: 1 },
      scanType: { type: "string", enum: ["dependencies", "code", "container", "iac"] },
    },
    required: ["projectId", "scanType"],
  },
  execute: (input) => callApi("runSnykScan", { method: "POST", body: JSON.stringify(input) }),
});
toolDefinitions.push({
  name: "snyk.suggest_fix",
  description:
    "Return a reviewable Snyk remediation suggestion; never applies a dependency change.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: { vulnerabilityId: { type: "string", minLength: 1 } },
    required: ["vulnerabilityId"],
  },
  execute: (input) =>
    callApi("getSnykFix", undefined, { vulnerabilityId: String(input.vulnerabilityId) }),
});
toolDefinitions.push({
  name: "socket.analyze_package",
  description: "Read Socket.dev package risk scoring.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      packageName: { type: "string", minLength: 1 },
      version: { type: "string", minLength: 1 },
    },
    required: ["packageName", "version"],
  },
  execute: (input) =>
    callApi("analyzeSocketPackage", undefined, {
      package: String(input.packageName),
      version: String(input.version),
    }),
});
toolDefinitions.push({
  name: "socket.get_supply_chain_report",
  description: "Read a Socket full-scan report when a supported full-scan adapter is configured.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: { projectId: { type: "string", minLength: 1 } },
    required: ["projectId"],
  },
  execute: (input) => callApi("getSocketReport", undefined, { projectId: String(input.projectId) }),
});
toolDefinitions.push({
  name: "socket.detect_malware",
  description: "Check package malware status through a configured Socket analysis workflow.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: { packageName: { type: "string", minLength: 1 } },
    required: ["packageName"],
  },
  execute: (input) =>
    callApi("detectSocketMalware", undefined, { package: String(input.packageName) }),
});
for (const kind of ["dependabot", "code-scanning", "secret-scanning"] as const)
  toolDefinitions.push({
    name: `github.${kind}.list_alerts`,
    description: `Read GitHub ${kind} alerts for the configured repository.`,
    inputSchema: {
      type: "object",
      properties: { repo: { type: "string", pattern: "^[^/]+/[^/]+$" } },
      additionalProperties: false,
      required: ["repo"],
    },
    execute: (input) => callApi("getGithubSecurity", undefined, { kind, repo: String(input.repo) }),
  });
toolDefinitions.push({
  name: "ambios.integrations.sync",
  description: "Queue an authenticated connector sync and return its durable job status.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      provider: { type: "string", enum: connectorProviders },
      connectionId: { type: "string", minLength: 1, maxLength: 128 },
    },
    required: ["provider"],
  },
  execute: async (input) => {
    if (!connectorProviders.includes(String(input.provider) as (typeof connectorProviders)[number]))
      return { ok: false, error: { code: "INVALID_PROVIDER", message: "Unsupported connector." } };
    return callApi("syncWorkspace", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(input),
    });
  },
});
toolDefinitions.push({
  name: "ambios.workspace.set_context",
  description: "Create or update the authenticated AmbiOS workspace context.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: { name: { type: "string", minLength: 1, maxLength: 120 } },
    required: ["name"],
  },
  execute: async (input) => {
    if (typeof input.name !== "string" || input.name.trim().length === 0)
      return {
        ok: false,
        error: { code: "INVALID_WORKSPACE_INPUT", message: "name is required." },
      };
    return callApi("getWorkspace", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ name: input.name }),
    });
  },
});
toolDefinitions.push({
  name: "ambios.audit.get_action_log",
  description: "Read the append-only action log for the authenticated workspace.",
  inputSchema: { type: "object", additionalProperties: false, properties: {} },
  execute: async () => callApi("getConsole"),
});
toolDefinitions.push({
  name: "ambios.docs.propose_doc_update",
  description: "Create a reviewable documentation proposal linked to an incident.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      incidentId: { type: "string", minLength: 1, maxLength: 128 },
      title: { type: "string", minLength: 1, maxLength: 200 },
      body: { type: "string", minLength: 1, maxLength: 20000 },
      rationale: { type: "string", minLength: 1, maxLength: 2000 },
    },
    required: ["incidentId", "title", "body", "rationale"],
  },
  execute: async (input) => {
    if (
      !["incidentId", "title", "body", "rationale"].every(
        (key) => typeof input[key] === "string" && String(input[key]).trim().length > 0,
      )
    )
      return {
        ok: false,
        error: {
          code: "INVALID_DOC_INPUT",
          message: "incidentId, title, body, and rationale are required.",
        },
      };
    return callApi("createDocProposal", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(input),
    });
  },
});
toolDefinitions.push({
  name: "ambios.backend.deploy_service",
  description: "Deploy or roll back a service only with explicit human approval.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      service: { type: "string", minLength: 1, maxLength: 128 },
      environment: { type: "string", enum: ["development", "staging", "production"] },
      operation: { type: "string", enum: ["deploy", "rollback"] },
      approved: { type: "boolean", const: true },
      approvalSource: { type: "string", const: "human" },
      approvalToken: { type: "string", minLength: 1, maxLength: 128 },
    },
    required: [
      "service",
      "environment",
      "operation",
      "approved",
      "approvalSource",
      "approvalToken",
    ],
  },
  execute: async (input) => {
    if (
      input.approved !== true ||
      input.approvalSource !== "human" ||
      typeof input.approvalToken !== "string"
    )
      return {
        ok: false,
        error: { code: "APPROVAL_REQUIRED", message: "Explicit human approval is required." },
      };
    return callApi("deployBackend", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(input),
    });
  },
});

const tools: WebMCPTool[] = toolDefinitions
  .map((tool) => {
    const operationIds = toolOperationIds[tool.name];
    if (!operationIds || operationIds.some((id) => !operations[id])) {
      throw new Error(`WebMCP tool ${tool.name} has no canonical operation mapping.`);
    }
    return { ...tool, operationIds };
  })
  .filter((tool) => {
    const providerName = tool.name.split(".")[0];
    const capability = PROVIDER_CAPABILITIES.find((item) => item.provider === providerName);
    return !capability || !["locked", "roadmap"].includes(capability.status);
  });

export async function registerWebMCPTools(
  options: { signal?: AbortSignal; toolNames?: readonly string[] } = {},
) {
  if (registrationPromise) return registrationPromise;
  const candidateContexts = [
    typeof navigator !== "undefined" ? navigator.modelContext : undefined,
    typeof document !== "undefined" ? document.modelContext : undefined,
  ];
  const context = candidateContexts.find(
    (candidate) => candidate && typeof candidate.registerTool === "function",
  );
  if (!context) return { registered: 0, failed: 0, reason: "unsupported" as const };
  const requestedNames = options.toolNames ? new Set(options.toolNames) : undefined;
  const executableTools = tools.filter((tool) => {
    if (requestedNames && !requestedNames.has(tool.name)) return false;
    if (!readOnlyTools.has(tool.name)) return false;
    const providerName = tool.name.split(".")[0];
    const capability = PROVIDER_CAPABILITIES.find((item) => item.provider === providerName);
    if (!capability) return true;
    // Metadata-backed providers still expose their read/action contracts. Their
    // executor enforces the live Nango connection boundary; only locked and
    // roadmap providers are withheld from the browser registry.
    return capability?.status !== "locked" && capability?.status !== "roadmap";
  });
  registrationPromise = Promise.allSettled(
    executableTools.map(({ execute, ...tool }) => {
      const run = async (
        input: Record<string, unknown>,
        executionContext?: WebMCPExecutionContext,
      ) => {
        const previousSignal = activeSignal;
        activeSignal = executionContext?.signal ?? options.signal;
        try {
          return await execute(input, executionContext);
        } finally {
          activeSignal = previousSignal;
        }
      };
      return context.registerTool({
        ...tool,
        description: VENDOR_FEATURES[tool.name]?.description ?? tool.description,
        annotations: {
          readOnlyHint: VENDOR_FEATURES[tool.name]?.readOnly ?? readOnlyTools.has(tool.name),
          untrustedContentHint:
            untrustedContentTools.has(tool.name) || Boolean(VENDOR_FEATURES[tool.name]),
        },
        execute: run,
      });
    }),
  ).then((results) => {
    const registeredNames = executableTools.map((tool) => tool.name);
    return {
      registered: results.filter((result) => result.status === "fulfilled").length,
      failed: results.filter((result) => result.status === "rejected").length,
      errors: results.flatMap((result) =>
        result.status === "rejected"
          ? [result.reason instanceof Error ? result.reason.message : "Tool registration failed"]
          : [],
      ),
      cleanup: async () => {
        if (context.unregisterTool) {
          await Promise.all(registeredNames.map((name) => context.unregisterTool?.(name)));
        }
        if (context.unregisterTool) registrationPromise = undefined;
      },
    };
  });
  return registrationPromise;
}

let registrationPromise: Promise<RegistrationResult> | undefined;

export { tools as ambiosWebMCPTools };
