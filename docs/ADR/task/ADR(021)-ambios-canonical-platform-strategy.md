# ADR-021: AmbiOS Canonical Platform, Interaction, and Delivery Strategy

- **Status:** Canonical strategy; implementation gated by security blockers
- **Date:** 2026-09-01
- **Deciders:** AmbiOS AI project team
- **Owner:** AmbiOS AI project team
- **Scope:** Product positioning, user entry points, WebMCP, ChatGPT/MCP, OpenAI Sites, Chrome, Cloudflare, Render, connectors, model selection, security, UX, operations, deployment, and hackathon delivery
- **Supersedes as the active synthesis:** ADR-015, ADR-016, ADR-017, ADR-018, ADR-019, and ADR-020 remain supporting decision records and evidence history
- **Next allowed trigger:** `$build` after the security blockers in this record are fixed or explicitly accepted with a documented scope reduction

## Decision summary

AmbiOS is a governed operations copilot and action layer for AI-powered work. It is not another general-purpose chatbot, browser extension, or autonomous deployment bot.

AmbiOS owns the policy plane: identity, workspace and tenant scope, authorization, guardrails, budgets, approvals, operation state, audit history, and user experience. External vendors own their authoritative systems and credentials. AI clients provide intent and reasoning, but never authority.

There are three supported user interaction surfaces:

1. **AmbiOS web app — primary control surface.** Users sign in, create or choose a workspace, connect providers, inspect evidence, review proposals, approve consequential actions, and recover operations.
2. **Browser WebMCP — page-local agent surface.** A compatible browser or browser agent discovers and invokes capabilities exposed by the authenticated AmbiOS page. It mirrors the web app and cannot bypass server policy.
3. **ChatGPT/MCP — remote assistant surface.** ChatGPT can ask questions, inspect eligible data, and initiate eligible work through the remote AmbiOS MCP server. Authentication, missing setup, approval, and reconciliation return the user to AmbiOS.

The primary WebMCP Challenge demonstration is the deployed HTTPS AmbiOS application opened in ChatGPT Desktop’s in-app browser. Chrome with WebMCP enabled is the independent verification path. The direct AmbiOS UI remains the reliable fallback and the authoritative place for human decisions.

## Product positioning and proof standard

AmbiOS demonstrates real capability through a governed path:

```text
User intent
  -> authenticated workspace context
  -> connector-backed evidence
  -> guardrail and policy decision
  -> proposal or approval request
  -> human approval for consequential action
  -> durable execution
  -> authoritative verification
  -> audit and documentation proposal
```

Demo fixtures are allowed only when they are explicitly labeled `Simulation` or `Fixture`. They prove orchestration, policy, UI, WebMCP discovery, and failure handling; they do not prove vendor execution. Real capability is proven with least-privilege staging credentials and an observable provider-side result. A simulated result must never be displayed as a completed production deployment or real hotfix.

## Canonical topology

```text
Human
  |  AmbiOS UI / ChatGPT / browser agent
  v
Web application and WebMCP adapter
  |  same-origin session or remote MCP bearer token
  v
AmbiOS policy and orchestration plane
  |-- Supabase: identity/session authentication
  |-- D1: organizations, incidents, integrations, approvals, idempotency, actions
  |-- KV or Durable Objects: abuse controls and rate limits
  |-- Queue: durable asynchronous jobs with lease/retry/dead-letter policy
  |-- R2: authorized artifact storage
  |-- Nango: hosted connector authorization and credential lifecycle
  |-- Render Workflows: long-running task execution
  |-- Vendor APIs: GitHub, Snyk, Socket, and Render evidence/effects
```

The browser, ChatGPT, WebMCP registration, MCP client, model, vendor payload, webhook payload, and queue message are untrusted inputs. Server-side authentication, authorization, schema validation, tenant scope, approval, idempotency, budget, and audit are mandatory at the policy boundary.

## Entry strategy by client

### AmbiOS web app

The web app is the source of truth for:

- Sign-in and workspace selection
- Connector setup and readiness
- Model selection and chat
- Evidence and incident context
- Human approval
- Run status and recovery
- Audit, documentation, and operator console

The app must retain full usability without WebMCP or ChatGPT. The current default model is **GPT-5.6 Luna with medium reasoning**. Model selection changes the reasoning engine only; it does not grant connector access, organization scope, approval, or deployment authority.

### Browser WebMCP

WebMCP is a capability bridge, not a second backend. Tools use the `ambios.*` namespace and call same-origin authenticated APIs. Registration must require a secure origin and gracefully report unsupported browsers. Tools are exposed according to current server-derived capability state, not merely because they exist in a static client list.

Tools are grouped by intent:

- `Inspect`: identity, workspace, incident, documentation, connector status, security findings, and action history
- `Prepare`: scans, proposals, guardrail evaluation, and dry-run plans
- `Approve`: human-only UI flow; no agent may self-approve
- `Execute`: approved hotfix, deployment, rollback, or sync actions
- `Observe`: operation status, provider status, audit, and reconciliation

