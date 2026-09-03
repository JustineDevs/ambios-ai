-- Durable Phase 0 provider status and sync-job state.
ALTER TABLE integrations ADD COLUMN last_sync_at TEXT;
ALTER TABLE integrations ADD COLUMN last_sync_status TEXT;
ALTER TABLE integrations ADD COLUMN last_error TEXT;
ALTER TABLE integrations ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE sync_jobs ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_jobs ADD COLUMN error TEXT;
ALTER TABLE sync_jobs ADD COLUMN started_at TEXT;
ALTER TABLE sync_jobs ADD COLUMN completed_at TEXT;
ALTER TABLE sync_jobs ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sync_jobs ADD COLUMN result_json TEXT NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS sync_jobs_provider_status ON sync_jobs (provider, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS integrations_org_provider_connection
  ON integrations (organization_id, provider, connection_id)
  WHERE connection_id IS NOT NULL;
