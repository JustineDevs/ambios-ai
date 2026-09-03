import { getD1, getOrganizationForUser } from "./d1";

export type ActionSpec = {
  instruction: string;
  environment?: "development" | "staging" | "production";
};

export async function evaluateGuardrails(agentId: string, actionSpec: ActionSpec) {
  const organization = await getOrganizationForUser(agentId);
  if (!organization)
    return {
      riskScore: "high" as const,
      requiresApproval: true,
      allowed: false,
      rollbackAvailable: false,
      reasons: ["Agent policy context is unavailable."],
    };
  const db = await getD1();
  const policy = await db
    .prepare(
      "SELECT environments, require_approval AS requireApproval, blocked_patterns AS blockedPatterns FROM guardrail_policies WHERE organization_id = ? ORDER BY created_at LIMIT 1",
    )
    .bind(organization.id)
    .first<{ environments: string; requireApproval: number; blockedPatterns: string }>();
  if (!policy)
    return {
      riskScore: "high" as const,
      requiresApproval: true,
      allowed: false,
      rollbackAvailable: false,
      reasons: ["No guardrail policy is configured for this workspace agent."],
    };
  const patterns = JSON.parse(policy.blockedPatterns) as string[];
  const blocked = patterns.some((pattern) =>
    new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "i").test(
      actionSpec.instruction,
    ),
  );
  const sensitive =
    /\b(apply|deploy|rollback|write|update|restart|send|charge|publish|production)\b/i.test(
      actionSpec.instruction,
    );
  const environments = JSON.parse(policy.environments) as string[];
  const environmentAllowed = environments.includes(actionSpec.environment ?? "production");
  const production = actionSpec.environment === "production";
  return {
    riskScore: blocked || !environmentAllowed ? "high" : production || sensitive ? "medium" : "low",
    requiresApproval: Boolean(policy.requireApproval) && (production || sensitive),
    allowed: !blocked && environmentAllowed,
    rollbackAvailable: !blocked,
    reasons: blocked
      ? ["Destructive instruction is not allowed."]
      : !environmentAllowed
        ? ["The requested environment is not allowed by the agent policy."]
        : production
          ? ["Production changes require explicit human approval."]
          : [],
  } as const;
}
