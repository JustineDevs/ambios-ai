# ADR-023: UI/UX, Route, and Runtime-State Reconciliation

- **Status:** Accepted for implementation; local verification in progress
- **Date:** 2026-09-03
- **Decision owner:** AmbiOS AI project team
- **Parent strategy:** [ADR-021](./ADR(021)-ambios-canonical-platform-strategy.md)
- **Scope:** all Next.js routes, dashboard shell, setup/readiness, browser WebMCP, same-origin API wiring, internal guidance, and release claims

## Context

The repository contains a large internal prompt archive and a task ADR queue. Several records are
useful design intent but describe older topology, coarse readiness, or incomplete UI behavior. The
live browser observation also showed a misleading “Setup status unavailable” state. The application
must have one route shell, one authentication boundary, one state vocabulary, and one evidence
standard.

## Decision

The first-party Next.js application is the primary user surface. The dashboard shell owns navigation,
identity, workspace context, and responsive layout. The Core Worker owns domain APIs and the Connector
Worker owns Nango/provider operations. Browser requests use same-origin Next.js API routes; the server
proxy resolves the Supabase session and forwards a bearer token to the correct Worker. Client pages do
not rely on cookies being understood by Cloudflare Workers.

The catch-all API proxy routes `/api/nango/*` and `/api/integrations/:provider/*` to the Connector
Worker and all other uncaptured `/api/*` paths to Core. Existing specific Next.js API handlers retain
precedence. The proxy supports GET, POST, PUT, PATCH, and DELETE, strips incoming authorization and
hop-by-hop headers, and returns a structured `AUTH_REQUIRED` response when no valid session exists.

The UI uses the following route ownership:

| Surface | Owner | User promise |
| --- | --- | --- |
| Agent (`/`, `/agent`) | Agent workspace | Explain, prepare, and coordinate work |
| Tools/Runs (`/tools`, `/runs`) | Build and observation | Inspect capabilities and operation history |
| Systems/Setup/Services (`/systems`, `/setup`, `/services`) | Runtime configuration | Show actual readiness and configuration blockers |
| Plugins (`/plugins`) | Connector lifecycle | Connect, sync, and inspect provider state |
| Incidents/Approvals/Console | Governed operations | Context, human decision, execution, recovery |
| Workspace/Settings | Identity and tenant | Manage the authenticated workspace |
| API definitions/Docs | Developer/operator reference | Describe the deployed contract, not aspirations |

Setup is capability-based, not a single “ready” boolean. The UI must distinguish authentication,
workspace, connector, configuration, approval, provider, and system failures. Every failed async
state includes a next action and whether retrying is safe. “Setup status unavailable” is reserved for
an unknown transport/system failure and must not conceal a structured configuration or authorization
blocker.

WebMCP is page-local discovery and invocation. Registration is not authorization or provider proof.
The current registry contract has 29 tools, while the deployed browser verification records 18
read-only tools mounted under the current capability filter. `FEATURE-STATUS.md` and
`webmcp/VERIFICATION.md` must keep those numbers distinct.

## Reconciliation of stale material

- `.internal/*` is working material and follows the authority rules in `.internal/README.md`.
- ADR-021 is the active synthesis for product topology and user interaction.
- ADR-019 remains the security review; its historical body contains older topology wording and must
  not be used as the current deployment map. The correction at its top and ADR-021/ADR-023 are current.
- ADR-020 remains the interaction review and is a decision record, not evidence that all primitives
  are implemented.
- ADR-022 remains the WebMCP release mission and is gated by the security and provider evidence it
  names.
- `FEATURE-STATUS.md` is the claim vocabulary; `webmcp/VERIFICATION.md` is the deployment/browser
  evidence log.
- Screenshots, traces, fixtures, and local registration prove only the behavior they actually observe.

## Acceptance criteria

1. Dashboard pages have one semantic main landmark and mobile navigation exposes expanded state,
   controls, and closes after navigation.
2. Authenticated same-origin page requests reach the correct Worker with the server-derived Supabase
   bearer token; unauthenticated requests receive structured JSON rather than an HTML rewrite error.
3. Setup, connector, operation, and error states identify the next safe user action.
4. Route/API inventories and docs distinguish implemented locally, verified, unverified, unsupported,
   not configured, and roadmap.
5. WebMCP registration, authenticated read-only execution, and provider side effects are reported as
   separate evidence claims.
6. Typecheck, tests, production build, source audit, and the relevant browser/eval checks pass before
   the record moves to `docs/ADR/done/`.

## Evidence captured in this reconciliation

- `pnpm --filter web check-types` — pass
- `pnpm --filter web test` — 9 files, 68 tests — pass
- `pnpm --filter web build` — pass; includes `/api/[...path]`
- `node scripts/audit-frontend-source.mjs` — pass
- `webmcp/VERIFICATION.md` — latest recorded deployed route and browser evidence

Remaining gaps are external or release-gated: deploy the proxy fix to Vercel, rerun authenticated
production route checks, verify real provider credentials, and complete the security blockers listed
in ADR-021/ADR-019.
