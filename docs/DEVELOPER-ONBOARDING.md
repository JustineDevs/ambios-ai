# Developer onboarding

This guide gets a developer from a fresh checkout to a verifiable local runtime.

## 1. Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer
- A shell with `curl`; Chromium is needed for browser verification

Install dependencies:

```sh
pnpm install
```

Copy the example configuration only when needed:

```sh
cp .env.example .env
```

Never commit `.env`, `.env.local`, provider credentials, or generated build output. Local development can use the checked-in Wrangler configuration and local bindings; external OAuth and provider calls require separately configured secrets.

## 2. Start both local runtimes

Terminal 1 — Next.js UI:

```sh
pnpm dev:web
```

Next.js prints the UI URL, normally `http://localhost:3000`.

Terminal 2 — Hono Core Worker:

```sh
pnpm dev:core
```

The Core Worker normally listens on `http://127.0.0.1:8787`; the Next rewrites forward same-origin `/api/*` to it and provider paths to the Connector Worker on `8788`.

Terminal 3 — Hono Connector/Execution Worker:

```sh
pnpm dev:connector
```

Both local Worker commands use the checked-in D1 schema and development-only
`AUTH_DISABLE=true` variables. The bypass is restricted to Wrangler's local
development environment; it is never a preview or production authentication
mode.

Smoke the boundary:

```sh
curl -i http://127.0.0.1:8787/api/health
curl -i http://localhost:3000/api/health
curl -i http://127.0.0.1:8787/api/readiness
```

Expected local outcomes are health `200`, proxied health `200`, and readiness `200` or a truthful `503` when bindings are unavailable.

## 3. Understand the source layout

| Path | Owns |
| --- | --- |
| `apps/web/src/` | Canonical Next.js UI routes, SSR, and browser API client |
| `src/hono-app.ts` | Hono HTTP routes and structured unsupported boundary |
| `src/worker.ts` | Core Worker bindings, HTTPS production policy, and domain APIs |
| `src/connector-worker.ts` | Connector lifecycle, provider actions, webhooks, and queue consumer |

### Worker authentication

The Core and Connector Workers verify bearer sessions with Supabase Auth at
`/auth/v1/user`; an `Authorization` header alone is not an identity. Configure
`SUPABASE_URL` and the server-only `SUPABASE_ANON_KEY` in Wrangler local
secrets/variables. `AUTH_DISABLE=true` is permitted only for non-production
local development and produces the explicit `dev-user` principal. Production
must leave it disabled. Every workspace lookup is scoped through the caller's
membership rather than the first organization in the database.
| `packages/db/` | D1 schema, migrations, and seed tooling |
| `webmcp/register.ts` | Contract registry and tool metadata |
| `apps/web/src/` and `webmcp/register.ts` | Browser WebMCP registration and typed tool contracts |
| `openapi.yaml` | Current Hono API contract, not the historical Next API |
| `tests/` | WebMCP contract and browser verification |

Do not add a second server runtime or silently revive the retired Next application. If a feature needs a backend route, implement it in Hono, add its OpenAPI operation, and add a route-level test before advertising it in the UI.

## 4. Development loop

Use the smallest relevant check first, then the release gate:

```sh
pnpm check-types
pnpm lint
pnpm test
pnpm webmcp:browser-verify
pnpm build
pnpm production:gate
```

`pnpm test` includes WebMCP contract checks. Some Vitest packages currently have no test files and use `--passWithNoTests`; do not interpret that as feature coverage.

Generated artifacts such as `.next`, Wrangler output, coverage, and Turbo caches must be moved out of the repository after verification.

## 5. Working safely

- Treat server-side auth, tenant scope, input validation, and redaction as mandatory; browser schemas are not security controls.
- Keep provider credentials in Nango or runtime secrets. They must never enter React state, URL parameters, logs, or WebMCP output.
- Do not turn a `501`, `503`, or missing binding into a fake success state.
- Preserve the distinction between local proof, deployed proof, authenticated provider proof, and compatible-browser WebMCP proof.
- Read the relevant ADR in `docs/ADR/` before changing lifecycle, provider, deployment, or security behavior.

## 6. Before opening a change

Record:

1. the user-visible behavior,
2. the route and schema changed,
3. the auth/scope and audit behavior,
4. tests and commands run,
5. any remaining external-evidence requirement.

See [CONTRIBUTING.md](../CONTRIBUTING.md), [Architecture](../ARCHITECTURE.md), and [Security](../SECURITY.md).
