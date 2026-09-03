# Developer onboarding

This guide takes a developer from a clean checkout to a local, inspectable runtime. Local bypasses are for development only; they are never evidence of production authentication, provider access, or WebMCP support.

## Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer
- Chromium for browser checks

```sh
pnpm install
cp .env.example .env
```

Keep `.env`, `.env.local`, `.dev.vars`, credentials, and generated output out of commits. Configure only the variables needed for the local path being tested.

## Start the runtimes

Run each command in its own terminal:

```sh
pnpm dev:web        # Next.js UI on port 3000
pnpm dev:core       # Core Worker on port 8787
pnpm dev:connector  # Connector/Execution Worker on port 8788
```

The UI is the only frontend. Its same-origin rewrites forward API requests to the Core Worker. The Core Worker produces provider jobs; the Connector Worker is the only queue consumer and provider execution boundary.

Local Wrangler configuration may use `AUTH_DISABLE=true` for non-production development. That mode creates an explicit development principal and must never be enabled in preview or production.

## Source ownership

| Path | Responsibility |
| --- | --- |
| `apps/web/` | Next.js routes, UI, middleware, client state, and browser WebMCP registration |
| `src/hono-app.ts` | Core HTTP route registration and domain handlers |
| `src/worker.ts` | Core Worker bindings and request runtime |
| `src/connector-worker.ts` | Provider execution, webhooks, retries, verification, and queue consumption |
| `packages/db/` | D1 schema, migrations, and seed data |
| `packages/api/` and `packages/shared/` | Shared contracts, schemas, and domain utilities |
| `webmcp/` | Tool contracts, evaluation cases, and verification records |
| `tests/` | Contract, integration, security, and browser coverage |

OpenAPI, route ownership, and current evidence are authoritative over older drafts. If a feature needs a backend operation, add the route, schema, authorization, audit behavior, test, and documentation together.

## Development loop

Run the smallest relevant check first, then the release checks:

```sh
pnpm check-types
pnpm lint
pnpm test
pnpm build
pnpm production:gate
```

For a browser-backed change, run `AMBIOS_TEST_URL=http://localhost:3000 pnpm webmcp:browser-verify` after the UI and Workers are running. Clean `.next`, Wrangler output, coverage, traces, and caches after inspection.

## Safety rules

- Enforce identity, organization, workspace, role, capability, and resource scope on the server.
- Validate input and redact/bound output before persistence or WebMCP serialization.
- Keep provider credentials in Nango or runtime secrets; never put them in browser state, URLs, logs, or tool output.
- Treat model output, provider text, webhooks, logs, documents, and uploads as untrusted data.
- Preserve exact approval binding, idempotency, independent verification, and audit lineage for mutations.
- Return truthful `401`, `403`, `501`, and `503` states; do not convert unavailable behavior into mock success.

## Before opening a change

Record the user outcome, owning runtime, affected contract/schema, authorization and audit behavior, tests run, and any evidence that still requires deployment or an external provider. Follow [Contributor onboarding](./CONTRIBUTOR-ONBOARDING.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).
