ALTER TABLE webhook_events ADD COLUMN status TEXT NOT NULL DEFAULT 'received';
CREATE INDEX IF NOT EXISTS webhook_status_received ON webhook_events (provider, status, received_at DESC);
