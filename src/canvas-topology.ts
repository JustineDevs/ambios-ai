type TopologyIncident = {
  id: string;
  title: string;
  context: string;
  status: string;
  service: string;
  severity?: string;
};

type TopologyAction = {
  id: string;
  actionType: string;
  status: string;
  approvalState: string;
  summary: string;
  operationId: string | null;
  relatedResourceType: string | null;
  relatedResourceId: string | null;
  createdAt: string;
};

type TopologyOperation = {
  id: string;
  kind: string;
  state: string;
  resourceType: string | null;
  resourceId: string | null;
  updatedAt: string;
};

type TopologyDecision = {
  id: string;
  operationId: string;
  verdict: string;
  reasonCode: string;
  evaluatedAt: string;
};

type TopologyDoc = {
  id: string;
  title: string;
  status: string;
  version: number;
};

type TopologyIntegration = {
  id: string;
  provider: string;
  providerDisplayName: string | null;
  status: string;
  connectionHealth: string;
  resourceMappingStatus: string;
  mappedResourceCount: number;
};

type GraphNode = {
  id: string;
  type: "service" | "incident" | "proposal" | "approval" | "action" | "vendor" | "security";
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  data: { relationship: string };
};

const edge = (id: string, source: string, target: string, relationship: string): GraphEdge => ({
  id,
  source,
  target,
  label: relationship,
  data: { relationship },
});

/** Build a read-only graph from canonical persisted records and their foreign keys. */
export function buildCanvasTopology(input: {
  incident: TopologyIncident;
  actions: TopologyAction[];
  operations: TopologyOperation[];
  decisions: TopologyDecision[];
  docs: TopologyDoc[];
  integrations: TopologyIntegration[];
}) {
  const incidentId = `incident:${input.incident.id}`;
  const nodes: GraphNode[] = [
    {
      id: incidentId,
      type: "incident",
      position: { x: 0, y: 0 },
      data: {
        label: input.incident.title,
        description: input.incident.context,
        status: input.incident.status,
        severity: input.incident.severity,
        resourceId: input.incident.id,
      },
    },
    {
      id: `service:${input.incident.service}`,
      type: "service",
      position: { x: 0, y: 220 },
      data: {
        label: input.incident.service,
        status: "persisted",
        resourceId: input.incident.service,
      },
    },
  ];
  const edges: GraphEdge[] = [
    edge(
      `incident-service:${input.incident.id}`,
      incidentId,
      `service:${input.incident.service}`,
      "affects_service",
    ),
  ];

  input.integrations.forEach((integration, index) => {
    const id = `vendor:${integration.id}`;
    nodes.push({
      id,
      type: "vendor",
      position: { x: 420, y: index * 180 },
      data: {
        label: integration.providerDisplayName || integration.provider,
        vendor: integration.provider,
        status: integration.status,
        description: `${integration.connectionHealth} · ${integration.resourceMappingStatus} · ${integration.mappedResourceCount} mapped resources`,
        resourceId: integration.id,
      },
    });
  });

  input.actions.forEach((action, index) => {
    const type = action.actionType === "structured_proposal" ? "proposal" : "action";
    const id = `${type}:${action.id}`;
    nodes.push({
      id,
      type,
      position: { x: 820, y: index * 180 },
      data: {
        label: action.actionType,
        description: action.summary,
        status: action.status,
        permissions: action.approvalState,
        resourceId: action.id,
      },
    });
    edges.push(
      edge(`incident-action:${input.incident.id}:${action.id}`, incidentId, id, "has_action"),
    );
    if (action.operationId) {
      edges.push(
        edge(
          `action-operation:${action.id}:${action.operationId}`,
          id,
          `operation:${action.operationId}`,
          "records_operation",
        ),
      );
    }
    if (action.relatedResourceType && action.relatedResourceId) {
      const vendorId = `vendor:${action.relatedResourceId}`;
      if (input.integrations.some((integration) => vendorId === `vendor:${integration.id}`)) {
        edges.push(
          edge(
            `action-resource:${action.id}:${action.relatedResourceId}`,
            id,
            vendorId,
            `targets_${action.relatedResourceType}`,
          ),
        );
      }
    }
  });

  input.operations.forEach((operation, index) => {
    const id = `operation:${operation.id}`;
    nodes.push({
      id,
      type: "action",
      position: { x: 1240, y: index * 180 },
      data: {
        label: operation.kind,
        description: operation.resourceId
          ? `${operation.resourceType ?? "resource"}: ${operation.resourceId}`
          : undefined,
        status: operation.state,
        resourceId: operation.id,
      },
    });
    input.decisions
      .filter((decision) => decision.operationId === operation.id)
      .forEach((decision, decisionIndex) => {
        const decisionId = `decision:${decision.id}`;
        nodes.push({
          id: decisionId,
          type: decision.verdict === "DENY" ? "security" : "approval",
          position: { x: 1640, y: index * 180 + decisionIndex * 90 },
          data: {
            label: `Governance ${decision.verdict}`,
            description: decision.reasonCode,
            status: decision.verdict,
            resourceId: decision.id,
          },
        });
        edges.push(
          edge(
            `operation-decision:${operation.id}:${decision.id}`,
            id,
            decisionId,
            "evaluated_by_governance",
          ),
        );
      });
  });

  input.docs.forEach((doc, index) => {
    const id = `doc:${doc.id}`;
    nodes.push({
      id,
      type: "proposal",
      position: { x: 420, y: 420 + index * 180 },
      data: {
        label: doc.title,
        description: `v${doc.version}`,
        status: doc.status,
        resourceId: doc.id,
      },
    });
    edges.push(
      edge(`incident-doc:${input.incident.id}:${doc.id}`, incidentId, id, "has_document_proposal"),
    );
  });

  return { nodes, edges, source: "persisted" as const };
}
