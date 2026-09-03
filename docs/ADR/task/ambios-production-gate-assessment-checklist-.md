# AmbiOS AI Production Gate Assessment Checklist

**Revised scope:** Real AmbiOS AI project verification using the Vercel-hosted Next.js frontend and Cloudflare Hono Worker APIs. Any `pages.dev` URLs retained below are historical evidence references and must not be used as current deployment targets; replace them with the release's recorded Vercel URL before running this checklist.

**Assessment status:** `BLOCKED` until the external deployment, browser, authentication, provider, and Snyk/Socket evidence fields are completed. Use only `PASS`, `BLOCKED`, or `FAIL`: `PASS` is directly evidenced, `BLOCKED` is not yet verifiable, and `FAIL` was tested and did not meet the gate.

**Purpose:** Verify that AmbiOS AI is a real, deployed, end-to-end WebMCP application operating against a real existing, authorized project—not a mock-only, fabricated, UI-only, or documentation-only demonstration.

**Operating principle:** Every checked item requires direct evidence: an observed production/preview request, an auditable event, a real vendor-side artifact, a reproducible command/output, or a screen recording. Planned, mocked, hardcoded, fixture-only, or unverified behavior does not pass a production gate.

**Roles:**
- **Codex verification tasks** confirm that code, routes, data persistence, registration, and automated/reproducible flows behave correctly.
- **Human verification tasks** confirm visual behavior, authentication, intent, approval, independent vendor-side evidence, and the final public claims.
- **Shared gates** require both technical evidence and human sign-off.

---

## 1. Assessment Record

| Field | Value |
|---|---|
| Assessment date/time | |
| Human assessor | |
| Codex verification run / session | |
| Deployed commit SHA | |
| Live production/preview URL | `<VERCEL_PRODUCTION_URL>` |
| Public code repository | `https://github.com/justinedevs/ambios-ai` |
| Authorized real demo repository/project | |
| Authorized connected vendor(s) used | GitHub / Cloudflare / Nango / other: |
| Environment under test | `<VERCEL_PRODUCTION_URL>` |
| Overall gate decision | `PASS` / `BLOCKED` / `FAIL` |

### Evidence register

| Evidence type | URL, screenshot, recording, run ID, commit, action ID, or note |
|---|---|
| Live application recording | |
| WebMCP DevTools — Available Tools | |
| WebMCP Tool Activity execution | |
| ChatGPT Site Tools execution | |
| GitHub PR / commit URL | |
| Cloudflare deployment/version/status evidence | |
| D1/audit event IDs | |
| Approval-gate deny evidence | |
| Approval-gate approve evidence | |
| Codex test output / summary | |
| Human final review notes | |
| Snyk provider result / audit event | `PASS` / `BLOCKED` / `FAIL` — evidence: |
| Socket.dev provider result / audit event | `PASS` / `BLOCKED` / `FAIL` — evidence: |

---

## 2. Gate Rules

### 2.1 Pass definitions

| Decision | Meaning |
|---|---|
| **PASS** | All non-negotiable gates pass, all claimed functionality has evidence, and the public submission accurately represents the deployed app. |
| **BLOCKED** | Required evidence is unavailable or an external dependency has not been verified; the gate is not ready for a PASS decision. |
| **FAIL** | A required real capability is mocked/unsupported, WebMCP cannot execute end-to-end, authorization/approval is bypassable, credentials are exposed, or public claims are inaccurate. |

### 2.2 Non-negotiable truth rules

- [ ] Do not mark a vendor integration “live” if it returns static fixtures, a hardcoded response, or a simulated success state.
- [ ] Do not mark a deployment “real” without independent Cloudflare/vendor evidence of a version, deployment, or service state change.
- [ ] Do not mark a GitHub integration “real” without an authorized repository read and/or a real GitHub-side artifact such as a branch, commit, issue, or pull request.
- [ ] Do not mark “ChatGPT tested” unless ChatGPT Site Tools discovered and executed at least one AmbiOS tool on the deployed URL.
- [ ] Do not claim that a write action is approval-gated unless the server independently rejects the same operation without a valid approval record.
- [ ] Do not claim that a feature exists merely because its UI, tool definition, documentation, route stub, or mock response exists.
- [ ] Any unavailable functionality is labeled honestly as `not configured`, `sandbox`, `preview`, `mocked`, or `planned`.

