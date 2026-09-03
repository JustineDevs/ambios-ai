import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const checks = [
  ["operation registry", ["operations:check:strict"]],
  ["OpenAPI registry parity", ["openapi:check"]],
  ["typecheck", ["check-types"]],
  ["tests", ["test"]],
  ["lint", ["lint"]],
  ["WebMCP contract", ["webmcp:verify"]],
  ["production build", ["build"]],
];

for (const [label, args] of checks) {
  console.log(`\n== ${label} ==`);
  execFileSync("pnpm", args, { cwd: root, stdio: "inherit" });
  console.log(`PASS ${label}`);
}

const generated = join(root, "apps/web/.next");
if (existsSync(generated)) {
  const archiveRoot = join("/tmp", `ambios-production-gate-${Date.now()}`);
  mkdirSync(archiveRoot, { recursive: true });
  renameSync(generated, join(archiveRoot, "dist"));
  console.log(`PASS generated-artifact-hygiene (moved to ${archiveRoot})`);
}

execFileSync("git", ["diff", "--check"], { cwd: root, stdio: "inherit" });
console.log("PASS diff-check");
console.log(
  "REVIEW external-evidence: authenticated OAuth/provider calls require a real human session; deployment and anonymous compatible-browser WebMCP evidence are recorded in webmcp/VERIFICATION.md.",
);
console.log(
  "Production gate repository checks passed; provider execution remains unclaimed until an authenticated human workflow is captured.",
);
