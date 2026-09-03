/**
 * AmbiOS SAGE governance contract.
 *
 * SAGE is deliberately deterministic and dependency-free at the execution
 * boundary. It is a mandatory policy gate, not a UI hint or an environment
 * feature flag. Provider execution may proceed only after this contract
 * returns ALLOW and the decision is persisted by the owning Worker.
 */
export const SAGE_POLICY_VERSION = "ambios-sage-1" as const;

export type SageVerdict = "ALLOW" | "ASK" | "DENY";
export type SageOperationClass = "read" | "proposal" | "mutation" | "execution";

export type SageEvaluationInput = {
  operationId: string;
  operationClass: SageOperationClass;
  actorId: string;
  organizationId: string;
  workspaceId: string;
  capability: string;
  target: string;
  argumentsJson: string;
  approvalValidated?: boolean;
  approvalReferenceHash?: string;
  argumentsHash?: string;
};

export type SageDecision = {
  policyVersion: typeof SAGE_POLICY_VERSION;
  verdict: SageVerdict;
  reasonCode:
    | "READ_ONLY_ALLOWED"
    | "EXACT_APPROVAL_REQUIRED"
    | "EXACT_APPROVAL_MISSING"
    | "DANGEROUS_PAYLOAD"
    | "INVALID_EXECUTION_CONTEXT";
  reason: string;
  evaluatedAt: string;
};

const dangerousPayload =
  /(?:rm\s+-rf|drop\s+table|truncate\s+table|delete\s+all|destroy\s+all|sudo\b|curl\s+[^\s]+\s*\|\s*(?:sh|bash)|powershell\s+-enc)/i;

/** Evaluate the exact operation context. No caller-controlled bypass exists. */
export function evaluateSage(
  input: SageEvaluationInput,
  now = new Date().toISOString(),
): SageDecision {
  const invalidContext =
    !input.operationId ||
    !input.actorId ||
    !input.organizationId ||
    !input.workspaceId ||
    !input.capability ||
    !input.target ||
    !input.argumentsJson;

  if (invalidContext) {
    return {
      policyVersion: SAGE_POLICY_VERSION,
      verdict: "DENY",
      reasonCode: "INVALID_EXECUTION_CONTEXT",
      reason:
        "SAGE requires actor, tenant, workspace, capability, target, and canonical arguments.",
      evaluatedAt: now,
    };
  }

  if (dangerousPayload.test(input.argumentsJson)) {
    return {
      policyVersion: SAGE_POLICY_VERSION,
      verdict: "DENY",
      reasonCode: "DANGEROUS_PAYLOAD",
      reason: "SAGE denied a payload matching a destructive or shell-execution pattern.",
      evaluatedAt: now,
    };
  }

  if (input.operationClass === "read") {
    return {
      policyVersion: SAGE_POLICY_VERSION,
      verdict: "ALLOW",
      reasonCode: "READ_ONLY_ALLOWED",
      reason: "SAGE allowed a bounded read-only provider operation.",
      evaluatedAt: now,
    };
  }

  if (!input.approvalValidated || !input.approvalReferenceHash || !input.argumentsHash) {
    return {
      policyVersion: SAGE_POLICY_VERSION,
      verdict: "ASK",
      reasonCode: "EXACT_APPROVAL_MISSING",
      reason:
        "SAGE requires a server-validated, exact, expiring, single-use human approval before provider execution.",
      evaluatedAt: now,
    };
  }

  return {
    policyVersion: SAGE_POLICY_VERSION,
    verdict: "ALLOW",
    reasonCode: "EXACT_APPROVAL_REQUIRED",
    reason: "SAGE allowed execution after exact approval context was validated by the server.",
    evaluatedAt: now,
  };
}
