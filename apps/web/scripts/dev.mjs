import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), "../../.env") });

const nextCli = resolve(process.cwd(), "node_modules/next/dist/bin/next");
// Use the same incremental compiler family as the production build. Turbopack
// keeps route compilation bounded for this source tree; webpack previously
// expanded the first route compile into a multi-gigabyte process.
const port = process.env.PORT?.trim() || "3000";
const child = spawn(process.execPath, [nextCli, "dev", "--turbopack", "--port", port], {
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
