import { describe, expect, it } from "vitest";
import { operationOrbState } from "./operation-indicator";

describe("operationOrbState", () => {
  it("maps active lifecycle states to the correct operational animation", () => {
    expect(operationOrbState("queued")).toBe("connecting");
    expect(operationOrbState("executing")).toBe("working");
    expect(operationOrbState("awaiting_approval")).toBe("listening");
    expect(operationOrbState("verifying")).toBe("shaping");
    expect(operationOrbState("syncing")).toBe("weaving");
  });

  it("does not animate terminal states", () => {
    expect(operationOrbState("succeeded")).toBeNull();
    expect(operationOrbState("failed")).toBeNull();
    expect(operationOrbState("denied")).toBeNull();
  });

  it("normalizes backend status spelling", () => {
    expect(operationOrbState("AWAITING-APPROVAL")).toBe("listening");
    expect(operationOrbState("  Running ")).toBe("working");
  });
});
