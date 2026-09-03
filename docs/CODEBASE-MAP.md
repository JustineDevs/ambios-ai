# AmbiOS codebase map

## Runtime boundary

```text
Browser → apps/web (Next.js :3000 / Vercel)
       → /api proxy
       → src/worker.ts (Core Worker :8787)
       → src/connector-worker.ts (Connector Worker :8788)
       → src/hono-app.ts (HTTP routes)
       → D1 / KV / R2 / Queue / external provider APIs
```

Next.js is the only frontend. Cloudflare Workers are the server authority. A page loading successfully does not prove that its API is implemented.

## Ownership map

| Area | Source of truth | Change with |
| --- | --- | --- |
| UI shell and routes | `apps/web/src/app/` | UI state and browser verification |
| Browser API client | `apps/web/src/lib/` | API contract and error-state tests |
| HTTP routes | `src/hono-app.ts` | OpenAPI, auth/scope, integration tests |
| Worker bindings and domain jobs | `src/worker.ts` | migration, idempotency, queue tests |
| Provider execution and webhooks | `src/connector-worker.ts` | Nango/provider boundary tests |
| Database schema | `packages/db/schema-d1.sql`, `packages/db/migrations/` | forward-only migration and rollback note |
| Shared API/domain code | `packages/api/`, `packages/shared/` | package tests and boundary review |
| WebMCP registry | `webmcp/register.ts` | schema verification and compatible-browser evidence |
| Deployment | `vercel.json`, `wrangler.toml`, `wrangler.connector.toml`, `scripts/` | preflight, dry run, release evidence |
| Contract | `openapi.yaml` | route implementation and response tests |

The legacy `packages/shared/ambios-client.ts` tenant-info methods are retained
only for the unconfigured legacy `/welcome` capture flow. The current Worker
does not mount `/v1/tenant-info`; the canonical authenticated setup flow is
`/api/workspace`. The welcome flow must not be treated as persisted workspace
identity until it is migrated to that operation.

## Current HTTP surface

The Core Worker mounts health/readiness, identity/workspace, canvas, incidents, actions, guardrails, integrations, budget, documentation, security integrations, Nango lifecycle, logs, deployment, and MCP routes in `src/hono-app.ts`. These routes still require their documented bindings and authenticated scope at runtime. Explicitly unsupported paths are listed in `src/unsupported-capabilities.ts`; unknown `/api/*` paths return a structured 404 so route drift cannot be hidden by a catch-all.

## Request change path

1. Identify the owning boundary.
2. Confirm the feature status in [FEATURE-STATUS.md](./FEATURE-STATUS.md).
3. Read the applicable ADR.
4. Change schema, server, client, contract, and evidence together.
5. Run the smallest targeted check, then the release gate.

Do not add a second browser application or put provider credentials in `apps/web`.
