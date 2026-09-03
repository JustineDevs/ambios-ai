import { describe, expect, it } from "vitest";
import { connectorProviderSchema, isConnectorProvider } from "./connectors";

describe("connector provider contract", () => {
  it("accepts only supported providers", () => {
    expect(connectorProviderSchema.parse("notion")).toBe("notion");
    expect(connectorProviderSchema.parse("cloudflare")).toBe("cloudflare");
    expect(connectorProviderSchema.parse("github")).toBe("github");
    expect(connectorProviderSchema.parse("snyk")).toBe("snyk");
    expect(connectorProviderSchema.parse("socket")).toBe("socket");
    expect(isConnectorProvider("slack")).toBe(false);
  });
});