---

## 3. Public Build Gate

### Codex tasks

- [ ] Confirm the deployment configuration points to the Vercel frontend and the two canonical Cloudflare Worker targets (`wrangler.toml` Core and `wrangler.connector.toml` Connector/Execution).
- [ ] Confirm the currently deployed commit is present in the public GitHub repository.
- [ ] Confirm the root repository contains a valid detectable `LICENSE` file.
- [ ] Run dependency installation and build/typecheck/lint commands documented in the repository.
- [ ] Verify the production build does not contain runtime references to development-only URLs unless explicitly allowed.
- [ ] Verify all required environment variables are read server-side where secrets are involved.
- [ ] Search the repository for accidentally committed secret patterns, `.env` files, API tokens, private keys, Supabase service-role keys, and OAuth credentials.
- [ ] Verify that `.env.example` contains placeholders only.
- [ ] Verify errors from unavailable services do not expose credentials, connection tokens, internal stack traces, or vendor secrets.

### Human tasks

- [ ] Open `<VERCEL_PRODUCTION_URL>` in a normal browser session.
- [ ] Confirm the page loads over HTTPS without browser certificate warnings or mixed-content errors.
- [ ] Confirm the public UI does not display a developer-only setup blocker to judges, such as “workspace storage is unavailable” or missing database-binding instructions.
- [ ] Confirm the visible product name, tagline, navigation, and submitted description identify the app as AmbiOS AI.
- [ ] Confirm the public repository is accessible without requesting access.
- [ ] Confirm the GitHub repository page visibly shows the open-source license.
- [ ] Confirm the deployed application looks and behaves like the repository’s documented version.

### Shared pass condition

- [ ] `<VERCEL_PRODUCTION_URL>` is a stable, publicly accessible HTTPS URL and corresponds to the public, licensed source repository.

---

## 4. WebMCP Registration and Discovery Gate

### Codex tasks

- [ ] Inspect the implementation and confirm WebMCP registration uses `document.modelContext.registerTool()` or the current official compatible browser API.
- [ ] Confirm registration code runs only in a client-side mounted context; server rendering must not access `document`.
- [ ] Confirm feature detection handles browsers without WebMCP gracefully.
- [ ] Confirm each tool has a unique name, accurate description, valid JSON input schema, and correct side-effect annotations.
- [ ] Confirm all write-capable tools are not advertised as read-only.
- [ ] Confirm tool handlers call real authenticated application routes/services rather than returning frontend hardcoded data.
- [ ] Confirm registration errors are caught, logged safely, and visible for debugging without exposing secrets.
- [ ] Add or run an automated test that asserts expected tool names are registered in a WebMCP-capable environment or test harness.

### Human tasks

- [ ] Open `<VERCEL_PRODUCTION_URL>` directly as a top-level page in Chrome/Brave with WebMCP enabled.
- [ ] Open DevTools → Application → WebMCP.
- [ ] Capture evidence that **Available Tools** lists actual `ambios.*` tools from the deployed app.
- [ ] Verify at least these categories appear where implemented: identity/context, incidents, guardrails/approvals, audit/activity, integrations, and deployment/hotfix actions.
- [ ] Confirm the displayed descriptions match what a user/agent can actually do.
- [ ] Confirm the application remains useful in a browser that does not support WebMCP.

### Shared pass condition

- [ ] WebMCP tools are registered by the deployed AmbiOS page and are discoverable in a compatible browser’s WebMCP inspector.

---

## 5. Real Tool Execution Gate

