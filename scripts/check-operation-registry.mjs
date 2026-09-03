#!/usr/bin/env node
/**
 * Canonical operation guard. The endpoint tokens below intentionally belong to
 * this scanner: it is the dedicated exception that detects forbidden literals.
 * The canonical owner is packages/shared/operations.ts; this file never serves
 * or constructs a product request.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const registryFile = join(root, "packages/shared/operations.ts");
const registrySource = readFileSync(registryFile, "utf8");
const ids = new Set(
  [...registrySource.matchAll(/\b(\w+):\s+define(?:Legacy)?Operation\(/g)].map((m) => m[1]),
);
const refs = new Set([...registrySource.matchAll(/operationId: "([^"]+)"/g)].map((m) => m[1]));
const failures = [];

for (const id of ids)
  if (!refs.has(id)) failures.push(`registry entry ${id} has no immutable operationId`);

function filesUnder(dir) {
  if (!statSafe(dir)) return [];
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "dist" ||
      entry.name === ".git"
    )
      continue;
    if (entry.isDirectory()) result.push(...filesUnder(path));
    else if (/\.(ts|tsx|js|jsx|mjs|cjs|json|yaml|yml|md)$/.test(entry.name)) result.push(path);
  }
  return result;
}
function statSafe(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

const args = new Set(process.argv.slice(2));
let files = [
  join(root, "src"),
  join(root, "apps"),
  join(root, "packages"),
  join(root, "webmcp"),
  join(root, "tests"),
  join(root, "scripts"),
].flatMap(filesUnder);
if (args.has("--changed")) {
  try {
    const changed = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMRTUXB", "HEAD"], {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
    files = changed
      .map((file) => join(root, file))
      .filter(
        (file) =>
          statSafe(file) === false && /\.(ts|tsx|js|jsx|mjs|cjs|json|yaml|yml|md)$/.test(file),
      );
  } catch (error) {
    failures.push(`could not determine changed files: ${error.message}`);
  }
}

const allowed = new Set([registryFile, join(root, "scripts/check-operation-registry.mjs")]);
// These files contain non-AmbiOS paths that cannot be represented by the HTTP
// operation registry: provider-relative paths, deployment wildcard syntax,
// third-party OAuth protocol defaults, and user-authored external tool
// templates. They are deliberately isolated here so first-party callers still
// fail closed when they introduce an AmbiOS route literal.
const allowedExternalContracts = new Map([
  [join(root, "src/connector-worker.ts"), "Nango provider-relative API paths"],
  [join(root, "apps/web/next.config.ts"), "Vercel deployment wildcard routing"],
  [
    join(root, "apps/web/src/lib/external/anthropic-mcp/client/auth.ts"),
    "third-party MCP OAuth client",
  ],
  [
    join(root, "apps/web/src/lib/external/anthropic-mcp/shared/auth-utils.ts"),
    "third-party MCP OAuth path comparison",
  ],
  [
    join(root, "apps/web/src/lib/tool-templates/tool-templates.json"),
    "external user-authored tool templates",
  ],
]);

// The generated OpenAPI file is validated separately and intentionally carries
// rendered paths; it is not an application caller.
allowed.add(join(root, "openapi.yaml"));
// Match executable path literals, including template literals, not prose or
// fully-qualified external URLs. Dedicated registry/build fixtures are owned
// by the allowlist above.
// biome-ignore lint/complexity/useRegexLiterals: the scanner pattern is assembled as a string so its quote delimiters remain explicit.
const forbidden = new RegExp(
  "[\\\"'`]\\/(?:api\\/|v1\\/(?:tools|runs|systems|oauth|extract|summarize|internal|schedules|tunnels|tenant-info|logs\\/stream|notify\\/email|hooks)(?:[\\\"'/?`])|mcp[\\\"'/]|authorize[\\\"'/]|token[\\\"'/]|register[\\\"'/])",
);
if (args.has("--strict") || args.has("--changed"))
  for (const file of files) {
    if (allowed.has(file) || allowedExternalContracts.has(file)) continue;
    const source = readFileSync(file, "utf8");
    if (!forbidden.test(source)) continue;
    for (const [lineNumber, line] of source.split("\n").entries()) {
      if (forbidden.test(line))
        failures.push(
          `${relative(root, file)}:${lineNumber + 1} contains a raw endpoint token; use an operation ID`,
        );
    }
  }

const mounted = [];
for (const file of [
  join(root, "src/hono-app.ts"),
  join(root, "src/connector-worker.ts"),
  join(root, "src/mcp-routes.ts"),
]) {
  if (!statSafe(file) && !readable(file)) continue;
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(
    /(?:app\.(?:get|post|put|patch|delete|all)\(operationPath\("([^"]+)"\)|registerOperation\(app, operations\.([A-Za-z0-9_]+),)/g,
  )) {
    const id = match[1] ?? match[2];
    mounted.push({ file: relative(root, file), id });
    if (!ids.has(id)) failures.push(`${relative(root, file)} references unknown operation ${id}`);
  }
}

if (args.has("--registry")) {
  const duplicateRefs = mounted.filter(
    (item, index, list) =>
      list.findIndex((other) => other.file === item.file && other.id === item.id) !== index,
  );
  if (duplicateRefs.length)
    failures.push(
      `operation is mounted more than once by one route owner: ${[...new Set(duplicateRefs.map((item) => `${item.file}:${item.id}`))].join(", ")}`,
    );
}

if (failures.length) {
  console.error(`Operation registry check failed with ${failures.length} violation(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `Operation registry check passed (${ids.size} operations, ${mounted.length} registry-bound mounts).`,
);

function readable(path) {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
}
