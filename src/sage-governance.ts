import {
  evaluateSage,
  SAGE_POLICY_VERSION,
  type SageDecision,
  type SageEvaluationInput,
} from "../packages/shared/sage-governance";

export type { SageDecision, SageEvaluationInput } from "../packages/shared/sage-governance";
export { evaluateSage, SAGE_POLICY_VERSION } from "../packages/shared/sage-governance";

export class SageDeniedError extends Error {
  readonly code = "SAGE_DENIED";
  readonly decision: SageDecision;

  constructor(decision: SageDecision) {
    super(decision.reason);
    this.name = "SageDeniedError";
    this.decision = decision;
  }
}

type SageDatabase = Pick<D1Database, "prepare" | "batch">;

/** Persist every verdict before any provider call. Database failure is fail-closed. */
export async function enforceSage(
  db: SageDatabase | undefined,
  input: SageEvaluationInput,
): Promise<SageDecision> {
  if (!db)
    throw new SageDeniedError({
      policyVersion: SAGE_POLICY_VERSION,
      verdict: "DENY",
      reasonCode: "INVALID_EXECUTION_CONTEXT",
      reason:
        "SAGE cannot establish a durable decision because the authority database is unavailable.",
      evaluatedAt: new Date().toISOString(),
    });

  const decision = evaluateSage(input);
  const decisionId = crypto.randomUUID();
  const now = decision.evaluatedAt;
  await db
    .prepare(
      `INSERT INTO sage_decisions
      (id, operation_id, actor_id, organization_id, workspace_id, capability, target,
       arguments_hash, approval_reference_hash, policy_version, verdict, reason_code,
       reason, evaluated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      decisionId,
      input.operationId,
      input.actorId,
      input.organizationId,
      input.workspaceId,
      input.capability,
      input.target,
      input.argumentsHash ?? null,
      input.approvalReferenceHash ?? null,
      decision.policyVersion,
      decision.verdict,
      decision.reasonCode,
      decision.reason,
      now,
    )
    .run();

  // The append-only actions ledger makes the decision visible in Runs/Console.
  await db
    .prepare(
      `INSERT INTO actions
      (id, organization_id, actor_type, actor_id, action_type, input_json, output_json,
       status, approval_state, operation_id, summary, created_at)
     VALUES (?, ?, 'system', ?, 'sage_governance', ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      decisionId,
      input.organizationId,
      input.actorId,
      JSON.stringify({
        operationId: input.operationId,
        capability: input.capability,
        target: input.target,
      }),
      JSON.stringify({
        policyVersion: decision.policyVersion,
        verdict: decision.verdict,
        reasonCode: decision.reasonCode,
      }),
      decision.verdict === "ALLOW" ? "succeeded" : "blocked",
      input.approvalValidated ? "approved" : "not_required",
      input.operationId,
      `SAGE ${decision.verdict}: ${decision.reasonCode}`,
      now,
    )
    .run();

  if (decision.verdict !== "ALLOW") throw new SageDeniedError(decision);
  return decision;
}
