# ADR-022: WebMCP Release-Readiness Mission Implementation

- **Status:** Proposed implementation slice
- **Date:** 2026-09-01
- **Decision owner:** AmbiOS AI project team
- **Parent strategy:** [ADR-021 AmbiOS Canonical Platform Strategy](./ADR(021)-ambios-canonical-platform-strategy.md)
- **Purpose:** Convert the AmbiOS strategy into one concrete, demonstrable, WebMCP-native product journey
- **Next gate:** `$build` after ADR-019 security blockers are resolved or explicitly accepted with scope reduction

## Decision

AmbiOS will implement one complete vertical slice called a **Release-Readiness Mission**.

The user asks:

> “Can we safely release this service to staging?”

AmbiOS then lets the agent inspect the authenticated workspace, collect security evidence, create a bounded release plan, accept user constraints, request human approval, execute the approved staging action, verify the provider result, and return a durable evidence record.

This is the primary product experience for the WebMCP Challenge. Workspace setup, connector state, incidents, GitHub/Snyk/Socket findings, guardrails, approvals, Render execution, runs, and audit are supporting parts of this one mission—not separate products.

## User and agent journey

### Starting condition

The user has:

- an authenticated AmbiOS session
- an AmbiOS workspace
- GitHub connected
- Snyk and/or Socket configured where available
- a checkout service and staging environment configured
- a compatible WebMCP browser or ChatGPT in-app browser

If setup is incomplete, the agent must stop at a clear readiness state and direct the user to the AmbiOS setup or Plugins page. It must not fabricate findings or claim that a provider is connected.

### Step 1: Discover capabilities

When the AmbiOS page loads, it registers the WebMCP tools through `document.modelContext.registerTool()`.

The agent discovers tools such as:

```text
ambios.workspace.get_current_context
ambios.integrations.get_status
github.dependabot.list_alerts
snyk.get_vulnerabilities
socket.analyze_package
ambios.incident.get_incident_context
ambios.incident.suggest_hotfixes
ambios.guardrails.evaluate_guardrails
ambios.incident.apply_hotfix
ambios.audit.get_action_log
```

The browser sees structured names, descriptions, schemas, and annotations. WebMCP discovery does not grant authority. Server-side AmbiOS policy remains authoritative.

### Step 2: Inspect workspace state

The user asks:

```text
Can we safely release checkout-api to staging?
```

The agent invokes:

```json
{
  "tool": "ambios.workspace.get_current_context",
  "arguments": {}
}
```

The WebMCP execute callback makes:

```http
GET /api/workspace
Cookie: authenticated-session-cookie
```

The API must authenticate the session, resolve the organization from membership, apply rate limiting, record the action, and return only the authenticated workspace’s data.

Expected response shape:

```json
{
  "ok": true,
  "data": {
    "workspace": "Acme Engineering",
    "userRole": "admin",
    "services": ["checkout-api"],
    "incidents": ["INC-204"],
    "capabilities": [
      "github.security.read",
      "snyk.scan",
      "socket.analyze",
      "render.staging.deploy"
    ]
  }
}
```

### Step 3: Check readiness and evidence sources

The agent invokes:

```json
{
  "tool": "ambios.integrations.get_status",
  "arguments": {}
}
```

Then it gathers vendor evidence:

```json
{
  "tool": "github.dependabot.list_alerts",
  "arguments": { "repo": "acme/checkout-api" }
}
```

```json
{
  "tool": "snyk.get_vulnerabilities",
  "arguments": { "severity": "critical" }
}
```

```json
{
  "tool": "socket.analyze_package",
  "arguments": {
    "packageName": "lodash",
    "version": "4.17.20"
  }
}
```

AmbiOS calls the vendors through their server-side boundaries. Credentials, access tokens, and secret values never enter the WebMCP schema or model-visible output.

Example normalized evidence:

```json
{
  "package": "lodash",
  "currentVersion": "4.17.20",
  "recommendedVersion": "4.17.21",
  "githubAlerts": 1,
  "snykSeverity": "critical",
  "socketRisk": "moderate",
  "affectedService": "checkout-api",
  "productionImpact": "unknown",
  "provenance": ["github", "snyk", "socket"],
  "collectedAt": "2026-09-01T00:00:00.000Z"
}
```

Vendor and user-authored content is untrusted content. Results require size bounds, provenance, timestamps, redaction, and safe rendering.

