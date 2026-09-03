-- Make connector webhook delivery IDs durable and idempotent across retries.
ALTER TABLE webhook_events ADD COLUMN external_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS webhook_external_event
  ON webhook_events (provider, external_id)
  WHERE external_id IS NOT NULL;
