-- Canonical provider connection projection. Secrets remain in the connection service;
-- these columns contain scoped metadata and safe verification evidence only.
ALTER TABLE integrations ADD COLUMN workspace_id TEXT;
ALTER TABLE integrations ADD COLUMN provider_display_name TEXT;
ALTER TABLE integrations ADD COLUMN provider_category TEXT;
ALTER TABLE integrations ADD COLUMN account_reference_safe TEXT;
ALTER TABLE integrations ADD COLUMN connection_health TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE integrations ADD COLUMN capability_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE integrations ADD COLUMN capabilities_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE integrations ADD COLUMN resource_mapping_status TEXT NOT NULL DEFAULT 'not_required';
ALTER TABLE integrations ADD COLUMN mapped_resource_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE integrations ADD COLUMN last_connection_check_at TEXT;
ALTER TABLE integrations ADD COLUMN last_successful_verification_at TEXT;
ALTER TABLE integrations ADD COLUMN next_action TEXT NOT NULL DEFAULT 'Connect to inspect available workspace resources';
ALTER TABLE integrations ADD COLUMN revoked_at TEXT;
ALTER TABLE integrations ADD COLUMN created_by TEXT;
ALTER TABLE integrations ADD COLUMN updated_by TEXT;
ALTER TABLE integrations ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE integrations ADD COLUMN provider_metadata_version TEXT NOT NULL DEFAULT '1';
