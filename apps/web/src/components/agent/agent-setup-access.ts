export type AgentSetupAccess = "authenticated" | "sign-in-required";

export function getAgentSetupAccess(input: { token: string | null }): AgentSetupAccess {
  if (input.token) return "authenticated";
  return "sign-in-required";
}
