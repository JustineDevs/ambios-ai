import { describe, expect, it } from "vitest";
import { getAgentSetupAccess } from "./agent-setup-access";

describe("agent setup access boundary", () => {
  it("requires sign-in when no token exists in normal or production mode", () => {
    expect(getAgentSetupAccess({ token: null })).toBe("sign-in-required");
  });

  it("treats a token as authenticated regardless of environment", () => {
    expect(getAgentSetupAccess({ token: "session-token" })).toBe("authenticated");
  });
});
