import { describe, expect, it } from "vitest";
import {
  MCP_DEFAULT_SCOPES,
  MCP_SCOPES,
  mcpConfiguration,
  validateMcpResource,
  validateMcpScopes,
} from "../../shared/mcp-resource-registry";

describe("canonical MCP resource and scope registry", () => {
  const env = {
    NODE_ENV: "production",
    MCP_RESOURCE_URL: "https://mcp.example.test/mcp",
    MCP_AUTHORIZATION_SERVER_URL: "https://auth.example.test",
  };

  it("produces metadata endpoints and least-privilege defaults from one registry", () => {
    const config = mcpConfiguration(env);
    expect(config.resource).toBe(env.MCP_RESOURCE_URL);
    expect(config.authorizationEndpoint).toBe("https://auth.example.test/authorize");
    expect(config.defaultScopes).toEqual(MCP_DEFAULT_SCOPES);
    expect(config.scopes).toEqual(MCP_SCOPES);
    expect(config.scopes).not.toContain("mcp");
  });

  it("accepts only the canonical resource while preserving path identity", () => {
    expect(validateMcpResource(env.MCP_RESOURCE_URL, env).ok).toBe(true);
    expect(validateMcpResource("https://mcp.example.test/mcp/", env).code).toBe("invalid_target");
    expect(validateMcpResource("https://app.example.test/mcp", env).code).toBe("invalid_target");
    expect(validateMcpResource(undefined, env).code).toBe("invalid_request");
  });

  it("rejects wildcard and unknown scopes and returns canonical ordering", () => {
    const result = validateMcpScopes("ambios.audit.read ambios.workspace.read ambios.audit.read");
    expect(result.ok && result.value).toBe("ambios.workspace.read ambios.audit.read");
    expect(validateMcpScopes("mcp").code).toBe("invalid_scope");
    expect(validateMcpScopes("ambios.not-real.read").code).toBe("invalid_scope");
  });
});
