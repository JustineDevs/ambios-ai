import { execFileSync } from "node:child_process";

const protectedPaths = [
  ".env",
  ".env.local",
  "apps/web/.env.production",
  ".dev.vars",
  "credentials.json",
  "service-account.json",
  "secrets.json",
  ".npmrc",
  "private.pem",
  "signing.key",
  ".vercel/project.json",
  ".wrangler/state/v3/d1/local.sqlite",
  "tmp/output.log",
  "artifacts/result.json",
];

function isIgnored(path) {
  try {
    execFileSync("git", ["check-ignore", "--no-index", "--quiet", "--", path], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

const missingRules = protectedPaths.filter((path) => !isIgnored(path));
const hiddenExample = isIgnored(".env.example");

if (missingRules.length || hiddenExample) {
  if (missingRules.length) {
    console.error(`Missing protected ignore rules: ${missingRules.join(", ")}`);
  }
  if (hiddenExample) {
    console.error(".env.example must remain trackable as a safe configuration template.");
  }
  process.exit(1);
}

console.log(`Secret-safe Git ignore checks passed for ${protectedPaths.length} protected paths.`);
