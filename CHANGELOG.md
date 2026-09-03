# Changelog

Notable repository and product changes are recorded here. Deployment and verification claims are limited to the evidence linked from `webmcp/VERIFICATION.md`.

## Unreleased

- Established `apps/web` as the only frontend and the Vercel deployment as the UI source of truth.
- Separated Cloudflare backend responsibilities into the Hono Core API Worker and Connector/Execution Worker.
- Removed retired duplicate frontend, Pages, and OpenNext paths from the architecture and development workflow.
- Added same-origin Vercel rewrites for `/api/*`, `/mcp`, and `/health`, with backend authorization remaining in Workers.
- Kept provider credentials in Nango and restricted D1 to integration metadata, mappings, verification state, actions, and audit data.
- Preserved server-bound action approvals with exact scope, argument hashes, expiry, single-use state, and final Connector revalidation.
- Added queue idempotency, webhook signature/replay/deduplication controls, and independent provider verification boundaries.
- Added D1 migrations, Core/Connector health and readiness checks, Worker bundle budget checks, WebMCP contracts, and WebMCP eval coverage.
- Verified the current local/deployed route, health, D1, Nango catalog, Worker budget, typecheck, lint, test, and Next production-build paths where documented.

## Evidence boundary

Native authenticated browser WebMCP execution, human OAuth consent, and live provider reads/writes require a compatible HTTPS browser session and real runtime authorization. Configuration alone does not constitute proof; unavailable paths must remain labeled `not configured` or `unverified`.