### Codex tasks

- [ ] Identify one read-only tool backed by real authenticated persisted data, preferably `ambios.identity.get_current_user` or `ambios.incident.get_incident_context`.
- [ ] Verify the tool handler reaches a real API/data-access path and cannot return an unconditional hardcoded “success” response.
- [ ] Verify invalid input is rejected by server-side schema validation.
- [ ] Verify missing authentication is rejected by the server.
- [ ] Verify a user cannot supply another organization/workspace identifier to access data without membership.
- [ ] Verify successful execution creates or updates an auditable action/event record where the product claims auditing.
- [ ] Verify error responses are structured and do not leak implementation secrets.
- [ ] Provide an exact reproducible tool-execution command/script for the human tester.

### Human tasks

- [ ] Sign in to AmbiOS using the intended real authentication flow.
- [ ] Execute one read-only WebMCP tool against real workspace data.
- [ ] Confirm the response reflects the signed-in user/workspace, not a generic fixture.
- [ ] Confirm DevTools → Application → WebMCP shows the invocation under **Tool Activity**.
- [ ] Confirm the Network tab shows the expected authenticated request and a successful server response.
- [ ] Refresh the app and confirm the underlying workspace/incident data persists if it was expected to persist.
- [ ] Capture a screenshot or recording of tool discovery, execution, and returned result.

### Shared pass condition

- [ ] At least one deployed AmbiOS WebMCP tool has been discovered and executed against real authenticated, persisted application data.

---

## 6. Infrastructure, Database, and Persistence Gate

### Codex tasks

- [ ] Confirm Cloudflare runtime bindings used by the app exist in the deployment configuration: D1 `DB`, and any active KV, R2, or Queue bindings.
- [ ] Confirm the D1 schema has been applied to the database used by the deployed Core Worker.
- [ ] Verify required tables used by the application exist and queries succeed.
- [ ] Verify organization/workspace creation persists correctly.
- [ ] Verify membership and workspace queries are scoped by authenticated organization/user.
- [ ] Verify incidents, actions, approvals, and audit events persist if these capabilities are enabled in the submission.
- [ ] Verify database failures return safe errors and do not silently fall back to mock-only data while claiming production persistence.
- [ ] Inspect deployment/runtime logs for missing D1 binding, missing migration, unavailable storage, or unhandled runtime exception errors.

### Human tasks

- [ ] Create or open the authorized demo workspace on `<VERCEL_PRODUCTION_URL>`.
- [ ] Refresh the page and confirm the workspace still exists.
- [ ] Create/open a real demo incident and refresh the page to confirm persistence.
- [ ] Confirm the app does not present any unresolved database/setup warning to the judge.
- [ ] Confirm the activity/audit interface shows the expected persisted events after a tool call or approval decision.

### Shared pass condition

- [ ] The deployed AmbiOS workspace, incident state, and audit/action records are backed by working persistence—not browser-only state or fabricated fixtures.

---

## 7. Authentication, Authorization, and Connection Gate

### Codex tasks

- [ ] Verify Supabase authentication/session validation is performed on the server for protected routes and actions.
- [ ] Verify the backend does not accept a browser-provided user ID, organization ID, role, or approval status as proof of authority.
- [ ] Verify user membership and role checks apply to every workspace-scoped action.
- [ ] Verify unauthenticated access to protected tools returns an authorization error.
- [ ] Verify a non-privileged member cannot execute a privileged action through direct API requests or tool invocation.
- [ ] Verify logout/session expiry revokes access to protected tool routes.
- [ ] Verify Nango/vendor connection metadata is scoped to the correct user/organization and does not expose credentials to the client.
- [ ] Verify disconnect/revoke behavior prevents later vendor API calls for that connection.

### Human tasks

