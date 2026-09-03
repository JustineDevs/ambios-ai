# AmbiOS WebMCP

AmbiOS declares twenty-nine authenticated, same-origin contract tools in `webmcp/register.ts`. The canonical Next.js frontend on Vercel mounts the eighteen read-only browser-safe tools shown by compatible browsers; proposal, approval, sync, and execution-related tools remain in the catalog but are not mounted into the browser surface. Execution is authorized and audited by the Hono Core and Connector Workers. A tool is only described as live after its backend adapter and authenticated evidence exist.

| Tool | Input | Backend | Output |
| --- | --- | --- | --- |
| `ambios.integrations.get_status` | `{}` | `listIntegrations` | `{ ok, data: { integrations } }` |
| `ambios.integrations.sync` | `provider`, optional `connectionId` | `syncIntegrations` | `{ ok, data: { syncJobId, provider, status } }` |
| `ambios.nango.get_status` | `provider` | `getNangoConnect` | `{ ok, data: { status } }` |
| `ambios.nango.create_connect_session` | `provider` from the supported connector catalog, optional `connectionId` | `connectNango` | `{ ok, data: { provider, connectionId, status } }` (the WebMCP response never exposes the browser session token) |
| `ambios.identity.get_current_user` | `{}` | `getIdentity` | `{ ok, data: { user, organization, agent } }` |
| `ambios.list_incidents` | `{}` | `listIncidents` | `{ ok, data: { incidents } }` |
| `ambios.incident.get_incident_context` | `incidentId` | `getIncidentContext` | `{ ok, data: { incident, context } }` |
| `ambios.incident.suggest_hotfixes` | `incidentId` | `suggestHotfixes` | `{ ok, data: { suggestions } }` |
| `ambios.workspace.get_current_context` | `{}` | `getWorkspace` | `{ ok, data: { organization, agent, incidents, actions, docs } }` |
| `ambios.workspace.set_context` | `name` | `setWorkspace` | `{ ok, data: workspace }` |
| `ambios.console.list_agent_actions` | `{}` | `getConsole` | `{ ok, data: { actions } }` |
| `ambios.docs.get_doc` | `docId` | `getDoc` | `{ ok, data: { doc } }` |
| `ambios.docs.propose_doc_update` | `incidentId`, `title`, `body`, `rationale` | `proposeDocUpdate` | `{ ok, data: proposal }` |
| `ambios.backend.get_status` | `{}` | `getCoreBackendStatus` | `{ ok, data: { service, status } }` |
| `ambios.payments.check_budget` | `estimatedCost` | `checkBudget` | `{ ok, data: { available, affordable } }` |
| `ambios.guardrails.evaluate_guardrails` | `instruction`, optional `environment` | `evaluateGuardrails` | `{ ok, data: { allowed, riskScore, requiresApproval } }` |
| `ambios.backend.deploy_service` | `service`, `environment`, `operation`, server-issued `approvalToken` | `deployBackend` | `{ ok, data: { status, provider } }` |
| `ambios.incident.apply_hotfix` | `incidentId`, `instruction`, human approval token | `executeHotfix` | `{ ok, data: { incident, action, doc } }` |

All calls include the authenticated browser session and are rejected unless the page origin is HTTPS. The API repeats authentication, organization membership, Zod validation, guardrail evaluation, and audit persistence on the server.

Read-only tools are registered with `annotations.readOnlyHint: true`. Documentation, incident, and connector responses are registered with `annotations.untrustedContentHint: true` because they can contain user-authored or third-party content. Write tools remain unannotated as read-only and require server-side approval where applicable. The canonical Gate 1 names are retained even where their length exceeds the compact-name recommendation so the HTTP, OpenAPI, and WebMCP contracts stay identical.

## Approval flow

The human hot-fix form requests `requestHotfixApproval` after review. AmbiOS stores a five-minute D1 record bound to the user, incident, and exact instruction. The execution operation consumes that token once; a forged or replayed token returns `APPROVAL_REQUIRED`.

## Verification

Run `pnpm webmcp:verify` for the local contract check. It verifies all twenty-nine declared tool names, object schemas, deferred security entries, and rejection of unapproved execution. Frontend mounting is separately verified by the browser test and is currently limited to the two safe read-only tools. Real agent registration and invocation must still be checked in an HTTPS deployment using a browser with WebMCP enabled; see [VERIFICATION.md](./VERIFICATION.md).

## Troubleshooting

- No tools appear: confirm the browser exposes `navigator.modelContext` and the page is HTTPS.
- Registration count is lower than two in the current frontend: inspect the `errors` returned by `registerWebMcp()` and browser console output. The canonical registry contains twenty-nine contract definitions, but only the two safe read-only tools are currently mounted by the frontend.
- `AUTHENTICATION_REQUIRED`: sign in with Google and keep the authenticated page open.
- `ORGANIZATION_REQUIRED`: provision a D1 membership for the Supabase user.
- `APPROVAL_REQUIRED`: obtain a fresh token through the human approval UI; tokens expire after five minutes and are single-use.
- `AUDIT_PERSISTENCE_UNAVAILABLE`: configure the Cloudflare `DB` binding and apply `packages/db/migrations`.

## HTTPS and IaC

Cloudflare terminates TLS and redirects HTTP at the edge. Vercel serves the Next.js browser application. Root `wrangler.toml` declares the Core Hono Worker and `wrangler.connector.toml` declares the Connector/Execution Worker with DB/KV/R2/Queue bindings. Resource IDs and secrets must be supplied through deployment configuration and are intentionally not committed.
