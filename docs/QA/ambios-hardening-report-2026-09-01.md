# Executive production audit

> Architecture update (2026-09-03): the canonical deployment is Next.js on Vercel with Hono Core and Connector/Execution Workers on Cloudflare. References below to the former Pages/OpenNext path are historical findings, not current deployment instructions.

Audit scope: local Next runtime with `AUTH_DISABLE=true`, browser UI, WebMCP discovery/execution, API probes, route inventory, configuration, and existing tests.

Verdict: Not ready.

The credentials are injected into the Node process. The original failures occurred earlier or elsewhere: the local Cloudflare D1 binding had no migrated schema, several UI data clients called absent `/v1/*` routes, and the playground assumed a non-empty external API URL. Those local defects are fixed; deployed binding state and native secure WebMCP execution still require environment-level verification.

# Newly discovered issues

1. Critical (environment verification): before this pass local D1 was empty and `/api/identity` failed with `no such table: memberships`. Local startup now applies the checked-in migrations and the readiness probe is green. The deployed binding still needs verification against the same migration set.

2. High (partially corrected): retired `/v1` tunnel and environment probes were removed from the active Next.js UI. The legacy shared SDK still contains compatibility methods for an older tool/system API and remains unverified against the current Worker route inventory; those capabilities are not claimed as live.

3. High (fixed): `/playground` now handles an intentionally empty local API endpoint without calling `new URL("")`.

4. High (fixed): `/tools` no longer loops through `useToolData`; its loader is stable and the page was rechecked without client errors.

5. High (environment verification): browser-adapter discovery returns 29 tools, including core, vendor, and security tools. Native execution requires a compatible secure WebMCP runtime; the local adapter previously failed argument parsing, so this remains an external compatibility gate rather than a credential fix.

6. High (fixed): the two Wrangler configurations now have explicit ownership: `src/worker.ts` is the Core API producer and `src/connector-worker.ts` is the sole queue consumer/executor. The former OpenNext/custom-worker path is removed from active deployment configuration.

7. Medium (fixed locally): `/api/health` now reports runtime, D1, and KV readiness with 200/503 semantics. Provider OAuth availability remains a separate consent/configuration check.

8. Medium: the detached server became unavailable during long-lived tool sessions in this environment. A `setsid` launch stayed available long enough for browser checks, but the ordinary tool session launcher did not. This is an operator/runtime lifecycle issue, not evidence that credentials are invalid.

9. Low: several UI component files appear unused (`arrow-cursor`, `confirm-button`, `integration-card`, `skeleton`, `status-tooltip`, `user-icon`). `integration-card` contains its own nested card implementation. They should be deleted only after a deliberate dead-code check.

# Fixed in this pass

1. Local dev now applies all checked-in D1 migrations before starting Next.
2. Added `/api/health` readiness reporting for runtime, D1, and KV.
3. `/playground` now handles a local app-owned API without throwing from `new URL("")`.
4. Legacy `/v1` queries are disabled when no explicit external API endpoint is configured.
5. Stabilized `useToolData.loadTool` with `useCallback`, removing the tools-page update loop.
6. WebMCP registration now sends the standards-defined `execute` callback without the non-standard duplicate `handler` field.
7. Removed the server auth helper's implicit insecure localhost backend URL; external proxy authentication now requires an explicit `API_ENDPOINT`.
8. Added a precise pnpm-lock/source keyed GitHub Actions cache for `.next/cache` without caching unbounded generated output.
9. Bounded future local dev processes with `--max-old-space-size=2048`, disabled telemetry, and the lower-pressure Webpack compiler.

# Blocked outside repo

- Supabase OAuth dashboard redirect configuration cannot be verified from this repository.
- Remote Nango provider configuration and live user OAuth consent cannot be proven without executing a real account connection.
- A compatible HTTPS WebMCP browser/runtime is required for production-native execution. Local HTTP browser adapter discovery is not equivalent to production WebMCP execution.
- Cloudflare deployment bindings and the actual deployed migration state require operator/deployment access.

# Duplicates consolidated

None in this audit pass. The main duplication risk is the two Wrangler configurations and the parallel local `/api` versus legacy `/v1` client contracts.

# Logic corrected

The runtime now distinguishes local `/api` behavior from the optional external `/v1` backend. D1 initialization is a local development prerequisite.

# Test coverage added

Existing web tests passed: 12 files and 73 tests. Typecheck and Biome passed. Runtime verification covered migration startup, readiness, workspace creation, identity, playground, tools, and the enumerated route shells. The WebMCP contract verification passed for all 29 registered tools; native `getTools` plus `executeTool` remains adapter/runtime gated.

Cache/resource evidence: the prior generated `.next` directory reached 3.5 GB during the aggressive browser loop. It was moved to `/tmp`; after a single page load the regenerated cache was 155 MB. The current dev process remains healthy at `/api/health`; future launches use the explicit 2 GB Node heap cap and Webpack dev compiler.

# Breaking change review

Local development startup now applies migrations automatically and future launches are resource-bounded. Production and preview behavior is unchanged. Query disabling applies only when `API_ENDPOINT` is empty. CI caches only reusable Next.js cache data, not generated deployment output.

# Remaining risks

- Do not treat a 200 page response as a working page. The route matrix returned 200 shells while client/API failures remained.
- Do not treat presence of secret variable names as proof of valid credentials. D1/KV bindings, migrations, URL contracts, and provider configuration are separate runtime prerequisites.
- The local auth bypass is development-only and must never be enabled in preview or production.

# Final ship verdict

Not ready

The application is not safe for real user onboarding until deployed D1 bindings are verified, the remaining Wrangler ownership is documented or reconciled, and native WebMCP execution passes in a compatible secure runtime.
