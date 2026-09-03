ALTER TABLE approval_tokens ADD COLUMN organization_id TEXT;
ALTER TABLE approval_tokens ADD COLUMN capability_hash TEXT;
ALTER TABLE approval_tokens ADD COLUMN arguments_hash TEXT;
CREATE INDEX IF NOT EXISTS approval_tokens_scope ON approval_tokens (organization_id, user_id, action_key, arguments_hash, status, expires_at);
