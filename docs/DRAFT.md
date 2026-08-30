---
title: AmbiOS AI – WebMCP Agent-Native Platform
description: AmbiOS is a WebMCP-powered operating layer for the open web where humans and AI agents co-operate on services, incidents, docs, budgets, and integrations.
author: @JustineDevs
website-to: https://ambios-ai.pages.dev
status: Proposed
type: Implementation
category: Platform
created: 2026-08-30
requires tech stack:
  - Cloudflare Workers + Pages
  - Cloudflare D1, KV, R2, Queues
  - Supabase (Auth, Postgres, Realtime, Storage)
  - Nango.dev (unified SaaS integrations)
  - Next.js (App Router), TypeScript, React
  - Tailwind CSS, shadcn/ui (Nova, Lucide, Geist)
  - OpenAI Agents SDK
  - tRPC (API), Drizzle ORM
  - Upstash Rate Limit
  - Sentry (observability)
  - Resend (email)
  - Xendit (payments)
  - Uppy (file upload)
  - evlog (logging)
  - Payload CMS
  - next-intl (i18n)
  - Zustand (state), React Hook Form, Zod (validation)
  - Vitest, Playwright, MSW, Storybook (testing)
  - Framer Motion (animation)
  - Biome, Husky, Knip, Gitleaks, Turborepo (DX)
  - Kong (API gateway)
  - GitHub Actions (CI/CD)
  - SWR, Axios (data fetching)
  - OpenAI Agents SDK, Skills, Ruler (AI tooling)
---

## Abstract

AmbiOS AI is a WebMCP-native platform that exposes structured tools (`ambios.*`) for humans and AI agents to collaboratively operate real systems: services, incidents, documentation, budgets, and external SaaS. The MVP demonstrates safe change management and incident response via a context-aware hot-fix flow under declarative guardrails, with all actions logged in a shared Agent Activity Console. The platform runs on Cloudflare Workers + Pages, Supabase, Nango, and Next.js, and is designed to extend into privacy, evidence work, accessibility, contract negotiation, research, learning, and debugging.

## Specification

### System Overview

AmbiOS consists of:

- **Frontend:** Next.js (App Router) hosted on Cloudflare Pages (`https://ambios-ai.pages.dev`), registering WebMCP tools via `navigator.modelContext`.
- **API:** tRPC-based API routes (self-managed backend) running on Cloudflare Workers or Node, depending on deployment configuration.
- **Data:**
  - **D1:** Core operational data (organizations, agents, tools, actions, incidents, docs, budgets, spend_log, integrations, sync_jobs).
  - **Supabase Postgres:** User/org metadata (optional, can be unified with D1).
- **Storage & Infra:**
  - **KV:** Cache, feature flags, rate limit state, context snapshots.
  - **R2:** Object storage (doc attachments, audit exports, seed datasets).
  - **Queues:** Async jobs (sync processing, incident fan-out, doc proposals, budget aggregation).
- **Auth:** Supabase Auth (Google OAuth 2.0), JWT-based session validation in API.
- **Integrations:** Nango.dev (REST API from Workers) for unified SaaS connectors (Notion, Cloudflare, GitHub, Google, Jira, Shopify, etc.).
- **AI:** OpenAI Agents SDK for agent orchestration; agents call `ambios.*` tools via WebMCP (browser) or API (server).

### WebMCP Tool Surface

The frontend registers tools under the `ambios.*` namespace. MVP tools include:

- `ambios.identity.get_current_user` – Get the current authenticated user.
- `ambios.workspace.get_current_context` – Get the current workspace context (org, service, incident).
- `ambios.workspace.set_context` – Set the current workspace context.
- `ambios.console.list_agent_actions` – List recent agent/human actions with filters.
- `ambios.incident.get_incident_context` – Get context for an incident (service, recent deploys, related incidents).
- `ambios.incident.suggest_hotfixes` – Suggest hot-fixes for an incident (rollback, config toggle, feature flag).
- `ambios.incident.apply_hotfix` – Apply a hot-fix to an incident (with human approval if required).
- `ambios.guardrails.evaluate_guardrails` – Evaluate guardrails for a planned action (risk score, required approvals).
- `ambios.payments.check_budget` – Check budget for an agent and action (estimated cost impact).
- `ambios.backend.deploy_service` – Deploy a service version (mocked or real via Cloudflare/Vercel integration).
- `ambios.docs.get_doc` – Get a service doc by ID.
- `ambios.docs.propose_doc_update` – Propose an update to a doc (agent-driven, human-approved).

Each tool has:
- A human-readable description.
- A JSON Schema `inputSchema`.
- A handler that calls the AmbiOS API (tRPC or REST) with the user's JWT.

### Core Data Model (D1)

Key tables (simplified):

