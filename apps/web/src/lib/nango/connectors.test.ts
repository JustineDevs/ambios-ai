import { describe, expect, it } from "vitest";
import { connectorProviderSchema, isConnectorProvider } from "./connectors";

describe("connector provider contract", () => {
  it("accepts every standard catalog provider", () => {
    expect(connectorProviderSchema.parse("notion")).toBe("notion");
    expect(connectorProviderSchema.parse("cloudflare")).toBe("cloudflare");
    expect(connectorProviderSchema.parse("github")).toBe("github");
    expect(connectorProviderSchema.parse("snyk")).toBe("snyk");
    expect(connectorProviderSchema.parse("socket")).toBe("socket");
    for (const provider of [
      "jira",
      "google-drive",
      "google-calendar",
      "google-analytics",
      "slack",
      "linear",
      "hubspot",
      "stripe",
      "figma",
      "framer",
    ]) {
      expect(isConnectorProvider(provider)).toBe(true);
    }
    expect(isConnectorProvider("custom-rest")).toBe(false);
  });
});
