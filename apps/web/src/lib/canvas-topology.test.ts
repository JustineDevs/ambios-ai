import { describe, expect, it } from "vitest";
import { buildCanvasTopology } from "../../../../src/canvas-topology";

describe("buildCanvasTopology", () => {
  it("projects persisted lifecycle relationships with stable semantic labels", () => {
    const graph = buildCanvasTopology({
      incident: {
        id: "inc-1",
        title: "Checkout latency",
        context: "{}",
        status: "open",
        service: "checkout",
        severity: "high",
      },
      actions: [
        {
          id: "act-1",
          actionType: "structured_proposal",
          status: "proposed",
          approvalState: "pending",
          summary: "Increase checkout capacity",
          operationId: "op-1",
          relatedResourceType: "integration",
          relatedResourceId: "int-1",
          createdAt: "2026-01-01",
        },
      ],
      operations: [
        {
          id: "op-1",
          kind: "hotfix",
          state: "recorded",
          resourceType: "service",
          resourceId: "checkout",
          updatedAt: "2026-01-01",
        },
      ],
      decisions: [
        {
          id: "dec-1",
          operationId: "op-1",
          verdict: "DENY",
          reasonCode: "policy_block",
          evaluatedAt: "2026-01-01",
        },
      ],
      docs: [{ id: "doc-1", title: "Hotfix proposal", status: "proposal", version: 1 }],
      integrations: [
        {
          id: "int-1",
          provider: "github",
          providerDisplayName: "GitHub",
          status: "connected",
          connectionHealth: "healthy",
          resourceMappingStatus: "mapped",
          mappedResourceCount: 1,
        },
      ],
    });
    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining([
        "incident:inc-1",
        "service:checkout",
        "proposal:act-1",
        "operation:op-1",
        "decision:dec-1",
        "doc:doc-1",
        "vendor:int-1",
      ]),
    );
    expect(graph.edges.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "affects_service",
        "has_action",
        "records_operation",
        "evaluated_by_governance",
        "has_document_proposal",
        "targets_integration",
      ]),
    );
    expect(graph.edges.find((item) => item.label === "triggers_proposal_for")).toBeUndefined();
  });

  it("does not create an action-to-resource edge without a persisted matching resource", () => {
    const graph = buildCanvasTopology({
      incident: { id: "inc-1", title: "Incident", context: "{}", status: "open", service: "api" },
      actions: [
        {
          id: "act-1",
          actionType: "hotfix",
          status: "denied",
          approvalState: "rejected",
          summary: "Blocked",
          operationId: null,
          relatedResourceType: "integration",
          relatedResourceId: "missing",
          createdAt: "2026-01-01",
        },
      ],
      operations: [],
      decisions: [],
      docs: [],
      integrations: [],
    });
    expect(graph.edges.some((item) => item.label === "targets_integration")).toBe(false);
  });
});
