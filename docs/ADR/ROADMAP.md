# AmbiOS AI roadmap

AmbiOS is a WebMCP-native control layer where humans and agents share context, approvals, integrations, and audit history.

## Phase 0 — MVP

- Context-aware incident hot-fix with guardrails, approval, rollback-aware execution, and immutable audit records.
- Google OAuth through Supabase; organization and role boundaries on every API route.
- WebMCP tools under the `ambios.*` namespace.
- Connector proof for Notion through Nango plus Cloudflare and GitHub through server-only HTTPS adapters.
- Connector metadata and sync-job state in D1; provider credentials remain in Nango or Cloudflare secrets.
- Manual sync is queued through Cloudflare Queues and recorded in the activity console.

## Connector ownership

| Provider | AmbiOS adapter | Credential owner | Phase |
| --- | --- | --- | --- |
| Notion | Nango OAuth and webhook | Nango | 0 |
| Cloudflare | Direct HTTPS API adapter | Cloudflare secret bindings | 0 |
| GitHub | Direct HTTPS API adapter | GitHub token secret binding | 0 |
| Vercel, Netlify, Jira, Google, Slack, Linear, Shopify, and others | Nango or direct adapter after validation | Provider or secret store | 1+ |

## Phase 1 — Harden and expand

Add connector health checks, retry dashboards, provider-specific sync mappings, Vercel/Netlify/Jira/Google/Slack connectors, richer policy scopes, and real deployment controllers.

## Phase 2 — Platform expansion

Add capability versioning, workflow automation, e-commerce synchronization, privacy workflows, evidence workspaces, accessibility actions, and reproducible research workflows.

## Product constraint

Every new connector must have a declared ownership model, server-side validation, tenant-scoped metadata, auditable sync jobs, bounded retries, and a documented verification path before it is presented as supported.
