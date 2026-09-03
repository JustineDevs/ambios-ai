# ADR-020: AmbiOS User and Operator Interaction Review

- **Status:** READY FOR BUILD AFTER SECURITY BLOCKERS ARE RESOLVED
- **Date:** 2026-09-01
- **Scope:** First-party web UI, browser WebMCP, ChatGPT/MCP, model selection, onboarding, connectors, approvals, runs, incidents, and operator recovery
- **Previous gate:** [ADR-019 Security and Trust-Boundary Review](./ADR(019)-security-trust-boundary-review.md)
- **Next allowed trigger:** `$build` after the ADR-019 release blockers are fixed or explicitly accepted with scope reduction

## Decision

AmbiOS should feel like one governed operations workspace with three clients, not three products:

1. **AmbiOS web app:** the primary control surface for setup, connection, explanation, approval, and recovery.
2. **Browser WebMCP:** a discoverability and invocation surface for the currently open, authenticated AmbiOS page. It must mirror the web app’s capability state and never bypass it.
3. **ChatGPT/MCP:** a remote assistant surface for asking questions and initiating eligible actions. It must link the user back to AmbiOS for authentication, missing setup, approval, and reconciliation.

The user should always know: who is acting, which workspace is selected, which provider data is being used, whether an action is read-only or consequential, whether a human approval is needed, and whether the result is simulated, submitted, running, succeeded, failed, retryable, or unknown.

## Evidence reviewed

The review examined the live component and route structure, including:

- `apps/web/src/components/agent/AgentInterface.tsx`
- `apps/web/src/components/agent/AgentSetupCard.tsx`
- `apps/web/src/app/config-context.tsx`
- `apps/web/src/app/(dashboard)/plugins/page.tsx`
- `apps/web/src/app/(dashboard)/approvals/page.tsx`
- `apps/web/src/app/runs/page.tsx`
- `webmcp/register.ts`
- `webmcp/VERIFICATION.md`
- the route inventory under `apps/web/src/app`
- ADR-015 through ADR-019 and the existing QA notes

The screenshot evidence shows a working WebMCP DevTools surface with an available-tool list, but the page is blocked by missing Cloudflare D1 configuration. Therefore, the screenshot proves browser-side registration/discovery in that environment; it does not prove authenticated end-to-end execution, provider access, or production deployment.

## Canonical user journey

```text
Sign in
  -> choose/create workspace
  -> connect required provider(s)
  -> see capability readiness
  -> ask/read in Agent, WebMCP, or ChatGPT
  -> inspect proposed action and impact
  -> approve in AmbiOS when required
  -> observe submitted/running state
  -> inspect authoritative result
  -> reconcile/retry or view audit trail
```

There must be one canonical readiness model behind all three clients:

```text
NOT_AUTHENTICATED
WORKSPACE_REQUIRED
CONNECTOR_REQUIRED
CONNECTOR_PENDING
READY_READ_ONLY
READY_WITH_APPROVAL
RUNNING
RETRYABLE
SUCCEEDED
FAILED
UNKNOWN_RECONCILIATION_REQUIRED
```

The web app can render every state. WebMCP and ChatGPT should expose only actions valid for the current state and return a structured next action when they cannot proceed.

## User workflow risks

### 1. Onboarding is split between chat and setup UI

`AgentSetupCard` says “Finish your workspace setup in chat,” but the card itself contains workspace creation and GitHub connection controls. This creates a false choice and makes the user wonder whether chat, Setup, or Plugins is the authoritative route.

**Simplification:** rename the flow to “Prepare your workspace,” show a three-step readiness checklist, and make each step link to exactly one action. Chat may guide the user, but setup state is owned by the workspace surface.

### 2. “Ready” is too coarse

The setup card unlocks the agent after workspace and GitHub readiness, but different operations require different connectors, roles, budgets, approvals, or deployment configuration.

**Simplification:** replace one boolean `ready` presentation with capability badges:

- Ask and inspect
- Read incidents
- Analyze dependencies
- Propose a fix
- Apply a hotfix — approval required
- Deploy or rollback — owner/admin and approval required

### 3. Connector catalog mixes availability and marketing

The Plugins page displays runtime, MVP, roadmap, and metadata-only entries. That is useful for planning but risky in an action catalog if users cannot immediately tell what works now.

**Simplification:** every card must have one of four explicit labels: `Connected`, `Available to connect`, `Deployment-managed`, or `Roadmap`. Only the first two get an actionable control. Every non-actionable card explains what evidence is available today and what is not.

### 4. ChatGPT/MCP setup lacks a return path

The Plugins page provides an MCP URL, but the user needs a clear sequence for adding it to ChatGPT, authenticating, returning to AmbiOS for approval, and seeing the result.

**Simplification:** provide “Connect to ChatGPT” instructions with status checkpoints: `URL copied`, `authorization required`, `connected`, `approval in AmbiOS`, and `result available`. Never instruct the user to paste an AmbiOS API key into ChatGPT.

### 5. WebMCP tool list is technically rich but operationally noisy

The registered list contains identity, workspace, incident, docs, integrations, Snyk, Socket, sync, hotfix, and deployment tools. A user or agent cannot easily distinguish read-only evidence gathering from actions that spend budget or change infrastructure.

**Simplification:** group tools by intent and expose capability-aware descriptions:

- `Inspect`: read-only workspace, incident, docs, security findings, provider status
- `Prepare`: proposals, scans, recommendations, dry-run plans
- `Approve`: human-only approval UI; not an autonomous WebMCP action
- `Execute`: approved hotfix/deploy/sync actions with explicit impact
- `Observe`: run status, audit record, reconciliation

