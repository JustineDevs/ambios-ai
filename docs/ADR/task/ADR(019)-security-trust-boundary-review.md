# ADR-019: AmbiOS Security and Trust-Boundary Review

> **Topology correction (2026-09-03).** The current server boundary is Hono Core and Connector/Execution Workers on Cloudflare behind Vercel rewrites. The Next.js API/MCP wording below describes the earlier topology and must not be used as current deployment guidance; ADR-021 and `ARCHITECTURE.md` are authoritative.

- **Status:** BLOCKED — security gate recorded; implementation is not authorized by this lane
- **Date:** 2026-09-01
- **Owners:** AmbiOS platform team
- **Scope:** Browser/WebMCP, ChatGPT/MCP, Supabase identity, Cloudflare D1/KV/Queues/R2, Nango, Render Workflows, vendor security connectors, approvals, audit, and deployment
- **Next allowed trigger:** `$vibe`

## Decision

AmbiOS keeps a server-authoritative, tenant-scoped control plane. Browser WebMCP and ChatGPT/MCP are interaction surfaces only; neither is trusted to assert identity, organization, role, approval, connector ownership, or completion. Every consequential operation must cross an authenticated server boundary, resolve authorization from the authenticated principal, enforce tenant scope in the data query, apply the appropriate approval and idempotency policy, and emit an auditable result.

The security gate remains **BLOCKED** until the release blockers in this record have an owner, implementation, and verification evidence. This ADR does not authorize code changes; it is the vet handoff for the next UI/interaction gate.

## Evidence reviewed

Repository evidence reviewed on 2026-09-01:

- `apps/web/src/lib/ambios/security.ts`
- `apps/web/src/lib/ambios/d1.ts`
- `apps/web/src/lib/mcp/auth.ts`
- `apps/web/src/app/api/mcp/route.ts`
- `apps/web/src/app/api/incidents/hotfix/route.ts`
- `apps/web/src/app/api/incidents/hotfix/approval/route.ts`
- `apps/web/src/app/api/backend/deploy/route.ts`
- `apps/web/src/app/api/nango/webhook/route.ts`
- `src/worker.ts`
- `packages/workflows/src/index.ts`
- `packages/workflows/src/client.ts`
- `webmcp/register.ts`
- `packages/db/schema-d1.sql` and migrations
- Cloudflare and CI configuration, including both root and application Wrangler configurations
- Existing QA and flow artifacts: `docs/QA/ambios-hardening-report-2026-09-01.md`, `docs/QA/ambios-operator-notes-2026-09-01.md`, and `docs/ADR/task/ADR(018)-end-to-end-state-and-failure-contract.md`

