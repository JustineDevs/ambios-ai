# AmbiOS AI Production Demo Walkthrough

## Purpose

This script presents the AmbiOS AI production workspace as it exists during review. It demonstrates workspace-scoped context, WebMCP visibility, incident relationships, governed action boundaries, and provider status. It does not claim provider execution where execution evidence is unavailable.

## Opening

Open [https://ambios-ai.vercel.app](https://ambios-ai.vercel.app), sign in with the authorized reviewer account, and select the current production workspace. Introduce AmbiOS AI as a governed operations workspace that brings operational context, incidents, integrations, proposals, approvals, and audit evidence together while keeping consequential actions under explicit human control.

## Scene 1 — Workspace and agent surface

Open **Agent** and point out the current environment and workspace scope, the operations copilot surface, the guardrail statement that actions are verified per action, the provider setup cards, and the message composer. When the agent service is available, use this read-only request: “Inspect my current AmbiOS workspace readiness and summarize the available capabilities and setup requirements. Do not create a proposal or execute an action.” The response should remain limited to the authorized workspace. Do not enter provider credentials, API keys, OAuth codes, or private account secrets into the application or the demo transcript. If the OpenAI account has no remaining API credits, state that agent chat execution is unavailable for this run and continue with the persisted workspace and governance surfaces; do not present an error state as a successful answer.

## Scene 2 — WebMCP capability registry

Open **Tools** and show the mounted WebMCP contract list. Explain that registry presence demonstrates capability discovery, not proof that every provider action is executable. Highlight the read-only workspace tools `get_workspace_readiness`, `get_current_workspace_context`, `ambios.list_incidents`, `ambios.incident.get_incident_context`, and `ambios.integrations.get_status`. Point out that write-capable operations are governed separately and require explicit approval, so the registry is not an unrestricted execution surface.

## Scene 3 — Provider status

Open **Plugins** and read the displayed status for each provider. OpenAI, Cloudflare, and GitHub should be described as Connected, verified when that status is visible. Vercel and Shopify should be described as Not configured unless their connections have completed verification, while Netlify, Snyk, Socket.dev, and roadmap providers should be described as Unsupported when they are shown as locked. Explain that Connected, verified means a safe read-only verification has completed; it does not mean that every possible provider action is enabled. Unsupported and unconfigured providers remain clearly labelled.

## Scene 4 — Incident context

Open **Incidents** and select the reviewer-safe incident `INC-204`, titled `[REVIEWER FIXTURE] Checkout latency drill`, for service `checkout-api`, with high severity and in-progress status. Review the incident summary and recorded context, then follow the incident detail tabs to show that overview, evidence, actions, and canvas are separate views. Emphasize that persisted incident context is not the same as external vendor evidence.

## Scene 5 — Operational Canvas

Open the incident’s **Canvas** view and show that the canvas is persisted, read-only, workspace-scoped, and labelled with its source and incident state. Point out linked entities only when they are visible in the current projection. If live collaboration is unavailable, state that persisted graph data remains visible and that no live collaboration result is being implied.

## Scene 6 — Governed action boundary

Return to the incident’s **Actions** tab and show the context-aware hot-fix proposal form. Explain that AmbiOS first reads incident context, prepares a structured proposal, evaluates policy, target, risk, and expected effect, requires explicit approval for consequential execution, records a denial without a provider write when an action is rejected, rechecks scope and approval before supported execution, and independently verifies and audits the result. For a read-only demo, do not submit or approve the proposal. A proposal is not an execution, and an approval control should not be used merely to make the demo appear complete.

## Scene 7 — Durable state

Open **Approvals**, **Deployment**, **Runs**, and **Console** as available, and confirm that each surface uses truthful persisted state. An empty approval queue means there is no pending approval, an empty deployment page means no deployment action is recorded, runs and console entries distinguish observations from proposals, approvals, execution, and verification, and the canvas and incident detail remain consistent with the same workspace.

## Closing

Close with this summary: “AmbiOS AI provides a workspace-scoped operations view with visible WebMCP capabilities, verified provider status, persisted incident context, a read-only operational canvas, and explicit governance boundaries. Supported provider execution is shown only when the required credentials, mappings, approval, and verification evidence are present. Unconfigured, unsupported, and credit-limited paths remain labelled rather than being presented as successful operations.”

## Current limitations to disclose

Agent-generated chat responses require an OpenAI account with available API credits. The reviewer fixture is persisted demo context and should not be described as a live production incident from an external provider. Canvas live collaboration may be unavailable while the persisted projection remains readable. Vercel and Shopify remain unconfigured until their connections complete safe read-only verification. No provider write or deployment should be claimed without corresponding persisted execution and independent verification evidence.
