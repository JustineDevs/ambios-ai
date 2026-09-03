import { describe, expect, it } from "vitest";
import { getAgentSetupAccess } from "./agent-setup-access";

describe("agent setup access boundary", () => {
  it("requires sign-in when no token exists in normal or production mode", () => {
    expect(getAgentSetupAccess({ token: null, nodeEnv: "production", authDisabled: "true" })).toBe(
      "sign-in-required",
    );
    expect(
      getAgentSetupAccess({ token: null, nodeEnv: "development", authDisabled: "false" }),
    ).toBe("sign-in-required");
  });

  it("only permits the explicit local development bypass", () => {
    expect(getAgentSetupAccess({ token: null, nodeEnv: "development", authDisabled: "true" })).toBe(
      "development-bypass",
    );
  });

  it("treats a token as authenticated regardless of environment", () => {
    expect(
      getAgentSetupAccess({ token: "session-token", nodeEnv: "production", authDisabled: "true" }),
    ).toBe("authenticated");
  });
});
