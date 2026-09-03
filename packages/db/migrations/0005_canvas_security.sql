CREATE TABLE IF NOT EXISTS canvas_shares (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'private',
  permissions TEXT NOT NULL DEFAULT '{}',
  share_link TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS canvas_shares_org_canvas
  ON canvas_shares (organization_id, canvas_id, created_at DESC);

CREATE TABLE IF NOT EXISTS security_scans (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  project_id TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  severity_counts TEXT NOT NULL DEFAULT '{}',
  result_json TEXT NOT NULL DEFAULT '{}',
  error TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS security_scans_org_provider
  ON security_scans (organization_id, provider, created_at DESC);

CREATE INDEX IF NOT EXISTS security_scans_org_status
  ON security_scans (organization_id, status, created_at DESC);