The WebMCP DevTools panel and Chrome evals are validation aids. A visible tool in DevTools proves registration/schema visibility in that browser session, not authenticated provider execution. The supplied screenshot demonstrates an available-tool list but also shows that the local page is blocked by missing Cloudflare D1 configuration; it is not production proof.

### ChatGPT/MCP and OpenAI Sites

The MCP server must be remotely reachable over HTTPS and authenticate each request. ChatGPT is treated as a remote client with its own app/workspace availability rules. The user connects the deployed AmbiOS MCP URL through the supported ChatGPT Apps/MCP surface; they do not paste an AmbiOS API key into ChatGPT.

OpenAI Sites/Apps guidance is used for the ChatGPT-facing integration surface. It does not replace AmbiOS authentication, tenant authorization, approvals, or audit. If a client cannot complete an action, the response must provide a safe next step such as “Open AmbiOS to connect GitHub,” “Review approval,” or “Reconcile operation,” rather than claiming failure or success without evidence.

## Connector ownership and vendor topology

| Product | AmbiOS catalog role | User connects account? | Authority and boundary |
|---|---|---:|---|
| GitHub | User-owned connector | Yes | Repository context, pull requests, checks, Dependabot, code scanning, and secret scanning APIs |
| Dependabot | GitHub capability family | No separate account | Findings are accessed through the authorized GitHub connection; secret values are never returned |
| GitHub code scanning | GitHub capability family | No separate account | Findings and alert status are authoritative in GitHub |
| GitHub secret scanning | GitHub capability family | No separate account | Alert metadata only; secret material is never exposed |
| Snyk | User-owned security connector | Yes | Organization/project findings, scans, and reviewable remediation proposals through the official API |
| Socket.dev | User-owned security connector | Yes | Package supply-chain, malware, and dependency analysis through the official API |
| Render | Deployment-owned runtime | No | Service/workflow execution and status through deployment-managed credentials and official Workflows SDK/API |
| Nango | Connector control plane | Indirectly | Hosted OAuth/connect UI, credential storage, refresh, proxy, and connection lifecycle |
| Cloudflare | Edge/deployment platform | No | HTTPS edge, Pages/Workers runtime, D1/KV/Queues/R2, and optional Browser Run validation |

The connector catalog must distinguish `Connected`, `Available to connect`, `Deployment-managed`, and `Roadmap`. Only the first two have user connection actions. Metadata-only functionality must not appear executable.

Official vendor SDKs/APIs are preferred over reimplemented credential or workflow systems: Nango for connector lifecycle, Render’s official Workflows SDK/API for long-running execution, GitHub’s official REST APIs for GitHub capabilities, Snyk’s versioned REST API, Socket’s official API, and Cloudflare bindings/runtime primitives.

## Canonical operation and failure contract

Every agent-requested operation is one durable, tenant-scoped operation projected into the UI, WebMCP response, MCP response, API result, queue job, vendor task, and audit record.

```text
received
  -> rejected
  -> awaiting_approval
  -> queued
  -> running
  -> retryable
  -> succeeded
  -> failed
  -> unknown / reconciliation_required
```

The user-visible vocabulary is shared everywhere. `submitted`, `simulated`, and provider-specific statuses are secondary details, never substitutes for the canonical outcome. A submitted Render task is not a successful deployment. An approval is not proof that an effect completed. A model response is not provider evidence.

Every operation carries:

- `operation_id` across request, audit, queue, workflow, vendor call, and UI
- authenticated `user_id` and server-resolved `organization_id`
- capability and resource identity
- approval and guardrail decision
- idempotency key and request hash
- budget reservation/settlement
- provider task/event identifiers
- timestamps, attempt number, and current lease/recovery state

## Security contract and release blockers

Production must not proceed until these are fixed and verified:

1. Hotfix/deploy side effects need a crash-safe exactly-once-or-reconcile contract. Approval consumption before an unknown external side effect is insufficient.
2. Pending idempotency records must not be deleted on a timer without reconciliation.
3. Security-sensitive rate limits must use an atomic limiter such as Durable Objects rather than KV read/modify/write.
4. Queue and Nango webhook processing need ownership leases, bounded attempts, backoff, dead-letter handling, and safe replay.
5. Render workflow failure semantics and the internal workflow-token boundary need an end-to-end staging proof.
6. Simulated, submitted, running, succeeded, failed, and unknown deployment states must be unambiguous.
7. Root and application Wrangler configurations must resolve to one canonical deployment command, and the Cloudflare bundle-size failure must be resolved.
8. OAuth and token-shaped data must be proven server-owned, excluded from model transcripts/audit/logs, and redacted in errors.
9. WebMCP tool exposure and read/write annotations must be capability-aware and complete.

Required evidence includes cross-tenant negative tests, wrong-role tests, crash/retry tests, secret-redaction tests, production-config auth-bypass tests, WebMCP deterministic evals, tool-selection evals, a real staging smoke test, and provider-side verification.

## Canonical user workflow

