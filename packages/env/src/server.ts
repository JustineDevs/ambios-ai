/// <reference types="@cloudflare/workers-types" />
/// <reference path="../env.d.ts" />
// For Cloudflare Workers, env is accessed via cloudflare:workers module.
// The workers-types reference loads the `cloudflare:workers` module declaration
// for every consumer's type-checker (incl. svelte-check, which does not honour
// the env.d.ts path reference the way `tsc -b` does); env.d.ts then augments the
// Cloudflare.Env shape from the Hono Worker bindings.
export { env } from "cloudflare:workers";
