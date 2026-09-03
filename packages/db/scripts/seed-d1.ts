import { execFileSync } from "node:child_process";

const database = "ambios-core";
const remote = process.env.D1_REMOTE === "1";

const seed = `
INSERT OR IGNORE INTO organizations (id, name) VALUES ('org-demo', 'AmbiOS Demo');
INSERT OR IGNORE INTO memberships (organization_id, user_id, role) VALUES ('org-demo', 'demo-user', 'owner');
INSERT OR IGNORE INTO agents (id, organization_id, name, status) VALUES ('agent-demo', 'org-demo', 'Hot-Fix Agent', 'active');
INSERT OR IGNORE INTO guardrail_policies (id, organization_id, agent_id) VALUES ('guardrail-demo', 'org-demo', 'agent-demo');
INSERT OR IGNORE INTO budgets (id, organization_id, period, limit_amount) VALUES ('budget-demo', 'org-demo', strftime('%Y-%m', 'now'), 100000);
INSERT OR IGNORE INTO incidents (id, organization_id, title, service, severity, context) VALUES ('incident-demo', 'org-demo', 'Checkout latency spike', 'checkout-api', 'high', '{"source":"seed"}');
`;

const args = [
  "--config",
  "../../wrangler.toml",
  "d1",
  "execute",
  database,
  ...(remote ? [] : ["--local"]),
  "--command",
  seed,
];
execFileSync("pnpm", ["--filter", "web", "exec", "wrangler", ...args], { stdio: "inherit" });