### Step 4: Load incident context

The agent invokes:

```json
{
  "tool": "ambios.incident.get_incident_context",
  "arguments": { "incidentId": "INC-204" }
}
```

Expected response:

```json
{
  "incidentId": "INC-204",
  "title": "Critical dependency vulnerability",
  "service": "checkout-api",
  "environment": "staging",
  "currentVersion": "4.17.20",
  "proposedVersion": "4.17.21",
  "rollbackAvailable": true
}
```

The route must derive incident access from the authenticated organization and reject cross-tenant or unrelated incident IDs.

### Step 5: Generate a release plan

The agent invokes:

```json
{
  "tool": "ambios.incident.suggest_hotfixes",
  "arguments": { "incidentId": "INC-204" }
}
```

Expected plan:

```json
{
  "proposal": {
    "action": "Upgrade lodash from 4.17.20 to 4.17.21",
    "target": "checkout-api",
    "environment": "staging",
    "risk": "low",
    "reason": "Resolve critical Snyk finding",
    "verification": [
      "Run dependency scan",
      "Run checkout health check",
      "Confirm rollback artifact exists"
    ],
    "approvalRequired": true
  }
}
```

The AmbiOS UI renders this as a proposed mission plan, not as an executed action.

### Step 6: Accept user constraints

The user says:

```text
Do not modify production. Keep rollback available. Run the security scan after deployment.
```

The agent invokes:

```json
{
  "tool": "ambios.guardrails.evaluate_guardrails",
  "arguments": {
    "instruction": "Upgrade lodash to 4.17.21 in checkout-api staging only. Preserve rollback and run a security scan after deployment.",
    "environment": "staging"
  }
}
```

Expected response:

```json
{
  "allowed": true,
  "approvalRequired": true,
  "blockedReasons": [],
  "constraints": [
    "staging only",
    "production excluded",
    "rollback required",
    "post-deploy scan required"
  ]
}
```

The guardrail result becomes part of the mission record and approval summary.

### Step 7: Human approval

The agent cannot approve its own operation. The user opens the AmbiOS Approval page and reviews:

```text
Action: Upgrade lodash 4.17.20 → 4.17.21
Target: checkout-api
Environment: staging
Reason: Resolve critical Snyk vulnerability
Production: excluded
Verification: Snyk scan, health check, rollback check
Approval: workspace admin required
```

The server issues a short-lived approval token bound to:

- organization
- incident
- target service
- environment
- operation type
- request hash
- approving user
- expiration

The token is never generated or trusted solely from model output.

### Step 8: Execute the approved operation

The agent invokes:

```json
{
  "tool": "ambios.incident.apply_hotfix",
  "arguments": {
    "incidentId": "INC-204",
    "instruction": "Upgrade lodash to 4.17.21 in checkout-api staging only.",
    "approved": true,
    "approvalSource": "human",
    "approvalToken": "short-lived-server-issued-token"
  }
}
```

WebMCP sends:

```http
POST /api/incidents/hotfix
Cookie: authenticated-session-cookie
Idempotency-Key: operation-specific-key
Content-Type: application/json
```

The server validates:

- authenticated identity
- organization membership
- role
- incident ownership
- exact approval token
- token expiration
- guardrail result
- budget
- request hash
- idempotency key
- target environment

The server creates one durable operation with a stable `operation_id` and transitions it to `queued`.

### Step 9: Execute through the vendor runtime

The WebMCP call does not pretend to be the deployment system. AmbiOS delegates durable work to the approved workflow/runtime boundary, such as Render Workflows.

The user sees:

```text
Queued → Running → Verifying
```

The operation links:

- AmbiOS `operation_id`
- incident ID
- approval ID
- queue job ID
- Render workflow/task ID
- vendor request/event ID
- audit action ID

Provider submission is displayed as `submitted` or `running`, never as `succeeded` until authoritative verification completes.

### Step 10: Verify reality

AmbiOS runs the required checks:

```text
Snyk scan
Checkout health check
Deployed version check
Rollback artifact check
```

Expected result:

```json
{
  "operationId": "op_204_abc",
  "status": "succeeded",
  "verification": {
    "snyk": "passed",
    "healthCheck": "passed",
    "deployedVersion": "4.17.21",
    "rollbackAvailable": true
  }
}
```

If the provider outcome cannot be established, the operation becomes:

```text
unknown / reconciliation_required
```

