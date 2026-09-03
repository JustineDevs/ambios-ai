import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url);
const env = {
  ...process.env,
  NODE_ENV: "development",
};

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code ?? signal}`));
    });
  });
}

await run("pnpm", [
  "exec",
  "wrangler",
  "d1",
  "migrations",
  "apply",
  "ambios-core",
  "--local",
  "--config",
  "wrangler.toml",
]);

const port = process.env.CORE_PORT ?? "8787";
const inspectorPort = process.env.CORE_INSPECTOR_PORT ?? "9229";
const worker = spawn(
  "pnpm",
  [
    "exec",
    "wrangler",
    "dev",
    "--config",
    "wrangler.toml",
    "--local",
    "--ip",
    "127.0.0.1",
    "--port",
    port,
    "--inspector-port",
    inspectorPort,
    "--var",
    "ENVIRONMENT:development",
    "--var",
    "AUTH_DISABLE:true",
  ],
  { cwd: root, env, stdio: "inherit" },
);

const shutdown = (signal) => {
  worker.kill(signal);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
worker.once("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
