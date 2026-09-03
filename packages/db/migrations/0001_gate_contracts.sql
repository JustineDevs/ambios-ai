-- Gate contract migration for databases that already applied 0000_initial.
ALTER TABLE docs ADD COLUMN rationale TEXT NOT NULL DEFAULT '';
ALTER TABLE docs ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE budgets ADD COLUMN reserved_amount INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS guardrail_policies (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, agent_id TEXT NOT NULL UNIQUE, environments TEXT NOT NULL DEFAULT '["development","staging","production"]', require_approval INTEGER NOT NULL DEFAULT 1, blocked_patterns TEXT NOT NULL DEFAULT '["delete","drop","destroy","truncate","rm -rf"]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (organization_id) REFERENCES organizations(id), FOREIGN KEY (agent_id) REFERENCES agents(id));
CREATE TABLE IF NOT EXISTS budget_reservations (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, action_key TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'reserved', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT, FOREIGN KEY (organization_id) REFERENCES organizations(id));
ALTER TABLE budget_reservations ADD COLUMN period TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS budgets_org_period ON budgets (organization_id, period);
CREATE UNIQUE INDEX IF NOT EXISTS budget_reservations_org_action ON budget_reservations (organization_id, action_key);
CREATE INDEX IF NOT EXISTS budget_reservations_org_status ON budget_reservations (organization_id, status, created_at DESC);
CREATE TABLE IF NOT EXISTS idempotency_keys (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, operation TEXT NOT NULL, request_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', response_status INTEGER, response_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT, FOREIGN KEY (organization_id) REFERENCES organizations(id));
CREATE UNIQUE INDEX IF NOT EXISTS idempotency_scope_key ON idempotency_keys (organization_id, operation, id);
CREATE TABLE IF NOT EXISTS bootstrap_idempotency (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, operation TEXT NOT NULL, request_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', response_status INTEGER, response_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS bootstrap_idempotency_scope_key ON bootstrap_idempotency (user_id, operation, id);
CREATE TABLE IF NOT EXISTS webhook_events (id TEXT PRIMARY KEY, provider TEXT NOT NULL, event_type TEXT NOT NULL, payload_hash TEXT NOT NULL, received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, processed_at TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_provider_event ON webhook_events (provider, id);
CREATE TABLE IF NOT EXISTS approval_tokens (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, action_key TEXT NOT NULL, incident_id TEXT, instruction TEXT, status TEXT NOT NULL DEFAULT 'pending', expires_at TEXT NOT NULL, consumed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS approval_tokens_user_status ON approval_tokens (user_id, status, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS memberships_one_org_per_user ON memberships (user_id);