### 6. Approval queue is not an action explanation

The approval page lists unresolved incidents and links to a hotfix page. It does not yet make the proposed change, affected resources, expected cost, rollback, evidence, expiry, or provider status the primary decision object.

**Simplification:** approval cards must answer five questions above the fold: what will change, why, where, how much, and how to undo it. The approve button must state the exact action and environment. The reject path must optionally capture a reason.

### 7. Async status vocabulary is inconsistent

Runs currently display `running`, `success`, `failed`, and `aborted`, while the orchestration contract uses `queued`, `running`, `retryable`, `succeeded`, `failed`, and `unknown`. Backend deploy also uses `simulated_completed` and `submitted`.

**Simplification:** one shared status vocabulary and one status component across Agent, Runs, Approvals, incident pages, WebMCP responses, and ChatGPT output. Keep provider-specific detail in a secondary line, not a competing status.

## Operator workflow risks

### Developer workflow

- Two Wrangler configurations create uncertainty about the canonical deploy target.
- Local WebMCP can register tools while the live route remains unverified.
- Render Workflows are asynchronous, but there is no single operator view tying task ID, AmbiOS operation ID, queue job, vendor request, and audit action together.
- Simulated and real provider execution need separate environments and visible labels.
- Static tool registration means capability changes require code/deploy rather than a server-driven policy snapshot.

### Operator workflow

- A failed action may require searching several surfaces: Runs, Console, Incidents, Approvals, and provider dashboards.
- Unknown external outcomes lack a first-class reconciliation queue.
- Nango webhook and queue recovery states are not visible as operator-owned work.
- The operator cannot quickly distinguish configuration failure, user authorization failure, provider outage, rate limiting, policy rejection, and side-effect uncertainty.

**Simplification:** make `/console` the operational hub. Every run row should link to the incident, approval, connector, provider task, audit action, and recovery action. Add filtered views for `Needs approval`, `Retryable`, `Unknown`, and `Configuration blocked`.

## Complexity hotspots

1. Agent tool-call rendering, WebMCP registration, MCP server tools, and API routes each describe overlapping capabilities independently.
2. Connector status is derived in multiple places and must be normalized into one capability registry.
3. Approval state, idempotency state, queue state, Render task state, and vendor state can diverge.
4. OAuth completion uses client callbacks and tool mutation state, increasing the risk of token-shaped data entering transcripts or UI state.
5. The model selector is a control for model choice, but the UI must not imply that selecting a model changes connector authorization or deployment capability.

## Interaction contract by surface

| Surface | Primary job | May do | Must not imply |
|---|---|---|---|
| Agent | Explain and coordinate | Read, propose, request approval, observe | That the model itself has authority |
| WebMCP | Let a browser agent discover/invoke page capabilities | Invoke currently exposed, server-authorized tools | That registration equals authorization |
| ChatGPT/MCP | Remote natural-language access | Read and initiate eligible actions | That ChatGPT is the approval authority |
| Plugins | Connect and inspect providers | Start hosted OAuth, view status, request sync | That roadmap/runtime entries are connectable |
| Approvals | Human decision | Review, approve, reject | That approval proves completion |
| Runs/Console | Observe and recover | Inspect, retry safely, reconcile | That submission equals success |
| Incidents | Context and remediation | Inspect evidence, propose/apply approved fix | That an AI suggestion is a verified fix |

## Required UI primitives before build completion

- `CapabilityBadge`: available, connected, approval-required, unavailable, roadmap, deployment-managed
- `OperationStatus`: received, rejected, awaiting approval, queued, running, retryable, succeeded, failed, unknown
- `ApprovalSummary`: exact action, target, environment, evidence, cost, rollback, expiry, approver
- `ConnectionState`: not connected, opening secure connection, pending callback, connected, sync queued, sync failed
- `ProvenanceLabel`: AmbiOS record, GitHub, Snyk, Socket, Render, Nango, simulated fixture
- `RecoveryAction`: retry, reconcile, reconnect, open provider, contact operator
- `EmptyState`: explain why empty and provide the one next action
- `ErrorState`: distinguish user action, configuration, authorization, provider, and system failure

## Accessibility and clarity acceptance criteria

- Status is conveyed by text and icon, never color alone.
- Every destructive action names the target and environment in its accessible label.
- Async buttons retain their purpose while busy and prevent duplicate submission.
- Connection windows have a visible pending state and a recovery action if the callback is missed.
- Tool results include provenance and freshness timestamps when external data is involved.
- Error messages tell the user whether retrying is safe.
- The current workspace and identity remain visible while navigating Agent, Plugins, Runs, and Approvals.

## Build sequencing

1. Normalize state and capability contracts shared by API, Agent, WebMCP, MCP, and UI.
2. Fix the security blockers from ADR-019 before enabling consequential execution.
3. Build the shared status, capability, approval, provenance, and recovery primitives.
4. Rework onboarding and connector pages around readiness capabilities.
5. Rework Agent/WebMCP/MCP descriptions to use the same capability registry.
6. Make Console/Runs the cross-surface operation timeline.
7. Add Chrome WebMCP deterministic interaction tests and tool-selection eval cases. [Chrome WebMCP evals](https://developer.chrome.com/docs/ai/webmcp/evals)
8. Verify staging with real, least-privilege credentials and explicitly labeled simulation fixtures.

## Consequences

This approach reduces the product to one mental model: AmbiOS is the governed workspace, while Agent, WebMCP, and ChatGPT are clients. It removes duplicate setup paths, prevents roadmap capabilities from looking executable, gives operators one recovery hub, and makes asynchronous vendor execution understandable without weakening the security boundaries established in ADR-019.

