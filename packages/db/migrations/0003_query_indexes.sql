CREATE INDEX IF NOT EXISTS actions_org_status_created ON actions (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS actions_org_actor_created ON actions (organization_id, actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS actions_org_tool_created ON actions (organization_id, tool_id, created_at DESC);
CREATE INDEX IF NOT EXISTS docs_org_status_created ON docs (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS spend_log_org_created ON spend_log (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS budget_reservations_org_status ON budget_reservations (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS integrations_org_provider ON integrations (organization_id, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS sync_jobs_org_status_created ON sync_jobs (organization_id, status, created_at DESC);
