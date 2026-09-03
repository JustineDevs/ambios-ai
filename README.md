<div align="center">
  <img src="./public/assets/banner.png" alt="AmbiOS AI" width="800" />
  <h1>AmbiOS AI</h1>
  <p><strong>Human judgment and agent action, in one operational workspace.</strong></p>
  <p>Structured context, guardrails, approvals, and reviewable actions for safer AI-assisted operations.</p>
  <p><a href="#quick-start">Quick Start</a> · <a href="#mvp-workflow">MVP Workflow</a> · <a href="./CONTRIBUTING.md">Contributing</a> · <a href="./LICENSE">License</a></p>
</div>

## What is AmbiOS AI?

AmbiOS is a WebMCP-native collaboration platform for humans and software agents. It combines operational context, incident response, agent activity, guardrails, documentation proposals, budgets, and integrations behind shared API logic.

| Capability | Purpose | Status |
| --- | --- | --- |
| Workspace Canvas | Organization, agent, incidents, actions, and docs | Local shell only; backend surfaces unverified |
| Agent Activity Console | Review auditable agent and human actions | Local shell only; operational API unsupported |
| Context-aware hot-fix | Execute a guarded, human-approved action | Phase 0 |
| Documentation proposals | Capture runbook changes for review | Phase 0 |
| WebMCP | Expose `ambios.*` tools to compatible browsers | Phase 0 |
| Nango, Xendit, Resend | Integration and service scaffolding | Phase 0 integration surface |
| Cloudflare D1, KV, R2, Queues | Durable edge runtime foundations | Configured; deployment bindings require verification |

## Quick Start

### Requirements

- Node.js 20+
- pnpm 9+
- Supabase project with Google OAuth configured for authenticated mode

```sh
pnpm install
cp .env.example .env
pnpm dev:web
```

In a second terminal, start the local API Worker:

```sh
pnpm exec wrangler dev --local --ip 127.0.0.1
```

Open [http://localhost:3000](http://localhost:3000). The Next.js frontend proxies same-origin `/api/*` to the Core Worker at `http://127.0.0.1:8787`; provider execution paths are proxied to the Connector Worker at `http://127.0.0.1:8788`.

### Commands

| Command | Description |
| --- | --- |
| `pnpm dev:web` | Start the canonical Next.js application |
| `pnpm preview:web` | Start the Next.js production server |
| `pnpm deploy:core` | Deploy the Hono Core API Worker |
| `pnpm deploy:connector` | Deploy the Hono Connector/Execution Worker |
| `pnpm build` | Build all workspaces |
| `pnpm check-types` | Typecheck all workspaces |
| `pnpm test` | Run application tests |
| `pnpm webmcp:verify` | Verify WebMCP tool contracts |
| `pnpm db:migrate` | Apply local D1 migrations |
| `pnpm db:seed` | Seed the local D1 MVP fixture |
| `pnpm production:gate` | Run repository production gates and preserve external evidence as `BLOCKED` until verified |
| `pnpm cloudflare:preflight` | Fail loudly if production Cloudflare IDs or credentials are missing |
| `pnpm secrets:scan` | Scan repository history for secrets |

## MVP Workflow

The following is the target workflow documented by the product requirements. The current local Hono runtime mounts the operational route families, with authenticated D1-backed reads and record-only action paths where provider execution is not configured. Provider execution, independent provider verification, and deployed authenticated evidence remain explicitly unverified until their external dependencies are available.

1. Configure authentication and establish a workspace session.
2. Open `/agent` and inspect workspace readiness.
3. Review incidents, proposed actions, and required approvals.
4. Execute only an exact-scope, one-time approved action.
5. Confirm independent verification and the audit record in Runs, Console, and Canvas.

## WebMCP

The repository contains twenty-nine `ambios.*` WebMCP contract definitions. The current frontend mounts the safe read-only subset when the browser exposes `navigator.modelContext`; write-capable tools remain excluded until their backend adapters and authenticated browser evidence exist. See [WebMCP documentation](./webmcp/AMBIOS.md), the [verification log](./webmcp/VERIFICATION.md), and the [judge onboarding guide](./docs/JUDGE-ONBOARDING.md).

Nango remains an external connector dependency for provider-backed features; local development does not require a provider connection for the health/readiness path. Provider-backed flows stay unavailable until Nango credentials, provider configuration, capability scope, and resource mappings are verified.

## Project Structure

```text
ambios-ai/
├── apps/web/              # Canonical Next.js frontend (Vercel)
├── packages/db/           # D1 schema, migrations, and seed scripts
├── packages/api/          # Shared API and tRPC layer
├── packages/infra/        # Cloudflare deployment configuration
├── webmcp/                # AmbiOS WebMCP tools and documentation
├── tests/                 # WebMCP contract verification
└── wrangler.toml          # Worker, D1, KV, R2, and Queue bindings
```

## Configuration

Copy `.env.example` to `.env`. Supabase is the authentication authority. Nango manages external provider connections; Cloudflare, payment, and email secrets are server/runtime configuration only. Never commit `.env` or provider credentials.

Before deployment, populate `AMBIOS_D1_DATABASE_ID` and `AMBIOS_KV_NAMESPACE_ID` with resources from the target Cloudflare account, enable R2, and run `pnpm cloudflare:preflight`. The Cloudflare deployment token needs only the Worker, D1, KV, R2, and Queues permissions required by the two Hono deployments; the Vercel deployment uses its separate Vercel token, organization ID, and project ID.

The production deployment is intentionally split: the full Next.js application is published to Vercel, while the Hono Core and Connector/Execution Workers own API, WebMCP gateway, D1/KV/R2, queues, Nango, and provider execution. Vercel rewrites same-origin `/api/*`, `/mcp`, and `/health` to the Workers. No Next.js runtime is deployed to Cloudflare.

## Documentation

- [Onboarding hub](./docs/ONBOARDING.md) · [Developer](./docs/DEVELOPER-ONBOARDING.md) · [Contributor](./docs/CONTRIBUTOR-ONBOARDING.md) · [Judge](./docs/JUDGE-ONBOARDING.md)
- [Codebase map](./docs/CODEBASE-MAP.md) · [Feature status](./docs/FEATURE-STATUS.md) · [Engineering standards](./docs/ENGINEERING-STANDARDS.md) · [Governance](./docs/GOVERNANCE.md) · [Development process](./docs/DEVELOPMENT-PROCESS.md) · [CI/CD](./docs/CI-CD.md) · [Release evidence](./docs/RELEASE-EVIDENCE.md)
- [Architecture](./ARCHITECTURE.md)
- [Roadmap](./docs/ADR/ROADMAP.md)
- [Draft](./docs/DRAFT.md)
- [PRD](./docs/PRD.md)
- [Customer](./docs/CUSTOMER.md)
- [Pitch](./docs/PITCH.md)
- [Security policy](./SECURITY.md)
- [Contribution guide](./CONTRIBUTING.md)
- [Change history](./CHANGELOG.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

AmbiOS AI is released under the [MIT License](./LICENSE). Community behavior is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).

<div align="center"><sub>Built for safer human-and-agent collaboration by <a href="https://github.com/JustineDevs">@Justinedevs</a>.</sub></div>
