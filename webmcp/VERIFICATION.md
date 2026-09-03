# AmbiOS WebMCP verification log

Last verified: 2026-09-03, canonical MCP resource routing and OAuth discovery deployed during the submission window.

## Deployed topology

| Surface | URL | Evidence |
| --- | --- | --- |
| Vercel Next.js frontend | canonical Vercel origin | Production deployment is `READY`; the build emitted the full route manifest and middleware. |
| Public MCP resource | canonical Vercel origin plus the MCP resource path | Vercel rewrite reaches the Core MCP handler; anonymous requests return structured HTTP 401 and advertise the protected-resource metadata location. |
| Hono Core API Worker | canonical Core API origin | Fresh deployment version `743fb2ec-b43b-4325-87d6-771a9de1d2e1`; the `getHealth` operation returns HTTP 200 JSON with `runtime: hono`. |
| Hono Connector/Execution Worker | canonical Connector API origin | Fresh deployment version `a70263dd-1aa5-40e8-922c-9a27f00de9dc`; the connector health operation returns HTTP 200 JSON with `runtime: hono`. |

## Fresh verification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Vercel UI routes | PASS | The latest production build emitted every listed route. Public routes return HTTP 200; protected dashboard routes return the expected HTTP 307 login redirect without a session and are not 500s. |
| Vercel API proxy | PASS | The canonical `getHealth` operation returned Hono JSON and Cloudflare headers; it did not return an HTML app shell. |
| Readiness contract | PASS | The canonical `getReadiness` operation returned HTTP 200 with truthful `ready:false` blockers `workspace` and `required_connectors` when no workspace/connectors are selected. |
| Auth boundary | PASS | The canonical `mcp` and `connectNango` operations return structured HTTP 401 responses without a bearer token/session. |
| Public MCP OAuth metadata | PASS | Fresh HTTPS probes returned HTTP 200 JSON for the authorization-server and protected-resource metadata operations; the MCP resource itself returned structured HTTP 401 without an MCP bearer token. |
| Worker bundle budgets | PASS | Core `154.90 KiB` gzip upload and Connector `27.50 KiB` gzip upload, both below the 3 MiB hard gate and 2.5 MiB target. |
| Mandatory SAGE gate | PASS | SAGE policy `ambios-sage-1` is persisted by D1 migration `0014_sage_governance.sql` and enforced before direct provider calls and Connector queue execution. Missing exact approval or destructive payloads are blocked fail-closed; five regression tests pass. |
| Nango feature catalog | PASS | The documented `scripts/config?provider_config_key=...&format=nango` endpoint returned HTTP 200 for the configured Snyk and Socket integrations; the Connector now uses this endpoint for live action/sync discovery. |
| Remote D1 migrations | PASS | `wrangler d1 migrations list ambios-core --remote` reports `No migrations to apply`. |
| Queue ownership | PASS | Core declares only the producer; Connector declares the sole `ambios-jobs` consumer. |
| Typecheck/lint/tests | PASS | `pnpm check-types`, `pnpm lint`, and `pnpm test` pass; WebMCP evals cover 7 cases/9 tools and contract verification covers 29 tools. |
| Production build | PASS | `pnpm production:gate` reports PASS for typecheck, tests, lint, WebMCP contract, production build, generated-artifact hygiene, and diff check. |
| Fresh Cloudflare deployment | PASS | Core deployed as version `743fb2ec-b43b-4325-87d6-771a9de1d2e1`; Connector deployed as version `a70263dd-1aa5-40e8-922c-9a27f00de9dc`; public health probes return HTTP 200 JSON. |
| Canonical ChatGPT submission resource | PASS | The submission resource is the Vercel MCP path; Vercel returns the protected 401 and the protected-resource metadata identifies that same resource. The Core Worker remains the OAuth issuer. |
| Fresh Vercel deployment | PASS | Deployment `dpl_HxBDMDdVSMc9RBTTBqn2cDAsi8HD` reached `READY` and is aliased to `https://ambios-ai.vercel.app`; `/plugins` returned HTTP 200 and the removed Plugins cards/copy were absent from the rendered response. ChatGPT MCP state is represented by the OpenAI provider record in Plugins; the former duplicate settings route is intentionally removed. |
| WebMCP catalog versus browser mount | PASS | The contract catalog contains 29 tools. The compatible browser correctly exposes 18 read-only tools; 11 proposal, approval, sync, or execution tools remain catalogued but are intentionally not browser-mounted. |
| Native HTTPS browser discovery | PASS | A real HTTPS browser session exposed `document.modelContext`, registered 18 tools exactly once, and returned the expected `AUTH_REQUIRED` response when an anonymous read-only tool was invoked. |

## Evidence boundary

The following are intentionally not claimed as complete without a real human session: Supabase OAuth consent/callback, Nango provider consent and safe read verification, and authenticated WebMCP execution in a compatible HTTPS browser. Anonymous browser registration and the server-side authentication boundary are verified; provider success is not fabricated from configuration alone. The production readiness response currently truthfully reports `workspace` and `required_connectors` blockers.
