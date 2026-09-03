import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const wrangler = join(root, "node_modules/.bin/wrangler");
execFileSync(wrangler, ["deploy", "--config", "wrangler.toml", "--name", "ambios-ai"], {
  cwd: root,
  stdio: "inherit",
});