- [ ] Complete sign-in on the deployed app.
- [ ] Verify the current-user/context tool returns the correct real user and organization.
- [ ] Log out and confirm protected workspace/tool actions cannot be performed.
- [ ] If more than one account/workspace is available, confirm data from another workspace is not visible.
- [ ] Connect only an authorized demo vendor account/repository/service for testing.
- [ ] Confirm the UI shows connection status without showing tokens, API keys, refresh tokens, or secrets.
- [ ] Disconnect a non-critical test connection if available and confirm the related tool no longer executes successfully.

### Shared pass condition

- [ ] AmbiOS uses real authenticated sessions, server-side authorization, organization scoping, and connection isolation for all protected actions.

---

## 8. GitHub and Cloudflare Real Integration Gate

**Scope:** Complete only the integrations actually enabled in the deployed submission. Do not claim an integration is live until this section has evidence.

### 8.1 GitHub integration

#### Codex tasks

- [ ] Confirm the GitHub integration route/tool uses server-side credentials or an authorized connection, not a browser-exposed token.
- [ ] Confirm the requested repository owner/name/ref are validated against the authenticated organization’s allowed connection scope.
- [ ] Confirm read routes retrieve real GitHub API data when the connection is configured.
- [ ] Confirm write routes require server-side authorization and applicable approval checks.
- [ ] Confirm failed GitHub responses remain failures; they must not become a fake successful PR/commit result.
- [ ] Confirm PR creation stores the returned real PR URL/number and commit/branch metadata in the audit trail.

#### Human tasks

- [ ] Connect an authorized real GitHub account/repository or use the documented demo connection.
- [ ] Execute one safe read operation against the real demo repository.
- [ ] Confirm returned repo/branch/file/PR data is visible independently on GitHub.
- [ ] After completing the approval gate, create a real branch, issue, commit, or pull request against the authorized demo repository.
- [ ] Open GitHub independently and verify the artifact exists.
- [ ] Record the GitHub URL, branch name, PR number, commit SHA, and AmbiOS audit event ID.
- [ ] Confirm a denial path produces no GitHub write artifact.
- [ ] Confirm the test change can be reverted or closed safely.

#### Shared pass condition

- [ ] GitHub capability is real only when an authorized connected repository returns genuine data and any claimed write workflow creates a real GitHub-side artifact after approval.

### 8.2 Cloudflare integration

#### Codex tasks

- [ ] Confirm Cloudflare deployment/status routes use server-side access and do not expose secrets in browser output.
- [ ] Confirm service/project/environment selection is authorized and validated.
- [ ] Confirm deployment and rollback routes are write-capable and require applicable approval/role checks.
- [ ] Confirm the handler records real vendor response fields such as deployment ID, version, URL, or status.
- [ ] Confirm failures from Cloudflare are not converted into “success” UI states.
- [ ] Confirm rollback targets are bounded to authorized demo/staging resources.

#### Human tasks

- [ ] Connect or use the authorized Cloudflare demo project/service.
- [ ] Retrieve real service/deployment status through AmbiOS.
- [ ] Verify the status independently in the Cloudflare dashboard or by opening the service URL.
- [ ] Request a safe staging/preview deployment or authorized deployment action through AmbiOS.
- [ ] Approve the exact displayed target and action only after reviewing it.
- [ ] Verify the vendor-side deployment/version/status changed as reported.
- [ ] Record the deployment URL/version/action ID and AmbiOS audit event ID.
- [ ] If rollback is claimed, test it in the authorized demo environment and independently verify the result.

#### Shared pass condition

- [ ] Cloudflare capability is real only when the connected authorized service returns genuine status and any claimed deployment/rollback produces independently verifiable vendor-side evidence after approval.

---

## 9. Human Approval and Safe Change Gate

### Codex tasks