```text
Sign in
  -> prepare workspace
  -> connect required provider
  -> inspect capability readiness
  -> ask or inspect
  -> prepare a proposal
  -> review impact and evidence
  -> approve in AmbiOS if required
  -> observe queued/running/submitted state
  -> verify authoritative result
  -> retry or reconcile safely
```

The onboarding card must say “Prepare your workspace,” not imply that chat is the only setup route. Readiness is capability-based rather than one boolean:

- Ask and inspect
- Read incidents
- Analyze dependencies
- Propose a fix
- Apply a hotfix — approval required
- Deploy or rollback — owner/admin plus approval required

The Plugins page owns connection state. The Approval Queue owns human decisions. Runs/Console owns operation observation and recovery. Incidents own context and remediation evidence. Agent owns explanation and coordination.

## Required UX primitives

- `CapabilityBadge`: connected, available, approval-required, unavailable, deployment-managed, roadmap
- `OperationStatus`: canonical state with text, icon, and safe retry guidance
- `ApprovalSummary`: exact action, resource, environment, evidence, cost, rollback, expiry, and approver
- `ConnectionState`: secure connection opening, callback pending, connected, sync queued, sync failed
- `ProvenanceLabel`: AmbiOS, GitHub, Snyk, Socket, Render, Nango, simulation, or fixture
- `RecoveryAction`: retry, reconcile, reconnect, open provider, or contact operator
- `ErrorState`: user action, configuration, authorization, provider, policy, or system failure
- `EmptyState`: why the view is empty plus its single next action

The current workspace and identity remain visible across Agent, Plugins, Runs, Approvals, and Incidents. Color is never the only status signal. Destructive controls name the exact resource and environment. Busy controls prevent duplicate submission. Every asynchronous state tells the user whether retrying is safe.

## Operator and developer workflow

`/console` is the operational hub. Every operation links to its incident, approval, connector, provider task, audit action, and recovery action. Operators need first-class filters for `Needs approval`, `Retryable`, `Unknown`, and `Configuration blocked`.

The developer workflow has one deployment owner, one environment contract, one capability registry, one operation state model, and one test/eval harness. Local registration is not treated as live deployment proof. Simulation fixtures and staging credentials are separate and visibly labeled.

## Delivery sequence

1. Resolve or explicitly scope-reduce the ADR-019 security blockers.
2. Normalize capability, operation, provenance, approval, and recovery contracts.
3. Establish one canonical Cloudflare deployment path and passing size preflight.
4. Implement shared UI primitives and the capability-based onboarding flow.
5. Align Agent, WebMCP, MCP, Plugins, Runs, Approvals, and Console to the shared contracts.
6. Integrate official vendor SDK/API boundaries with real staging credentials.
7. Add Chrome WebMCP deterministic tests and probabilistic tool-selection evals.
8. Run the hackathon demonstration on deployed HTTPS using one read-only action first, then one explicitly approved staging action if the security gate is cleared.
9. Publish the evidence trail: tool registration, authenticated read, approval, provider execution, authoritative verification, and audit result.

## Acceptance criteria for the hackathon demo

- A public HTTPS deployment loads the real AmbiOS app.
- WebMCP registration is visible in a compatible browser and unsupported browsers degrade cleanly.
- A safe read-only tool succeeds using the authenticated workspace session.
- The response identifies workspace, provenance, freshness, and operation ID.
- A consequential action is visibly approval-gated and cannot self-approve.
- Simulation is clearly marked if used; real staging execution is separately evidenced.
- Provider status is authoritative and not inferred from model text.
- The user can find the operation in Console/Runs and understand the final or reconciliation state.
- No credential, token, secret value, or unbounded vendor payload appears in UI, model output, logs, or audit records.

## Official references

- [OpenAI developer mode and full MCP connectors](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt)
- [OpenAI Apps SDK guidance](https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk)
- [Chrome WebMCP secure tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP evals](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Chrome WebMCP DevTools](https://developer.chrome.com/docs/devtools/application/webmcp)
- [Cloudflare Browser Run WebMCP](https://developers.cloudflare.com/browser-run/features/webmcp/)
- [Render Workflows](https://render.com/docs/workflows)
- [Render TypeScript Workflows SDK](https://render.com/docs/workflows-sdk-typescript)
- [Nango frontend connection lifecycle](https://nango.dev/docs/reference/frontend/frontend-sdk)
- [GitHub Dependabot alerts API](https://docs.github.com/en/rest/dependabot/alerts)
- [GitHub code scanning API](https://docs.github.com/en/rest/code-scanning/code-scanning)
- [GitHub secret scanning API](https://docs.github.com/en/rest/secret-scanning/secret-scanning)
- [Snyk REST API](https://docs.snyk.io/snyk-api/rest-api)
- [Socket package and supply-chain API](https://docs.socket.dev/docs/socket-package)

## Consequences

AmbiOS has one product mental model and multiple clients. The first-party UI remains the control plane; WebMCP and ChatGPT increase reach and discoverability without becoming authorization systems. Vendor integrations remain honest about ownership and maturity. Real credentials prove real execution; fixtures prove only orchestration. This creates a stricter release gate, but it also makes the hackathon demo credible, auditable, and understandable to users and operators.

