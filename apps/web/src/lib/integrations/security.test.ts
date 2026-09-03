import { describe, expect, it } from "vitest";
import { requiredQuery } from "./security";

describe("security integration input boundaries", () => {
  it("accepts bounded values and rejects empty or oversized values", () => {
    expect(requiredQuery("  org-1 ", "orgId")).toBe("org-1");
    expect(requiredQuery("", "orgId")).toBeNull();
    expect(requiredQuery("x".repeat(201), "orgId")).toBeNull();
  });
});
