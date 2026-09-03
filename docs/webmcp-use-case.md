# WebMCP Use Case — AmbiOS AI

## Problem

AI agents reason well. They act poorly without oversight. Teams handling incidents and changes need to see what an agent does. They need to configure missing pieces. They need to approve or deny exact actions. They need to verify outcomes. They need an auditable record.

Chat fails here. It hides links between incidents, services, repos, deployments, proposals, approvals, executions, and verification. It treats words as permission.

## Why WebMCP fits

AmbiOS uses WebMCP to give browser agents structured access to workspace context. No secrets leak. No policy gets bypassed. Chat does not become authority.

WebMCP works for this use case because:

- Context lives in the browser session. The agent needs the workspace, incident, systems, mappings, and action state the user sees. WebMCP exposes this as tools. No screen scraping. No ad-hoc DOM hacks.

- Authority stays server-side. WebMCP tools call the AmbiOS backend for policy, approval, execution, verification, and audit. The agent gets context and status. Not credentials. Not unrestricted writes.

- Human and agent share one workspace. The user inspects the same incidents, proposals, approvals, runs, and audit events the agent reasons over. WebMCP keeps the agent in sync with live operational state.

- Governed workflows show up. When an action waits on a prerequisite, approval, execution, or verification, the agent discovers that state through tools. The canvas and audit surfaces show the same lifecycle.

- No fake autonomy. WebMCP does not turn the browser into an uncontrolled automation host. It exposes a bounded capability surface matching what the user can do in that workspace.

## Primary use case: governed safe-change workflow

AmbiOS serves teams resolving real incidents and changes. The flow looks like this:

1. User opens AmbiOS in the browser. User selects an authorized workspace.
2. Compatible browser agent discovers AmbiOS WebMCP tools. Agent reads current workspace context.
3. Agent inspects active incidents, linked systems, provider connections, and mapped resources.
4. Agent spots missing prerequisites. Example: unmapped deployment target. Agent proposes configuration.
5. User configures the required mapping. AmbiOS verifies with a safe read-only check.
6. Agent resumes from stored context. Agent creates a structured change or deployment proposal.
7. AmbiOS evaluates policy. System shows risk, target, evidence, and verification plan.
8. User denies the action once. System records DENIED. No external write occurs.
9. User approves the exact action. Approval is server-bound, expiring, and single-use.
10. AmbiOS executes the approved action through an authorized provider adapter.
11. AmbiOS verifies the outcome. Example: PR exists. Deployment succeeded. Health check passed.
12. Runs, Console, Canvas, and incident detail show the same persisted lifecycle state and audit trail.

WebMCP enables steps 2 to 4 and 6 to 7. It gives the agent structured access to workspace context, incident details, system relationships, capability scope, resource mappings, proposal status, and policy evaluation. It does not replace backend authority for steps 5 and 8 to 12.

## Why not plain chat or generic tool calling

A generic chat interface or arbitrary tool layer forces AmbiOS to:

- Rebuild workspace context from conversation text.
- Risk agents acting on stale or incomplete information.
- Treat messages like "yes" or "do it" as authorization.
- Hide links between incidents, systems, proposals, approvals, and executions.

WebMCP avoids these problems by:

- Providing structured, schema-validated tools for context, proposal, policy, approval status, and verification.
- Keeping all consequential authority in the backend.
- Making the agent's reasoning visible in the same workspace where the user approves actions and inspects audit.

## Secondary use cases

The same pattern applies to other AmbiOS workspaces:

- Personal data rights. Agent inspects data-subject requests, linked systems, and evidence. Agent proposes deletion or export. Approval required. Outcome verified. Process audited.

- Business operations. Agent reviews orders, tickets, or analytics. Agent proposes workflow changes. Approval required. Authorized actions execute. Verification and audit follow.

- Workflow debugging. Agent inspects runs, tool activity, and blocked actions. Agent proposes configuration fixes. Approval required. Workflows resume. Verification and audit follow.

WebMCP gives the agent structured context. AmbiOS retains governed authority over proposals, approvals, executions, verification, and audit.

## Evidence of fit

AmbiOS demonstrates WebMCP fit by:

- Registering a real tool suite in a deployed HTTPS app.
- Using those tools in an end-to-end governed workflow with real incidents, proposals, approvals, executions, and verification.
- Showing the same canonical state in Agent, Tools, Runs, Console, and Canvas.
- Proving denial prevents external writes. Proving approval is exact-scope, server-bound, and expiring.

This is not a feature tour. It proves WebMCP is the right mechanism for giving browser agents structured context in a human-governed operational system.

---

# Test Cases

## Test Case 1 — Inspect workspace readiness and context

**Scenario:** Verify that a compatible browser agent discovers AmbiOS WebMCP tools and reads current workspace context, including readiness state, organization, workspace, and active incidents.