It must not be retried automatically if doing so could duplicate an external side effect.

### Step 11: Return evidence

The agent invokes:

```json
{
  "tool": "ambios.audit.get_action_log",
  "arguments": {}
}
```

AmbiOS returns an evidence record:

```json
{
  "operationId": "op_204_abc",
  "status": "succeeded",
  "evidence": [
    "GitHub Dependabot alert",
    "Snyk scan result",
    "Socket package analysis",
    "Render workflow result",
    "Checkout health check"
  ],
  "approvedBy": "user_456",
  "environment": "staging",
  "timestamp": "2026-09-01T00:00:00.000Z"
}
```

The final agent response must be based on this verified record, not on model assumptions.

## WebMCP communication model

```text
Browser agent
  → document.modelContext.getTools()
  → document.modelContext.executeTool(tool, arguments)
  → registered execute callback
  → same-origin fetch with session cookie
  → Next.js API route
  → Supabase authentication
  → D1 tenant and authorization checks
  → AmbiOS policy/guardrail/budget/approval checks
  → Nango/vendor API or Render workflow
  → D1 operation and audit state
  → structured WebMCP response
  → agent explanation
  → visible AmbiOS state
```

WebMCP supplies browser-level discovery, schemas, execution, cancellation, and page context. AmbiOS supplies identity, authority, durable state, vendor boundaries, verification, and human control. Chrome recommends read-only and untrusted-content annotations, concise schemas and outputs, and explicit attention to prompt injection. [Chrome WebMCP security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

## UI implementation surfaces

### Agent

Shows the mission conversation and current state. It explains evidence and proposes the next safe step.

### Mission panel

Shows:

- desired outcome
- current observed state
- gap to desired state
- evidence provenance
- proposed actions
- constraints
- approval status
- operation state

### Approval page

Shows the exact action, target, environment, evidence, cost, rollback, expiry, and approver role.

### Runs and Console

Show one operation timeline with links to incident, provider task, audit event, and recovery action.

### Plugins/setup

Shows capability readiness:

- connected
- available to connect
- pending
- deployment-managed
- unavailable
- roadmap

It must never make metadata-only or simulated capabilities appear executable.

## MVP scope

Implement only this vertical slice first:

```text
One repository
One staging service
One dependency vulnerability
GitHub evidence
Snyk or Socket evidence
One proposal
One approval flow
One Render/staging execution path
One verification report
One audit receipt
```

Other connectors and operations remain visible only when they have real implementation and authoritative status.

## Explicit non-goals

- No autonomous production deployment in the hackathon demo.
- No model-visible OAuth or provider secrets.
- No claiming that a simulated provider call completed real work.
- No generic “AI operations platform” positioning.
- No requirement that WebMCP replace the first-party AmbiOS UI.
- No execution based solely on `approved: true` without server-issued approval evidence.

## Acceptance tests

1. A compatible browser discovers the AmbiOS tools on deployed HTTPS.
2. An unauthenticated tool call returns an authentication error and exposes no workspace data.
3. A read-only workspace call returns only the authenticated organization’s state.
4. A wrong-tenant incident ID is rejected.
5. Missing connector setup produces a clear setup action, not fabricated data.
6. Vendor findings include provenance and are marked untrusted where applicable.
7. A proposal never executes automatically.
8. Production is rejected when the mission is scoped to staging.
9. Approval cannot be self-issued by the agent.
10. Reusing an approval token is rejected.
11. Retrying the same idempotency key returns the original safe result.
12. A provider submission remains `submitted`/`running` until verification.
13. An ambiguous provider result becomes `reconciliation_required`.
14. The final result appears in Agent, Runs/Console, and the audit record with the same operation ID.
15. No secrets appear in WebMCP output, model transcript, logs, or audit JSON.

## Success statement

The demo succeeds when a judge can watch one request move from natural language, through WebMCP discovery and structured execution, across real evidence providers and human approval, into a verified staging result—without confusing agent intent, provider submission, or simulation with proof of completion.

## References

- [WebMCP Challenge requirements](https://webmcp.devpost.com/)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp/)
- [Chrome WebMCP security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP evals](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Render Workflows](https://render.com/docs/workflows)
- [Render TypeScript Workflows SDK](https://render.com/docs/workflows-sdk-typescript)
- [Nango frontend connection lifecycle](https://nango.dev/docs/reference/frontend/frontend-sdk)