- `organizations` – `id, name, settings_json, created_at`
- `memberships` – `id, org_id, user_id, role, created_at`
- `agents` – `id, org_id, name, metadata_json, enabled, created_at`
- `tools` – `id, org_id, namespace, name, schema_json, created_at`
- `actions` – `id, org_id, actor_type, actor_id, tool_id, input_json, output_json, status, created_at`
- `incidents` – `id, org_id, service_id, severity, status, summary, created_at`
- `docs` – `id, org_id, service_id, title, content, version, created_at`
- `budgets` – `id, org_id, agent_id, project_id, limit_cents, period, currency, created_at`
- `spend_log` – `id, org_id, agent_id, amount_cents, description, created_at`
- `integrations` – `id, org_id, connector_type, nango_connection_id, status, created_at`
- `sync_jobs` – `id, org_id, integration_id, source, target, mapping_json, schedule, last_run_at, status, created_at`

### Key Flows

#### Context-Aware Hot-Fix (MVP Hero Flow)

1. Incident exists for a service (e.g., `api-prod`, high error rate).
2. Human or agent opens incident detail in Workspace or via ChatGPT.
3. Agent calls:
   - `ambios.incident.get_incident_context(incidentId)`
   - `ambios.incident.suggest_hotfixes(incidentId)` → returns candidate hot-fixes (rollback, config toggle).
4. Agent calls:
   - `ambios.guardrails.evaluate_guardrails(agentId, actionSpec)` → risk score, required approvals.
   - `ambios.payments.check_budget(agentId, actionSpec)` → budget impact.
5. Human approves hot-fix in UI (or via chat).
6. Agent calls:
   - `ambios.incident.apply_hotfix(incidentId, hotfixId)` → executes runbook or deploy.
7. System:
   - Updates incident status.
   - Records action in `actions`.
   - Records spend in `spend_log`.
   - Proposes doc update via `ambios.docs.propose_doc_update`.

#### Agent Activity Console

- All actions (human and agent) are logged in `actions`.
- Console page (`/console`) shows:
  - Timeline of actions.
  - Filters by agent, tool, status.
  - Detail view with input/output, errors, related resources.

#### Plugin Configuration & Sync

- Admin connects SaaS via Nango (e.g., Notion, Cloudflare).
- AmbiOS stores `integrations` and `sync_jobs` in D1.
- Sync jobs run via Queues; results update D1 tables (docs, products, etc.).
- UI (`/plugins`) shows connections, sync status, and allows manual trigger.

### Deployment

- **Frontend:** `https://ambios-ai.pages.dev` (Cloudflare Pages).
- **API:** `https://api.ambios-ai.pages.dev/v1` (Cloudflare Workers or Node, depending on config).
- **WebMCP:** Tools registered in the browser; accessible in ChatGPT's in-app browser or Chrome with WebMCP enabled.

## Rationale

AmbiOS is motivated by the need for a standard, agent-native layer on the open web where humans and AI agents can safely co-operate on real systems. Current tools are either:

- Human-only dashboards (no agent integration).
- Ad-hoc bots/scripts with no standard tool surface, audit, or safety.
- Platform-specific agent frameworks that don't interoperate across services.

AmbiOS addresses this by:

- Exposing a unified `ambios.*` tool surface via WebMCP, accessible to any agent in a WebMCP-capable browser.
- Enforcing safety via declarative guardrails, budgets, and audit logs.
- Providing a shared workspace where humans and agents see the same state, actions, and history.
- Integrating with existing SaaS via Nango, rather than reinventing connectors.

Alternate designs considered:

- **tRPC-only API without WebMCP:** Would limit agent access to custom integrations; WebMCP provides a standard, browser-native tool interface.
- **Node-only backend:** Would lose tight integration with Cloudflare primitives (D1, KV, R2, Queues); Workers are preferred for latency and cost.
- **Custom auth instead of Supabase:** Supabase Auth (Google OAuth) is faster to implement and sufficient for MVP.

Security, auditability, and extensibility are core to the design, enabling AmbiOS to evolve from a hackathon MVP into a production platform for human+agent collaboration.

## Security Considerations

- **Authentication:** All API calls require a valid JWT from Supabase Auth. WebMCP tools inherit this via the logged-in session.
- **Authorization:** Policies and guardrails enforce what agents (and humans) can do, per org and role.
- **Audit:** Every action (human or agent) is logged in `actions` with inputs, outputs, and status. Exportable audit reports are planned.
- **Data Protection:** Sensitive data (PII, credentials) is minimized in D1; secrets are managed via environment variables and Cloudflare Secrets.
- **Rate Limiting:** Upstash Rate Limit (or KV-based) prevents abuse of API endpoints.
- **Input Validation:** All tool inputs are validated via Zod schemas before execution.
- **Guardrails:** Risky actions (deploys, hot-fixes, spend) require human approval based on policy.
- **Integration Security:** Nango handles OAuth for SaaS; AmbiOS stores only connection IDs, not credentials.

## Copyright

Copyright and related rights waived via [MIT](../LICENSE.md).
