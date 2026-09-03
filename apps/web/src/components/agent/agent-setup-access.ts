export type AgentSetupAccess = "authenticated" | "development-bypass" | "sign-in-required";

export function getAgentSetupAccess(input: {
  token: string | null;
  nodeEnv: string | undefined;
  authDisabled: string | undefined;
}): AgentSetupAccess {
  if (input.token) return "authenticated";
  if (input.nodeEnv !== "production" && input.authDisabled === "true") {
    return "development-bypass";
  }
  return "sign-in-required";
}
