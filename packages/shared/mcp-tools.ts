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

export const MCP_TOOLS = [
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