**User prompt:**

Check my AmbiOS workspace readiness and show me what incidents are active.

**Tool triggered:**

get_workspace_readiness
get_current_workspace_context
list_active_incidents

**Expected output:**

The MCP server returns structured results containing:

- Workspace readiness status (ready, needs_setup, blocked) with details on authentication, persistence, provider connections, and resource mappings.
- Current organization and workspace identifiers.
- List of active incidents with IDs, titles, severity, and state.
- No raw credentials, secrets, or direct vendor API responses.
- Tool invocation recorded in Runs and Console audit timeline.

The agent explains the workspace state. It identifies missing prerequisites. It exposes no sensitive data.

---

## Test Case 2 — Inspect incident context and system relationships

**Scenario:** Verify that the agent reads detailed incident context, linked systems, provider connections, and resource mappings for a specific incident.

**User prompt:**

Show me the details for incident INC-001 and what systems are linked to it.

**Tool triggered:**

get_incident_context
get_system_relationships
list_mapped_resources

**Expected output:**

The MCP server returns structured results containing:

- Incident details: ID, title, description, severity, state, owner, timestamps.
- Linked systems and services with their current status.
- Provider connections relevant to the incident (GitHub, Cloudflare) with capability scope.
- Mapped resources (repository to deployment target) with relationship types and verification state.
- Any blocked actions or missing prerequisites associated with the incident.
- No raw vendor credentials or unrestricted API access.

The agent explains the incident context. It identifies what is configured. It detects what is missing.

---

## Test Case 3 — Create and evaluate a structured proposal

**Scenario:** Verify that the agent creates a structured change proposal and retrieves policy evaluation for a specific incident or system.

**User prompt:**

Create a proposal to map the Cloudflare preview target for incident INC-001 and evaluate the policy.

**Tool triggered:**

create_structured_proposal
get_policy_evaluation

**Expected output:**

The MCP server returns structured results containing:

- Proposal ID, title, description, and target action (Map Cloudflare preview target).
- Risk classification (low, medium, high).
- Required approvals and policy requirements.
- Policy evaluation result: allowed, blocked, or requires_approval with reasons.
- Evidence references (linked systems, resource mappings).
- Verification plan for after execution.
- No automatic execution of the proposed action.

The agent explains the proposal, its risk, and what approval is required before any action proceeds.

---

## Test Case 4 — Request and check approval status for an action

**Scenario:** Verify that the agent requests exact action approval and checks approval status without executing the action.

**User prompt:**

Request approval for proposal PROP-001 and check if it has been approved.

**Tool triggered:**

request_exact_action_approval
get_approval_status

**Expected output:**

The MCP server returns structured results containing:

- Approval request ID linked to the proposal and action.
- Approval state: awaiting_approval, approved, denied, or expired.
- Approver identity (if approved or denied).
- Approval expiry timestamp.
- Exact capability, target resources, and arguments hash bound to the approval.
- No execution of the action based solely on approval status.

The agent explains that approval is pending, approved, or denied. It explains that execution requires a separate authorized step.

---

## Test Case 5 — Inspect action/run state and audit timeline

**Scenario:** Verify that the agent inspects the state of an action or run and retrieves the audit timeline for an incident or workspace.

**User prompt:**

Show me the status of action ACT-001 and the audit timeline for incident INC-001.

**Tool triggered:**

inspect_action_or_run
get_audit_timeline
get_verification_result

**Expected output:**

The MCP server returns structured results containing:

- Action/run state: draft, context_gathered, blocked_missing_prerequisite, proposed, policy_evaluated, awaiting_approval, approved, queued, executing, verifying, succeeded, failed, denied, cancelled, or expired.
- Target resource details and provider reference.
- Verification status: pending, passed, failed, or not_applicable.
- Audit timeline entries: timestamps, actor, event type, safe summaries, and links to related records.
- No secrets, raw credentials, or sensitive payloads.

The agent explains the action lifecycle. It explains what happened. It explains what is pending. It explains what the audit record shows.

---

# Test case coverage summary

| Test Case | Primary Use Case | Secondary Use Case Coverage |
|---|---|---|
| 1 | Workspace readiness and context | All use cases require readiness and context |
| 2 | Incident context and system relationships | Incident response, workflow debugging |
| 3 | Structured proposal and policy | Safe-change, data rights, business ops |
| 4 | Approval request and status | All governed workflows |
| 5 | Action/run state and audit | All workflows requiring verification and audit |

These five test cases cover the major use cases: workspace onboarding, incident inspection, proposal creation, approval governance, and audit and verification. Each test case uses real WebMCP tools backed by canonical AmbiOS backend state. Each produces structured, safe output suitable for a browser agent.