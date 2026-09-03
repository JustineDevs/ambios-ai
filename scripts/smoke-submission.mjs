#!/usr/bin/env node
/**
 * Submission smoke entrypoint. The protocol and browser work is delegated to
 * the real harness; this wrapper only runs mandatory contract gates first so
 * a report cannot be mistaken for deployment evidence when the registry is
 * already drifting.
 */
import { spawnSync } from "node:child_process";

const checks = [
  ["operations", ["operations:check:strict"]],
  ["openapi", ["openapi:check"]],
  ["frontend-source", ["frontend:source-audit"]],
];

for (const [label, args] of checks) {
  const result = spawnSync("pnpm", args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`Submission preflight failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

const result = spawnSync("node", ["--experimental-strip-types", "tests/smoke/run.ts"], {
  stdio: "inherit",
  shell: false,
});
process.exit(result.status ?? 1);
