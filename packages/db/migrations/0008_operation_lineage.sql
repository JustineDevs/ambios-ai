CREATE TABLE IF NOT EXISTS operations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  tool TEXT,
  resource_type TEXT,
  resource_id TEXT,
  request_hash TEXT,
  state TEXT NOT NULL DEFAULT 'submitted',
  lease_owner TEXT,
  heartbeat_at TEXT,
  result_json TEXT NOT NULL DEFAULT '{}',
  error TEXT,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, reset_at TEXT NOT NULL);
ALTER TABLE actions ADD COLUMN operation_id TEXT;
ALTER TABLE sync_jobs ADD COLUMN operation_id TEXT;
ALTER TABLE security_scans ADD COLUMN operation_id TEXT;
ALTER TABLE webhook_events ADD COLUMN operation_id TEXT;
CREATE INDEX IF NOT EXISTS operations_org_created ON operations (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS operations_org_state_updated ON operations (organization_id, state, updated_at DESC);
CREATE INDEX IF NOT EXISTS operations_lease_heartbeat ON operations (state, heartbeat_at);
CREATE INDEX IF NOT EXISTS rate_limits_reset ON rate_limits (reset_at);
CREATE INDEX IF NOT EXISTS actions_operation ON actions (operation_id);
CREATE INDEX IF NOT EXISTS sync_jobs_operation ON sync_jobs (operation_id);
CREATE INDEX IF NOT EXISTS security_scans_operation ON security_scans (operation_id);
CREATE INDEX IF NOT EXISTS webhook_events_operation ON webhook_events (operation_id);