- [ ] Identify all write-capable tools, including deployment, hotfix, document update, integration sync, GitHub write, and any delete/rollback operation.
- [ ] Confirm the risk/guardrail policy is evaluated server-side for every protected action.
- [ ] Confirm approval is bound to the exact tool name, target, and argument payload.
- [ ] Confirm an approval cannot be replayed for a different request.
- [ ] Confirm approvals expire or are invalidated appropriately.
- [ ] Confirm the final execution handler rechecks authentication, role, scope, approval, and guardrails before the vendor call.
- [ ] Add or run tests demonstrating that direct API calls without valid approval are rejected.
- [ ] Verify denial, expiration, error, and execution events are represented in the audit trail.

### Human tasks

- [ ] Trigger a real proposed change against the authorized demo project without approving it.
- [ ] Confirm the proposal shows the exact action, target, scope, risks, and rollback plan where available.
- [ ] Explicitly deny the action once.
- [ ] Confirm no vendor write artifact, deployment, PR, or mutation occurred after denial.
- [ ] Confirm the denial appears in the audit history.
- [ ] Trigger the proposal again and explicitly approve the exact displayed request.
- [ ] Confirm only the approved action executes.
- [ ] Confirm the final result is visible in the UI and independently verifiable at the vendor where applicable.

### Shared pass condition

- [ ] AmbiOS demonstrates a real safe-change boundary: an action is proposed, denied without execution, separately approved, then executed only within the approved scope and recorded in the audit trail.

---

## 10. Auditability and Evidence Gate

### Codex tasks

- [ ] Verify audit events include timestamp, organization/workspace, actor/user, client/agent context, tool/action name, outcome/status, and safe argument/result summaries.
- [ ] Verify sensitive fields are redacted from audit records.
- [ ] Verify tool calls, approval requests, approvals/denials, vendor execution, failures, verification, and rollback are recorded as distinct events where applicable.
- [ ] Verify audit records persist across browser refresh and application restart.
- [ ] Verify an ordinary user cannot alter historical audit records through UI/API.
- [ ] Verify a failed action cannot appear as completed in the audit/activity UI.

### Human tasks

- [ ] Open the audit/activity view after a real read-only tool call.
- [ ] Confirm the action is visible with a believable timestamp, user/workspace context, tool name, and result state.
- [ ] Open the audit/activity view after denial and approval tests.
- [ ] Confirm the sequence is visible: proposal/request → denial or approval → execution → verification/result.
- [ ] Capture the audit trail as evidence for the final demo.

### Shared pass condition

- [ ] The final demo workflow has a coherent, persistent, human-readable audit trail from investigation through result.

---

## 11. Codex End-to-End Verification Task

This is a separate, explicit task for Codex. Codex must verify implementation truth and produce a factual test report. Codex must not “assume” a vendor action succeeded from UI copy alone.

### Codex task brief

```text
You are performing a production gate assessment for AmbiOS AI.

Target URL: <VERCEL_PRODUCTION_URL>
Repository: https://github.com/justinedevs/ambios-ai

Goal: Verify that WebMCP registration, authenticated tool execution, persistence, authorization, approval enforcement, audit logging, and any enabled GitHub/Cloudflare integrations are real and end-to-end—not mocked or UI-only.

Rules:
1. Do not claim a check passed without direct technical evidence.
2. Distinguish implemented, live, sandboxed, mocked, unavailable, and unverified behavior.
3. Never expose secrets or request private credentials in a report.
4. Do not perform destructive changes or production writes without a documented authorized demo target and a human approval.
5. Treat tool registration as insufficient proof; verify an actual execution path.
6. Treat UI success text as insufficient proof; verify server responses, persisted audit records, and vendor-side artifacts where applicable.

Required output:
- Deployed commit/version assessed
- Commands/tests run and outcomes
- WebMCP tool names discovered
- Read-only tool execution evidence
- Authorization-negative test evidence
- Approval-bypass-negative test evidence
- Database/persistence checks
- GitHub integration status: live/sandbox/mocked/unconfigured/unverified
- Cloudflare integration status: live/sandbox/mocked/unconfigured/unverified
- Audit log evidence
- Blocking issues
- Recommended fixes ordered by severity
- Final decision: PASS / BLOCKED / FAIL
```

