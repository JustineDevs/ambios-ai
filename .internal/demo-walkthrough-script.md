# AmbiOS AI Production Demo Walkthrough

## Purpose

This script presents the AmbiOS AI production workspace as it exists during
review. It demonstrates workspace-scoped context, WebMCP visibility, incident
relationships, governed action boundaries, and provider status. It does not
claim provider execution where execution evidence is unavailable.

## Opening

Open [https://ambios-ai.vercel.app](https://ambios-ai.vercel.app) and sign in
with the authorized reviewer account. Select the current production workspace.

Introduce AmbiOS AI as a governed operations workspace: it brings operational
context, incidents, integrations, proposals, approvals, and audit evidence
together while keeping consequential actions under explicit human control.

## Scene 1 — Workspace and agent surface

Open **Agent**.

Point out:

- the current environment and workspace scope;
- the operations copilot surface;
- the guardrail statement that actions are verified per action;
- the available provider setup cards and the message composer.

Use a read-only request when the agent service is available:

> Inspect my current AmbiOS workspace readiness and summarize the available
> capabilities and setup requirements. Do not create a proposal or execute an
> action.

The response should remain limited to the authorized workspace. Do not enter
provider credentials, API keys, OAuth codes, or private account secrets into the
application or the demo transcript.

If the OpenAI account has no remaining API credits, state that the agent chat
execution is unavailable for this run. Continue with the persisted workspace
and governance surfaces; do not present an error state as a successful answer.

## Scene 2 — WebMCP capability registry

Open **Tools**.

Show the mounted WebMCP contract list and explain that registry presence is
capability discovery, not proof that every provider action is executable.

Highlight the read-only workspace tools:

- `get_workspace_readiness`
- `get_current_workspace_context`
- `ambios.list_incidents`
- `ambios.incident.get_incident_context`
- `ambios.integrations.get_status`

Also point out that write-capable operations are governed separately and
require explicit approval. The tool registry should not be described as an
unrestricted execution surface.

## Scene 3 — Provider status

Open **Plugins**.

Read the displayed status for each provider:

- OpenAI: Connected, verified.
- Cloudflare: Connected, verified.
- GitHub: Connected, verified.
- Vercel: Not configured unless a verified connection is present.
- Shopify: Not configured unless a verified connection is present.
- Netlify, Snyk, Socket.dev, and roadmap providers: Unsupported when shown as
  locked.

Explain that “Connected, verified” means a safe read-only verification has
completed. It does not mean that every possible provider action is enabled.
Unsupported and unconfigured providers remain clearly labelled.

## Scene 4 — Incident context

Open **Incidents** and select the reviewer-safe incident:

- ID: `INC-204`
- Title: `[REVIEWER FIXTURE] Checkout latency drill`
- Service: `checkout-api`
- Severity: high
- Status: in progress

Review the incident summary and recorded context. Follow the incident detail
tabs to show that overview, evidence, actions, and canvas are separate views.
Emphasize that persisted incident context is not the same as external vendor
evidence.

## Scene 5 — Operational Canvas

Open the incident’s **Canvas** view.

Show that the canvas is:

- persisted;
- read-only;
- workspace-scoped;
- labelled with its source and incident state.

Point out linked entities only when they are visible in the current projection.
If live collaboration is unavailable, state that persisted graph data remains
visible and that no live collaboration result is being implied.

## Scene 6 — Governed action boundary

Return to the incident’s **Actions** tab.

Show the context-aware hot-fix proposal form and explain the sequence:

1. Read the incident context.
2. Prepare a structured proposal.
3. Evaluate policy, target, risk, and expected effect.
4. Require explicit approval for consequential execution.
5. Record denial without a provider write when the action is rejected.
6. Recheck scope and approval before any supported execution.
7. Verify the outcome independently and record the audit evidence.

For a read-only demo, do not submit or approve the proposal. A proposal is not
an execution, and an approval control should not be used merely to make the
demo appear complete.

## Scene 7 — Durable state

Open **Approvals**, **Deployment**, **Runs**, and **Console** as available.

Confirm that each surface uses truthful persisted state:

- an empty approval queue means there is no pending approval;
- an empty deployment page means no deployment action is recorded;
- runs and console entries distinguish observations, proposals, approvals,
  execution, and verification;
- the canvas and incident detail remain consistent with the same workspace.

## Closing

Close with the following summary:

> AmbiOS AI provides a workspace-scoped operations view with visible WebMCP
> capabilities, verified provider status, persisted incident context, a
> read-only operational canvas, and explicit governance boundaries. Supported
> provider execution is shown only when the required credentials, mappings,
> approval, and verification evidence are present. Unconfigured, unsupported,
> and credit-limited paths remain labelled rather than being presented as
> successful operations.

## Current limitations to disclose

- Agent-generated chat responses require an OpenAI account with available API
  credits.
- The reviewer fixture is persisted demo context and should not be described as
  a live production incident from an external provider.
- Canvas live collaboration may be unavailable while the persisted projection
  remains readable.
- Vercel and Shopify remain unconfigured until their connections complete safe
  read-only verification.
- No provider write or deployment should be claimed without corresponding
  persisted execution and independent verification evidence.
