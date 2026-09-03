import type { McpScope } from "./mcp-resource-registry";
import type { OperationId } from "./operations";

export type McpToolDefinition = {
  name: string;
  operationIds: readonly OperationId[];
  scope: McpScope;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    openWorldHint: boolean;
  };
};

const emptyInput = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

const incidentInput = {
  type: "object",
  properties: { incidentRef: { type: "string", minLength: 1, maxLength: 128 } },
  required: ["incidentRef"],
  additionalProperties: false,
} as const;

const actionInput = {
  type: "object",
  properties: { actionRef: { type: "string", minLength: 1, maxLength: 128 } },
  required: ["actionRef"],
  additionalProperties: false,
} as const;

const proposalInput = {
  type: "object",
  properties: {
    incidentRef: { type: "string", minLength: 1, maxLength: 128 },
    objective: { type: "string", minLength: 10, maxLength: 1000 },
    requestedAction: { type: "string", minLength: 10, maxLength: 1000 },
  },
  required: ["incidentRef", "objective", "requestedAction"],
  additionalProperties: false,
} as const;

export const MCP_TOOLS = [
  {
    name: "get_incident_context",
    operationIds: ["getIncidentContext"],
    scope: "ambios.incidents.read",
    description: "Read evidence-backed context for one authorized workspace incident.",
    inputSchema: incidentInput,
    outputSchema: {
      type: "object",
      required: [
        "incidentRef",
        "title",
        "service",
        "severity",
        "status",
        "verifiedFacts",
        "unknowns",
        "source",
      ],
      properties: {
        incidentRef: { type: "string" },
        title: { type: "string" },
        service: { type: "string" },
        severity: { type: "string" },
        status: { type: "string" },
        verifiedFacts: { type: "array", items: { type: "string" } },
        unknowns: { type: "array", items: { type: "string" } },
        source: { const: "incident-record" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "create_structured_proposal",
    operationIds: ["requestHotfixApproval"],
    scope: "ambios.proposals.create",
    description: "Persist a structured, non-executing proposal for an authorized incident.",
    inputSchema: proposalInput,
    outputSchema: {
      type: "object",
      required: ["proposalRef", "status", "approvalRequired", "source"],
      properties: {
        proposalRef: { type: "string" },
        status: { const: "proposed" },
        approvalRequired: { const: true },
        source: { const: "action-record" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "get_approval_status",
    operationIds: ["listActions"],
    scope: "ambios.approvals.read",
    description: "Read the persisted approval state for one authorized action.",
    inputSchema: actionInput,
    outputSchema: {
      type: "object",
      required: ["actionRef", "status", "approvalState", "source"],
      properties: {
        actionRef: { type: "string" },
        status: { type: "string" },
        approvalState: { type: "string" },
        source: { const: "action-record" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "inspect_action_or_run",
    operationIds: ["listActions"],
    scope: "ambios.actions.read",
    description: "Read one persisted governed action and its current lifecycle state.",
    inputSchema: actionInput,
    outputSchema: {
      type: "object",
      required: ["actionRef", "status", "summary", "source"],
      properties: {
        actionRef: { type: "string" },
        status: { type: "string" },
        summary: { type: "string" },
        source: { const: "action-record" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "get_verification_result",
    operationIds: ["listActions"],
    scope: "ambios.verification.read",
    description: "Read independent verification evidence persisted for one governed action.",
    inputSchema: actionInput,
    outputSchema: {
      type: "object",
      required: ["actionRef", "status", "available", "source"],
      properties: {
        actionRef: { type: "string" },
        status: { type: "string" },
        available: { type: "boolean" },
        source: { const: "action-record" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "get_workspace_readiness",
    operationIds: ["getReadiness"],
    scope: "ambios.workspace.read",
    description:
      "Read readiness and connected-provider status for the authorized AmbiOS workspace.",
    inputSchema: emptyInput,
    outputSchema: {
      type: "object",
      required: ["ready", "integrations", "source"],
      properties: {
        ready: { type: "boolean" },
        integrations: {
          type: "array",
          items: {
            type: "object",
            required: ["provider", "status"],
            properties: { provider: { type: "string" }, status: { type: "string" } },
            additionalProperties: false,
          },
        },
        source: { const: "workspace-record" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "get_current_workspace_context",
    operationIds: ["getWorkspace"],
    scope: "ambios.workspace.read",
    description: "Read the identity and scope of the authorized AmbiOS workspace.",
    inputSchema: emptyInput,
    outputSchema: {
      type: "object",
      required: ["name", "source"],
      properties: { name: { type: "string" }, source: { const: "workspace-record" } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "list_active_incidents",
    operationIds: ["listIncidents"],
    scope: "ambios.incidents.read",
    description: "Read active incidents scoped to the authorized AmbiOS workspace.",
    inputSchema: emptyInput,
    outputSchema: {
      type: "object",
      required: ["incidents", "source"],
      properties: {
        incidents: {
          type: "array",
          items: {
            type: "object",
            required: ["title", "service", "severity", "status"],
            properties: {
              title: { type: "string" },
              service: { type: "string" },
              severity: { type: "string" },
              status: { type: "string" },
            },
            additionalProperties: false,
          },
        },
        source: { const: "incident-records" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "get_audit_timeline",
    operationIds: ["getConsole"],
    scope: "ambios.audit.read",
    description: "Read the recent audit timeline for the authorized AmbiOS workspace.",
    inputSchema: emptyInput,
    outputSchema: {
      type: "object",
      required: ["events", "source"],
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            required: ["actionType", "status", "summary"],
            properties: {
              actionType: { type: "string" },
              status: { type: "string" },
              summary: { type: "string" },
            },
            additionalProperties: false,
          },
        },
        source: { const: "audit-records" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
] as const satisfies readonly McpToolDefinition[];

export const mcpToolByName = new Map(MCP_TOOLS.map((tool) => [tool.name, tool]));
