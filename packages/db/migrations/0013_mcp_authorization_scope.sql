-- Bind MCP credentials to the authorized organization selected during consent.
-- Existing credentials without this binding are rejected after rollout.
ALTER TABLE mcp_authorization_codes ADD COLUMN organization_id TEXT;
ALTER TABLE mcp_access_tokens ADD COLUMN organization_id TEXT;
ALTER TABLE mcp_refresh_tokens ADD COLUMN organization_id TEXT;

CREATE INDEX IF NOT EXISTS mcp_access_tokens_scope
  ON mcp_access_tokens (organization_id, user_id, expires_at, revoked_at);
CREATE INDEX IF NOT EXISTS mcp_refresh_tokens_scope
  ON mcp_refresh_tokens (organization_id, user_id, expires_at, rotated_at);
