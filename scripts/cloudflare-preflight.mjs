import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const required = [
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "AMBIOS_D1_DATABASE_ID",
  "AMBIOS_KV_NAMESPACE_ID",
  "AMBIOS_R2_BUCKET_NAME",
  "AMBIOS_QUEUE_NAME",
];
const missing = required.filter((name) => !process.env[name]?.trim());
const configPaths = [
  path.resolve(process.cwd(), "wrangler.toml"),
  path.resolve(process.cwd(), "wrangler.connector.toml"),
];
const configs = configPaths.map((configPath) => {
  if (!fs.existsSync(configPath)) {
    console.error(`Missing Wrangler config: ${path.relative(process.cwd(), configPath)}`);
    process.exit(1);
  }
  return { file: configPath, text: fs.readFileSync(configPath, "utf8") };
});
const placeholders = [
  "00000000-0000-0000-0000-000000000000",
  "00000000000000000000000000000000",
].filter((value) => configs.some(({ text }) => text.includes(value)));

const honoConfig = configs.find(({ file }) => file.endsWith("wrangler.toml"))?.text ?? "";
const splitConfigErrors = [
  [honoConfig, "ambios-ai", "Hono worker name"],
  [honoConfig, 'main = "src/worker.ts"', "Hono worker entrypoint"],
  [
    configs.find(({ file }) => file.endsWith("wrangler.connector.toml"))?.text ?? "",
    "ambios-ai-connector",
    "Connector worker name",
  ],
  [
    configs.find(({ file }) => file.endsWith("wrangler.connector.toml"))?.text ?? "",
    'main = "src/connector-worker.ts"',
    "Connector worker entrypoint",
  ],
].filter(([text, value]) => !String(text).includes(String(value)));

if (missing.length || placeholders.length || splitConfigErrors.length) {
  if (missing.length) console.error(`Missing Cloudflare variables: ${missing.join(", ")}`);
  if (placeholders.length) console.error("wrangler.toml still contains placeholder resource IDs.");
  for (const [, , label] of splitConfigErrors)
    console.error(`Split Wrangler config missing ${label}.`);
  process.exit(1);
}

console.log("AmbiOS Cloudflare preflight passed.");
