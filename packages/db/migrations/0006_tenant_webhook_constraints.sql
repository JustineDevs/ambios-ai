-- Align legacy databases with schema-d1.sql without rewriting tenant-owned data.
DROP INDEX IF EXISTS integrations_provider_connection;
CREATE UNIQUE INDEX IF NOT EXISTS integrations_org_provider_connection
  ON integrations (organization_id, provider, connection_id)
  WHERE connection_id IS NOT NULL;

ALTER TABLE webhook_events ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE webhook_events ADD COLUMN connection_id TEXT;
DROP INDEX IF EXISTS webhook_provider_event;
CREATE UNIQUE INDEX IF NOT EXISTS webhook_org_event
  ON webhook_events (provider, organization_id, id);
CREATE INDEX IF NOT EXISTS webhook_connection_event
  ON webhook_events (provider, connection_id, received_at DESC);