External behavior was checked against the official [OpenAI MCP/app guidance](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt), [Chrome WebMCP secure-tools guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools), [Chrome WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals), [Render Workflows documentation](https://render.com/docs/workflows), [Nango frontend and connection guidance](https://nango.dev/docs/reference/frontend/frontend-sdk), and the official GitHub, Snyk, Socket, and Cloudflare documentation recorded in [ADR-017](./ADR(017)-sage-vendor-evidence-register.md).

## Trust-boundary topology

```text
Human / ChatGPT / browser agent
          |
          | WebMCP or remote MCP request; untrusted intent and arguments
          v
Next.js API + MCP adapter
          |
          | Supabase session or verified bearer token
          | schema validation, rate limit, tenant lookup, role/policy check
          v
AmbiOS policy and orchestration layer
          |
          +--> D1: organization-scoped state, approvals, idempotency, audit
          +--> KV/DO: abuse controls and rate-limit state
          +--> Queue: durable work, lease, retry, dead-letter policy
          +--> R2: bounded artifact storage with authorization
          +--> Nango: provider credentials and connector proxy
          +--> Render Workflows: long-running execution via internal auth
          +--> GitHub/Snyk/Socket/Render APIs: vendor-side effects and evidence
```

The browser is an untrusted presentation and invocation layer. WebMCP is useful for discoverability and tool invocation, but its availability does not prove that a tool is authorized or that a result is genuine. Chrome describes WebMCP as experimental and provides DevTools/evals for inspecting schemas, invocations, and selection behavior; AmbiOS must use those as verification aids, not as security controls. [Chrome WebMCP DevTools](https://developer.chrome.com/docs/devtools/application/webmcp)

ChatGPT/MCP is a separate remote-client boundary. OpenAI’s guidance requires a remotely reachable MCP server and makes app/action availability dependent on the client/workspace surface. AmbiOS must therefore expose capability-aware errors and must not assume that a ChatGPT client can see or approve the same action set as the first-party web UI. [OpenAI developer mode and full MCP connectors](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt)

## Authentication and authorization contract

1. **Authentication:** production requests must resolve a real Supabase session or a verified, expiring bearer token. `AUTH_DISABLE=true` is development-only and must be impossible in production configuration and deployment.
2. **MCP authentication:** the resource URL, audience, expiration, active status, and required scope must all be checked. Supabase token verification must not be treated as proof of organization membership or role.
3. **Authorization:** organization membership, role, connector ownership, incident ownership, and resource scope are server-side decisions. Request fields such as `organizationId`, `approved`, `approvalSource`, provider tags, or environment never grant authority.
4. **Approval:** destructive or externally consequential operations require a server-issued, short-lived, single-use approval bound to the exact action and resource. Approval consumption and side-effect completion need a recoverable state machine; consuming the approval alone is not evidence that the effect happened.
5. **Idempotency:** the key is scoped to organization, operation, and request hash. A pending operation must remain distinguishable from an expired/reclaimable operation until reconciliation proves whether the external side effect occurred.
6. **Audit:** accepted, rejected, approval, guardrail, vendor, queue, and recovery events need one correlation/operation ID and must never include raw secrets or unbounded user/vendor payloads.

## Sensitive data paths

### Browser token path

`ConfigProvider` places `ambiosApiKey` in an in-memory `tokenRegistry`, and client hooks use it as a bearer token. It is not persisted by this registry, which is preferable to local storage, but it is still available to JavaScript running in the page and is sent to client-side API calls. The token must be treated as browser-exposed, least-privilege, short-lived or revocable, excluded from logs, and never used as a substitute for the Supabase session on privileged endpoints.

`AuthenticateOAuthComponent` receives OAuth results in client state and sends token-shaped data through tool mutation/resume paths. The OAuth authorization-code exchange and refresh/storage path must be server-owned; access and refresh tokens must not be returned to the model transcript, browser history, tool output, audit JSON, or client analytics.

### Server secrets

Supabase service credentials, Nango secrets, Render API keys, internal workflow tokens, vendor tokens, payment secrets, and webhook secrets belong only in server/runtime secret bindings. They must not be included in WebMCP schemas, MCP output, audit payloads, client configuration, or error messages.

### Untrusted content

Incident details, documentation proposals, GitHub findings, Snyk issues, Socket reports, Render status, Nango metadata, and workflow output are untrusted third-party content. Treat them as data, not instructions. Bound their size, redact credentials, escape them in the UI, and label simulated, submitted, running, succeeded, and failed states separately.

## Abuse cases and failure modes

| Risk | Observed condition | Required control |
|---|---|---|
| Cross-tenant access | Many handlers correctly resolve organization from the authenticated user, but webhook/vendor identity arrives from payload metadata | Bind every vendor connection to a server-created integration record; never trust organization tags alone; test cross-tenant IDs |
| Privilege escalation | Deploy/hotfix routes rely on role checks and approval, but all authorization paths need consistent centralized policy | One policy function per capability, with deny-by-default tests for member, unknown org, wrong incident, wrong connector, and mismatched action |
| Duplicate external side effect | Hotfix approval is consumed before the side effect and idempotency completion; a crash can leave an unknown outcome | Persist an operation record, use provider idempotency where supported, reconcile before retry, and expose `unknown/reconciliation_required` |
| Replay after reclamation | Pending idempotency rows older than ten minutes are deleted | Do not delete pending operations on a timer; expire only with a durable reconciliation state and operator-safe recovery |
| Weak global rate limits | KV read/modify/write is explicitly non-atomic | Use Durable Objects or another atomic limiter for security-sensitive global limits; retain per-user/per-org dimensions |
| Queue double execution | Queue processing accepts `queued`, `processing`, or `failed` without a lease/attempt owner | Add lease token, lease expiry, attempt counter, max attempts, backoff, and dead-letter/operator replay |
| Stuck webhook | Nango events claimed as `processing` have no lease/reclaim protocol | Add claim owner/expiry and safe replay; verify event identity against the known connection |
| False deployment completion | Backend deploy can return `simulated_completed` or `submitted` without a provider-side deployment result | Use explicit `simulation`, `accepted`, `running`, `succeeded`, `failed`, and `unknown` states; never present submission as completion |
| Workflow failure masking | Render workflow code catches errors and returns a result with `status: "failed"` | Throw/reject failed workflow executions after recording structured failure, or define and test the platform’s intended failure semantics |
| Secret leakage | Raw JSON input/output is serialized into audit records; OAuth token-shaped output crosses client tool state | Redact by field/pattern, cap bytes/depth, store references for large payloads, and add secret-fixture tests |
| Tool overexposure | WebMCP registers the whole static tool list instead of filtering by current capability and connection state | Register only safe, available capabilities; describe missing setup as a UI state, not as an executable tool |
| Configuration drift | Root `wrangler.toml` and `apps/web/wrangler.toml` represent competing deployment ownership | Select one canonical deployment path and make CI/preflight reject ambiguous production configuration |
| Deployment denial of service | Current OpenNext output exceeds the documented Cloudflare free-tier budget in QA evidence | Choose a supported deployment architecture/plan and enforce size budgets before release |

## Release blockers

These prevent a production-security claim and a confident public demo:

1. No recoverable exactly-once-or-reconcile contract for hotfix/deploy side effects.
2. Unsafe pending-idempotency reclamation.
3. Non-atomic security rate limiting.
4. Queue and webhook processing without ownership leases and bounded retry/dead-letter behavior.
5. Render workflow failure semantics and internal-token trust boundary not verified end to end.
6. Simulated/submitted backend deployment states can be confused with real provider completion.
7. Competing Cloudflare deployment entrypoints and the documented bundle-size failure.
8. OAuth/token-shaped data path has not been proven server-only and redacted.
9. Static WebMCP registration does not yet provide capability-aware exposure and complete read-only/write annotations.

## Acceptable bounded MVP risks

The following may remain MVP limitations if they are visible in the UI, documented, and monitored:

- WebMCP browser support is experimental and browser/client dependent; the first-party AmbiOS UI remains the fallback.
- A connector may be metadata-only or status-only until its official vendor SDK/API adapter is implemented; it must not be presented as executable deployment or remediation.
- A Render workflow may be asynchronous; AmbiOS may show `submitted`/`running` while polling the authoritative status, but must not claim success early.
- Single-organization membership can remain an explicit MVP product constraint, but it must be enforced and communicated rather than inferred from ambiguous queries.
- Vendor API outages and rate limits can produce `retryable` or `unknown`; the user-facing state must preserve that distinction and provide a safe retry/reconcile path.

## Required verification before unblocking

- Production-config test proving development auth bypass is unavailable.
- Authorization matrix covering every WebMCP/MCP write tool and every connector capability.
- Cross-tenant and wrong-resource negative tests for incidents, integrations, artifacts, workspace, and vendor callbacks.
- Crash/retry tests for approval consumption, idempotency, hotfix/deploy, queue jobs, Nango webhooks, and Render workflow tasks.
- Secret-redaction tests covering headers, OAuth tokens, API keys, cookies, vendor payloads, model transcripts, logs, and audit rows.
- WebMCP deterministic evals for schema rejection, read/write annotations, unavailable capabilities, approval UX, and failure-state rendering. Chrome recommends deterministic tool tests plus a separate tool-selection evaluation set. [Chrome WebMCP evals](https://developer.chrome.com/docs/ai/webmcp/evals)
- One deployment command, one canonical Wrangler owner, a passing bundle-size preflight, and a real staging smoke test.
- Evidence that Nango owns credential lifecycle and that Render’s official SDK/API integration reports authoritative task state. [Nango connection lifecycle](https://nango.dev/docs/reference/frontend/frontend-sdk), [Render TypeScript SDK](https://render.com/docs/workflows-sdk-typescript)

## Consequences

This decision keeps AmbiOS positioned as a governed operations copilot rather than an autonomous credential holder. It makes the first-party UI, WebMCP, and ChatGPT/MCP different clients of one policy-controlled backend. It also means “demo mode” must be explicit and truthful: simulated or fixture output can demonstrate orchestration and guardrails, while real credentials and staging provider calls are required to prove real vendor execution.

The next lane is `$vibe`, focused on user-visible interaction states, capability discoverability, approval language, and making every blocked, simulated, submitted, running, retryable, succeeded, failed, and unknown state unambiguous. `$build` must not begin until the security blockers are either fixed and verified or explicitly accepted by the project owner with a documented scope reduction.
