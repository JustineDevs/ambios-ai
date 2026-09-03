# AmbiOS AI Architecture

AmbiOS AI is a TypeScript pnpm monorepo with a full Next.js application on Vercel, two Hono Cloudflare Workers, Cloudflare D1/KV/R2/Queues, Nango-managed connectors, and browser-native WebMCP tools.

## Runtime shape

```text
Browser + WebMCP agent
        │ HTTPS
        ▼
Vercel Next.js app (SSR/UI/WebMCP registration)
        │ same-origin rewrites for /api, /mcp, /health
        ├──────────────────────────────┐
        ▼                              ▼
Hono Core Worker                 Hono Connector Worker
API/policy/D1 queries             Nango/provider execution/webhooks/queue
Queue producer                    Queue consumer + verification
```

## Repository layout

| Path | Responsibility |
| --- | --- |
| `apps/web/` | Canonical Next.js application deployed to Vercel |
| `packages/db/` | D1 schema, migrations, seed script, and Drizzle D1 adapter |
| `packages/api/` | Shared tRPC router and API types |
| `packages/infra/` | Wrangler deployment wrapper; no application runtime |
| `webmcp/` | AmbiOS WebMCP registry, documentation, and verification log |
| `tests/` | WebMCP contract verification |
| `src/worker.ts` | Cloudflare Core API Worker entrypoint |
| `src/connector-worker.ts` | Cloudflare Connector/Execution Worker entrypoint and sole queue consumer |
| `wrangler.toml` | Worker, D1, KV, R2, and Queue bindings |
| `docs/ADR/` | Product and architecture decision records |

## Authentication and authorization

Supabase is the authentication authority. The static login surface exposes Google OAuth only. The Hono Worker enforces the authenticated API/WebMCP boundary before accessing D1 records; the browser never receives provider credentials.

## Phase 0 data flow

The current runtime exposes health, readiness, identity, workspace, capability, integration, canvas, approval, and explicit unsupported boundaries through the Core/Connector APIs. Provider writes remain behind the Connector approval and verification path.

1. A signed-in user reads an organization-scoped incident from D1.
2. The server evaluates the instruction with `evaluateGuardrails()`.
3. The human UI requests a five-minute D1 approval token bound to the user, incident, and exact instruction.
4. The hot-fix endpoint consumes that token once, writes the action and documentation proposal in D1, and updates incident state.
5. The activity console and docs pages read the resulting records from D1.

Actions are append-only at the database layer through D1 triggers. API calls fail closed when durable audit or workspace storage is unavailable.

## WebMCP

`webmcp/register.ts` registers twenty-nine authenticated AmbiOS and approved vendor-security tools through `navigator.modelContext` when supported. Tool calls use same-origin HTTPS requests with browser credentials. The API repeats validation and authorization; browser schemas are not trusted as security controls. External provider credentials are Nango-managed and never accepted by the application.

See [WebMCP implementation](./webmcp/AMBIOS.md) and [verification evidence](./webmcp/VERIFICATION.md).

## Integrations and jobs

Nango is accessed through HTTPS REST calls. Only provider and connection metadata are stored in D1; credentials remain in Nango. Signed webhook events require an event ID and connection ID, are deduplicated through `sync_jobs`, and update integration status. Queue jobs are restricted to the supported Phase 0 job types and unknown jobs fail for retry visibility.

## Operation lineage and recovery

Every governed provider call, connector sync, webhook-triggered job, and hot-fix receives one `operation_id`. The ID is accepted only from the bounded `X-Operation-Id` header or generated server-side, then persisted in `operations` and linked from the concrete action/job/scan record. The shared state vocabulary is `submitted`, `queued`, `running`, `awaiting_approval`, `succeeded`, `failed`, `retryable`, `canceled`, and `unknown`.

Asynchronous workers record a lease owner and heartbeat while processing and transition the operation to `retryable` on provider or queue failure. Provider responses are recorded as bounded result JSON only after the server-side authorization path succeeds; a browser-provided operation ID never grants access or approval. Runtime execution is owned by the Connector/Execution Worker in `src/connector-worker.ts`; Core only produces queue jobs.

## Deployment

Vercel serves `apps/web` with the full Next.js runtime. Cloudflare uses `wrangler.toml` for the Core API Worker and `wrangler.connector.toml` for the Connector/Execution Worker. Resource IDs in checked-in Wrangler files are non-secret identifiers; credentials remain environment or Cloudflare secret configuration.


Cloudflare provides TLS termination and edge HTTP-to-HTTPS redirect behavior. WebMCP itself rejects non-HTTPS page origins before issuing API requests.

## Verification

```sh
pnpm check-types
pnpm build
pnpm test
pnpm webmcp:verify
pnpm db:migrate
pnpm db:seed
pnpm dlx wrangler deploy --dry-run --config wrangler.toml
pnpm secrets:scan
```

Real ChatGPT/Chrome WebMCP registration and remote OAuth/deployment checks require an authenticated HTTPS deployment and are tracked separately in `webmcp/VERIFICATION.md`.