### Codex verification checklist

- [ ] Inspect the public repository structure, license, README, environment example, and deployment configuration.
- [ ] Run the documented build, typecheck, lint, and test suite.
- [ ] Identify WebMCP registration code and list all actual tool names and handlers.
- [ ] Confirm tools are registered only in client runtime and use real server-backed handlers.
- [ ] Inspect each tool handler for mock responses, placeholder data, `TODO` branches, unimplemented catch-all success behavior, or browser-exposed secrets.
- [ ] Verify a read-only tool call against the deployed app using the supported test path.
- [ ] Verify invalid input and unauthenticated requests fail safely.
- [ ] Verify cross-workspace/unauthorized resource access is rejected.
- [ ] Verify D1/database persistence used by workspace, incidents, actions, approvals, and audit logging.
- [ ] Verify the approval token/record cannot be omitted, altered, replayed, or applied to a different action payload.
- [ ] Verify a denied request creates no external write action.
- [ ] Verify any GitHub/Cloudflare call returns genuine response data when configured; otherwise mark it unavailable rather than live.
- [ ] Produce the required factual report and hand it to the human assessor.

---

## 12. Human End-to-End Verification Task

This is a separate, explicit task for the human owner/operator. The human validates real account authority, visible product behavior, approval intent, independent vendor evidence, and truthful public claims.

### Human task brief

```text
You are the final accountable operator for AmbiOS AI.

Target URL: <VERCEL_PRODUCTION_URL>

Goal: Prove the submitted product works as a real WebMCP application against an authorized existing project. Verify the experience from the user and judge perspective. Do not use customer, personal, or unauthorized production systems.

Rules:
1. Use only a team-owned or explicitly authorized demo repository/service/account.
2. Test read-only behavior first.
3. Deny a proposed write action before approving one.
4. Independently verify every claimed external result in the relevant vendor dashboard or repository.
5. Capture evidence throughout the flow.
6. Disclose unavailable, sandbox, mocked, or planned features honestly.
```

### Human verification checklist

- [ ] Open `<VERCEL_PRODUCTION_URL>` over HTTPS.
- [ ] Sign in through the real authentication flow.
- [ ] Create/open the authorized demo workspace and verify it persists after refresh.
- [ ] Open DevTools → Application → WebMCP and capture the available AmbiOS tools.
- [ ] Use a WebMCP-capable browser or ChatGPT Site Tools to discover and execute a read-only tool.
- [ ] Confirm Tool Activity shows the invocation and the result corresponds to the signed-in workspace.
- [ ] Open the audit/activity log and capture the event.
- [ ] Connect only the authorized real GitHub/Cloudflare demo account/project if applicable.
- [ ] Verify one real read operation from each enabled vendor independently.
- [ ] Request a safe, reversible change against the authorized demo project.
- [ ] Review the exact proposal, risk, target, scope, and rollback plan.
- [ ] Deny the change and verify no side effect occurred.
- [ ] Approve the exact same (or separately re-presented) request and verify only that action occurs.
- [ ] Verify the resulting GitHub artifact and/or Cloudflare deployment independently.
- [ ] Verify audit history includes the complete sequence.
- [ ] Repeat the core read-only tool test in ChatGPT’s in-app browser, if ChatGPT Site Tools is a submission claim.
- [ ] Record a final walkthrough suitable for judges.
- [ ] Compare the Devpost description against evidence and remove any unsupported claim.

---

## 13. Canonical Real E2E Scenario

Use this scenario for the final recording and judge instructions. Record Snyk and Socket.dev as `PASS`, `BLOCKED`, or `FAIL` when they are included in public capability claims.

