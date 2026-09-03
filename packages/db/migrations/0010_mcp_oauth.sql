-- MCP OAuth 2.1 authorization server state. Secrets are stored only as
-- SHA-256 digests; raw authorization codes and bearer tokens are never
-- persisted.
CREATE TABLE IF NOT EXISTS mcp_clients (
  client_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  redirect_uris_json TEXT NOT NULL,
  client_uri TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mcp_authorization_requests (
  request_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  resource TEXT NOT NULL,
  scope TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL,
  state TEXT,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES mcp_clients(client_id)
);

CREATE TABLE IF NOT EXISTS mcp_authorization_codes (
  code_hash TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  resource TEXT NOT NULL,
  scope TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES mcp_authorization_requests(request_id),
  FOREIGN KEY (client_id) REFERENCES mcp_clients(client_id)
);

CREATE TABLE IF NOT EXISTS mcp_access_tokens (
  token_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  resource TEXT NOT NULL,
  scope TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES mcp_clients(client_id)
);

CREATE TABLE IF NOT EXISTS mcp_refresh_tokens (
  token_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  resource TEXT NOT NULL,
  scope TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  rotated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES mcp_clients(client_id)
);

CREATE INDEX IF NOT EXISTS mcp_auth_requests_expiry ON mcp_authorization_requests (expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS mcp_auth_codes_request ON mcp_authorization_codes (request_id);
CREATE INDEX IF NOT EXISTS mcp_auth_codes_expiry ON mcp_authorization_codes (expires_at);
CREATE INDEX IF NOT EXISTS mcp_access_tokens_expiry ON mcp_access_tokens (expires_at, revoked_at);
CREATE INDEX IF NOT EXISTS mcp_refresh_tokens_expiry ON mcp_refresh_tokens (expires_at, rotated_at);
