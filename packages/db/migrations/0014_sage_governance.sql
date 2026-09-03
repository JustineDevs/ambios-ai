-- Mandatory SAGE verdict ledger. It stores policy evidence only; never secrets.
CREATE TABLE IF NOT EXISTS sage_decisions (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  target TEXT NOT NULL,
  arguments_hash TEXT,
  approval_reference_hash TEXT,
  policy_version TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('ALLOW', 'ASK', 'DENY')),
  reason_code TEXT NOT NULL,
  reason TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX IF NOT EXISTS sage_decisions_org_time ON sage_decisions (organization_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS sage_decisions_operation ON sage_decisions (operation_id, evaluated_at DESC);
