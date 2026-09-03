# Judge and reviewer onboarding

This guide is for evaluating AmbiOS AI without confusing a polished page shell with a working operational capability.

## Evaluation order

Use [Feature status](./FEATURE-STATUS.md) as the status authority. Score demonstrated behavior and evidence, not intended behavior described in the PRD or pitch.

### 1. Establish the local runtime

```sh
pnpm install
pnpm dev:web
pnpm dev:core
# In a second terminal:
pnpm dev:connector
```

Open `http://localhost:3000`. Check Core at `http://127.0.0.1:8787` and Connector at `http://127.0.0.1:8788`.

### 2. Check the API truth boundary

```sh
curl -i http://127.0.0.1:8787/api/health
curl -i http://127.0.0.1:8787/api/readiness
curl -i http://127.0.0.1:8787/mcp
curl -i http://127.0.0.1:8787/api/incidents
```

Interpretation:

- `/api/health` proves the Worker responds.
- `/api/readiness` proves local binding readiness only.
- `/mcp` proves discovery metadata only.
- `/api/incidents` is a mounted authenticated route. Without a valid session, workspace membership, and the required D1 binding it should fail closed with a structured response; a successful route probe still does not prove seeded incident data or provider execution.

The authoritative probe schemas and mounted route-group inventory are in [openapi.yaml](../openapi.yaml); operation implementations remain owned by `src/hono-app.ts` and must be reviewed together with the contract.

### 3. Inspect the UI state labels

Visit these direct URLs and refresh each one:

`/agent` · `/tools` · `/runs` · `/systems` · `/incidents` · `/plugins` · `/docs` · `/settings`

The UI should identify runtime readiness as verified or unverified and identify connector/data surfaces as unavailable or unverified when their Worker adapters are not mounted. “Page returned 200” is not proof of a working backend feature.

### 4. Verify WebMCP claims

```sh
pnpm webmcp:evals
pnpm webmcp:verify
AMBIOS_TEST_URL=http://localhost:3000 pnpm webmcp:browser-verify
```

Current evidence:

- The root contract registry verifies 29 tool definitions.
- The current browser frontend mounts the safe read-only subset; write-capable contract definitions are intentionally not registered until their execution and verification evidence exists.
- Native production execution still requires a compatible HTTPS WebMCP runtime and authenticated deployment.

### 5. Run release gates

```sh
pnpm production:gate
```

A passing repository gate covers typecheck, tests, lint, build, artifact hygiene, and bundle measurements. It does not prove Supabase OAuth, Nango consent, Cloudflare deployment state, production D1 migrations, or native HTTPS WebMCP execution.

## What counts as strong evidence

| Claim | Minimum credible evidence |
| --- | --- |
| UI works | Direct-load browser check plus API responses and no console errors |
| API works | Route implementation, schema, auth/scope test, and response smoke test |
| Connector works | Real provider configuration, user consent, read-only health test, and persisted mapping |
| Governed action works | Exact-scope approval, single-use/expiry test, denied-write proof, independent verification, and audit record |
| WebMCP works | Compatible HTTPS browser registration and authenticated tool execution |
| Production-ready | Green repository gates plus deployed evidence for each external dependency |

## Suggested scoring rubric

| Area | Full-credit evidence |
| --- | --- |
| Product flow | A complete user goal works from direct load through visible result |
| API truthfulness | Implemented routes have schemas, correct status codes, auth/scope, and tests |
| Governance | Sensitive actions bind approval scope, deny safely, verify independently, and audit |
| WebMCP | Tools are discoverable, mounted, authenticated, and executable in a compatible HTTPS browser |
| Integrations | A real provider connection, capability scope, mapping, and failure path are demonstrated |
| Engineering quality | CI, tests, migration safety, bundle budget, and deployment evidence are reproducible |

Do not award full credit for a static page, a registry entry, a screenshot, or a passing empty test suite by itself.

## Current release limitation

The local repository checks pass, but the project is not evidence-complete for production: provider execution, external authentication consent, and compatible-browser WebMCP execution require external evidence not available from a local checkout. Record those as `not configured`, `unverified`, or `external evidence required`; do not score them as live features without proof.

For architectural context, read [Architecture](../ARCHITECTURE.md), [QA hardening report](./QA/ambios-hardening-report-2026-09-01.md), and [WebMCP documentation](../webmcp/AMBIOS.md).
