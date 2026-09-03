-- Ensure approval storage exists when 0001 was applied before approval tokens were introduced.
CREATE TABLE IF NOT EXISTS approval_tokens (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, action_key TEXT NOT NULL, incident_id TEXT, instruction TEXT, status TEXT NOT NULL DEFAULT 'pending', expires_at TEXT NOT NULL, consumed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS approval_tokens_user_status ON approval_tokens (user_id, status, expires_at);
