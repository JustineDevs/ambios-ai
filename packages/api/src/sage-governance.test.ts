import { describe, expect, it } from "vitest";
import { enforceSage, SageDeniedError } from "../../../src/sage-governance";
import { evaluateSage } from "../../shared/sage-governance";

const base = {
  operationId: "op-1",
  actorId: "user-1",
  organizationId: "org-1",
  workspaceId: "ws-1",
  capability: "provider.read",
  target: "github:connection-1",
  argumentsJson: '{"repo":"ambios"}',
};

describe("mandatory SAGE governance", () => {
  it("allows bounded read-only operations", () => {
    expect(evaluateSage({ ...base, operationClass: "read" }).verdict).toBe("ALLOW");
  });

  it("requires exact server-validated approval before execution", () => {
    const decision = evaluateSage({ ...base, operationClass: "execution" });
    expect(decision.verdict).toBe("ASK");
    expect(decision.reasonCode).toBe("EXACT_APPROVAL_MISSING");
  });

  it("allows execution only with approval and argument binding", () => {
    const decision = evaluateSage({
      ...base,
      operationClass: "execution",
      approvalValidated: true,
      approvalReferenceHash: "approval-hash",
      argumentsHash: "arguments-hash",
    });
    expect(decision.verdict).toBe("ALLOW");
  });

  it("denies destructive or shell-like payloads even when approved", () => {
    const decision = evaluateSage({
      ...base,
      operationClass: "execution",
      argumentsJson: '{"instruction":"rm -rf production"}',
      approvalValidated: true,
      approvalReferenceHash: "approval-hash",
      argumentsHash: "arguments-hash",
    });
    expect(decision.verdict).toBe("DENY");
    expect(decision.reasonCode).toBe("DANGEROUS_PAYLOAD");
  });

  it("denies incomplete context", () => {
    const decision = evaluateSage({ ...base, operationClass: "read", target: "" });
    expect(decision.verdict).toBe("DENY");
    expect(decision.reasonCode).toBe("INVALID_EXECUTION_CONTEXT");
  });

  it("fails closed when the authority database is unavailable", async () => {
    await expect(
      enforceSage(undefined, { ...base, operationClass: "execution" }),
    ).rejects.toBeInstanceOf(SageDeniedError);
  });
});
