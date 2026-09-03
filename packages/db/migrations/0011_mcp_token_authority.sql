-- Bind opaque MCP credentials to the authorization server and protected resource.
-- Existing tokens without these bindings are intentionally invalid after rollout.
ALTER TABLE mcp_access_tokens ADD COLUMN issuer TEXT;
ALTER TABLE mcp_access_tokens ADD COLUMN audience TEXT;
ALTER TABLE mcp_refresh_tokens ADD COLUMN issuer TEXT;
ALTER TABLE mcp_refresh_tokens ADD COLUMN audience TEXT;
