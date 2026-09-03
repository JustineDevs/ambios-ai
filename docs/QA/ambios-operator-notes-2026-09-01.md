# AmbiOS operator notes

## Environment

- Development without external authentication: `pnpm web:dev` (the root script sets the development-only bypass explicitly)
- The bypass is valid only when `NODE_ENV=development`.
- Never print `.env` values in logs or diagnostics.
- Provider credentials remain Nango-managed. Do not add Snyk, Socket, GitHub, or OpenAI provider secrets to the browser or replace Nango with direct-token flows.

## Migration and runtime order

1. Select the same D1 database binding used by the active Core and Connector Wrangler configurations.
2. Apply `packages/db/migrations` in order, or apply the checked-in schema through the project migration procedure.
3. Verify `memberships`, `organizations`, `integrations`, `audit_log`, and related tables exist in that binding.
4. Verify KV, R2, and queue bindings in the same deployment configuration.
5. Start the web runtime and probe `/api/identity`, `/api/workspace`, `/api/integrations`, and `/api/nango/connect`.
6. Only then test live Nango OAuth and vendor actions.

## Verification checklist

- [ ] `/api/health` or an equivalent readiness endpoint returns dependency state.
- [ ] No `/v1/*` requests are sent to the local Next origin unless a backend is explicitly configured.
- [ ] `/playground` renders with an empty local endpoint.
- [ ] `/tools` opens without a maximum-update-depth error.
- [ ] Browser discovers all expected WebMCP tools.
- [ ] Compatible secure WebMCP runtime executes a read-only tool and displays the result.
- [ ] Nango connection metadata is persisted without provider credentials.
- [ ] Disconnect/revoke behavior removes the connection metadata and blocks subsequent tool execution.

## Rollback notes

This audit added documentation only. Roll back by removing the two QA markdown files. Do not delete generated `.next`, `.wrangler`, or cache directories recursively as a substitute for rollback.