```text
1. Human opens `<VERCEL_PRODUCTION_URL>`.
2. Human authenticates and opens an authorized existing workspace/project.
3. The browser/ChatGPT discovers AmbiOS WebMCP tools.
4. Agent executes a real read-only context/incident/status tool.
5. AmbiOS displays real persisted workspace or incident data.
6. Agent inspects the relevant authorized GitHub repository and/or Cloudflare service state.
7. Agent proposes a specific, reversible hotfix, documentation update, deployment, or repository action.
8. Human reviews the exact target, arguments, risk, and rollback plan.
9. Human denies the first request; AmbiOS records the denial and no side effect occurs.
10. Human explicitly approves a new, exact request.
11. AmbiOS rechecks authorization, guardrails, and approval server-side.
12. AmbiOS performs the approved action against the authorized real project.
13. Human independently verifies the GitHub artifact and/or Cloudflare deployment/status.
14. AmbiOS records the final outcome in the audit trail.
```

### Required real artifacts

- [ ] One deployed WebMCP tool catalog screenshot from `<VERCEL_PRODUCTION_URL>`.
- [ ] One WebMCP Tool Activity screenshot showing an executed read-only tool.
- [ ] One persisted workspace/incident/activity view.
- [ ] One denied approval event with proof that no write occurred.
- [ ] One approved safe action with a real GitHub artifact and/or Cloudflare deployment/status artifact.
- [ ] One audit-log view linking the actor, proposal, decision, action, and result.
- [ ] One ChatGPT Site Tools recording if “tested with ChatGPT” is claimed.

---

## 14. ChatGPT Site Tools Gate

### Codex tasks

- [ ] Confirm the deployed app registers tools in the top-level page and does not depend solely on an iframe context.
- [ ] Confirm tool schemas/descriptions are concise and accurately describe consequences.
- [ ] Confirm handlers preserve server-side authentication/authorization and do not trust ChatGPT-supplied parameters.
- [ ] Confirm the app handles unsupported browsers/clients gracefully.

### Human tasks

- [ ] Use a supported ChatGPT desktop/in-app browser environment with Site Tools enabled.
- [ ] Navigate directly to `<VERCEL_PRODUCTION_URL>`.
- [ ] Confirm AmbiOS appears under available Site Tools.
- [ ] Ask ChatGPT to execute a read-only AmbiOS action, such as:

```text
Show my current AmbiOS organization and active incident context.
```

- [ ] Confirm the tool executes and its result is real.
- [ ] Confirm the resulting action appears in AmbiOS Tool Activity/audit history.
- [ ] If testing a write path, use only the authorized demo target and require the AmbiOS approval gate.
- [ ] Capture a recording of discovery, execution, and returned result.

### Shared pass condition

- [ ] Claim “tested with ChatGPT Site Tools” only after a deployed AmbiOS tool is both discovered and successfully executed from ChatGPT’s in-app browser.

---

## 15. Final Devpost Claim Review

### Current capabilities — claim only with evidence

- [ ] “WebMCP-native” only if deployed tools are discoverable and executable from a compatible client.
- [ ] “Real-time/shared workspace” only if the demonstrated state is persisted or genuinely synchronized as described.
- [ ] “Human approval” only if execution is server-side blocked before approval.
- [ ] “Audit trail” only if events persist and can be reviewed.
- [ ] “GitHub integration” only if a real authorized repository was used successfully.
- [ ] “Cloudflare integration” only if a real authorized service status/deployment was used successfully.
- [ ] “Tested in Chrome/Brave” only if tool discovery and execution were personally verified there.
- [ ] “Tested with ChatGPT” only if a real Site Tools execution occurred in ChatGPT.
- [ ] Claim `production-ready` only if no unresolved database, auth, security, or execution blocker remains; otherwise record `BLOCKED` or `FAIL`.

### Required public disclosures

- [ ] Any data marked demo, fixture, mock, sandbox, preview, or seeded is labeled clearly in the product and submission.
- [ ] Any vendor not connected in the deployed environment is labeled `not configured`.
- [ ] Any feature not executed against a real target is described as a roadmap item, not a completed capability.
- [ ] The judge instructions explain which actions are safe to test and which require an authorized demo account.
- [ ] The submission does not include or request unsafe shared production credentials.

