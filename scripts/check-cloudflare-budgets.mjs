import { execFileSync } from "node:child_process";

const limitKiB = Number(process.env.CLOUDFLARE_WORKER_GZIP_LIMIT_MIB ?? "3") * 1024;
const configs = ["wrangler.toml", "wrangler.connector.toml"];

for (const config of configs) {
  const output = execFileSync(
    "pnpm",
    ["exec", "wrangler", "deploy", "--config", config, "--dry-run"],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  const match = output.match(/gzip:\s*([\d.]+)\s*KiB/);
  if (!match) throw new Error(`Unable to read Wrangler bundle size for ${config}.`);
  const gzipKiB = Number(match[1]);
  console.log(
    `${gzipKiB <= limitKiB ? "PASS" : "FAIL"} ${config}: ${gzipKiB.toFixed(2)} KiB gzip / ${limitKiB / 1024} MiB limit`,
  );
  if (gzipKiB > limitKiB) process.exitCode = 1;
}