---

## 16. Final Decision Record

### Mandatory PASS requirements

- [ ] `<VERCEL_PRODUCTION_URL>` loads publicly over HTTPS.
- [ ] The public repository is accessible, licensed, and aligned with the deployed build.
- [ ] WebMCP tools are visible in a compatible browser’s WebMCP inspector.
- [ ] At least one read-only tool executes against real authenticated and persisted AmbiOS data.
- [ ] Tool activity and audit records prove the execution path.
- [ ] Server-side authentication, organization scope, and authorization checks are enforced.
- [ ] A write-capable action is demonstrably blocked without explicit approval.
- [ ] A separately approved safe action produces a real, authorized project/vendor-side artifact if a write workflow is claimed.
- [ ] The final submission description truthfully distinguishes live, sandboxed, unconfigured, mocked, and planned capabilities.
- [ ] Codex has completed its factual assessment report.
- [ ] A human has independently completed the visual and vendor-side verification.

### Decision

```text
Decision: PASS / BLOCKED / FAIL

Deployed commit SHA:

Core WebMCP proof:

Real project used:

GitHub status: live / sandbox / unconfigured / mocked / unverified

Cloudflare status: live / sandbox / unconfigured / mocked / unverified

ChatGPT Site Tools status: tested / not tested / unavailable

Blocking failures:
- 

Known limitations disclosed publicly:
- 

Codex verification report location:

Human evidence package location:

Human sign-off:

Date/time:
```

---

## Appendix A: Evidence Naming

```text
01-live-url-loaded.png
02-webmcp-available-tools-production.png
03-webmcp-read-tool-activity.png
04-authenticated-workspace-persisted.png
05-real-incident-or-context.png
06-github-read-evidence.png
07-cloudflare-status-evidence.png
08-proposal-before-approval.png
09-approval-denied-no-side-effect.png
10-approval-approved.png
11-github-real-pr-or-commit.png
12-cloudflare-real-deployment-or-status.png
13-audit-trail-complete.png
14-chatgpt-site-tools-execution.mp4
15-codex-production-gate-report.md
```

---

## Appendix B: Immediate Fix List From Current Evidence

The local screenshot previously showed a message equivalent to:

```text
Workspace setup storage is unavailable. Configure the Cloudflare DB binding and apply the D1 schema.
```

Before a final PASS, resolve and verify all of the following:

- [ ] Configure the deployed D1 `DB` binding.
- [ ] Apply the D1 schema to the database used by the deployed environment.
- [ ] Verify workspace creation and incident/action persistence after refresh.
- [ ] Remove the blocking setup warning from the judge-facing path once the real binding is working.
- [ ] Re-run the WebMCP read-tool and audit-log tests after persistence is enabled.

---

## Appendix C: Do Not Pass Conditions

The assessment is automatically **FAIL** if any condition below is true:

- Tools are listed in DevTools but no deployed tool can execute successfully.
- A tool returns hardcoded/mock data while AmbiOS claims it comes from a real system.
- The deployment URL is unavailable, non-HTTPS, or fails in the judge environment.
- The workspace/D1 persistence layer is unavailable during the submitted demonstration.
- A user can bypass authorization, organization scope, guardrails, or explicit approval through a direct tool/API call.
- An action executes after denial or without valid server-side approval.
- A claimed GitHub or Cloudflare write operation has no independently verifiable external artifact.
- Credentials, secrets, tokens, or private keys are present in the public repository, browser bundle, screenshots, or logs.
- The Devpost text presents planned, mocked, or untested functionality as live.

---

**Final principle:** AmbiOS AI is credible because each claimed capability is verifiable: a compatible agent discovers it, a signed-in user is authorized for it, the backend enforces its policy, the human approves consequential changes, the real project records the result, and the complete sequence remains auditable.
