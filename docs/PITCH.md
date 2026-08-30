# AmbiOS AI – Pitch Deck and AMA Package

## Pitch Context

**Company:** AmbiOS AI  
**Tagline:** The WebMCP workspace where humans approve and agents act.  
**Stage:** Hackathon MVP, pre-revenue  
**Primary audience:** WebMCP Challenge judges, early design partners, developer-tool investors, platform teams  
**Primary URL:** https://ambios-ai.pages.dev  
**Future domain:** https://ambios.ai  

## Narrative Spine

Teams run critical work across disconnected dashboards, APIs, docs, and SaaS tools. AI agents promise help, but many agents still rely on brittle browser clicks, unclear permissions, and invisible actions. AmbiOS gives people and agents one shared workspace with structured WebMCP capabilities, policy checks, approvals, and audit history. The MVP shows an agent investigating an incident, proposing a hot-fix, passing guardrails, receiving human approval, applying the action, and proposing a documentation update.

## Deck Design Rules

- Use one message per slide
- Keep slide copy between 10 and 20 words
- Use 30pt or larger text
- Use high contrast, neutral interface colors, and one accent color for status
- Use product screenshots for the demo slides
- Use a single metric or proof point per slide
- Keep each slide under one minute
- Avoid made-up market size, customer, revenue, and growth claims

---

# Pitch Deck

## Slide 1. Cover

### Title

AmbiOS AI

### Subtitle

The WebMCP workspace where humans approve and agents act.

### Visual

A clean product mockup with three linked panels:

- Incident context
- Agent action plan
- Human approval and audit trail

### Slide Copy

Human intent. Agent execution. Shared control.

### Speaker Notes

Time: 30 seconds.

AmbiOS AI is a WebMCP-native workspace for human and agent collaboration. We start with a painful, high-stakes workflow. An incident occurs, an agent investigates the system, proposes a fix, and a human stays in control of the decision.

Transition: The problem is not that teams lack tools. The problem is that their tools and agents do not share a safe operating model.

---

## Slide 2. Problem

### Title

AI Agents Still Lack a Safe Operating Surface

### Visual

A fragmented flow diagram:

Alerts → dashboard → docs → deploy tool → chat → spreadsheet

Show a human switching between systems. Show an agent blocked by unstructured pages and unclear permissions.

### Slide Copy

Fragmented tools. Fragile automation. Missing accountability.

### Speaker Notes

Time: 60 seconds.

Engineering and operations teams work across many disconnected systems. They check alerts in one place, inspect code in another, read runbooks in a third, deploy through a fourth, and explain decisions in chat.

AI agents add a new problem. An agent may find a page and click through it, but teams need to know what the agent saw, what it plans to change, who approved it, and how to roll it back. Existing dashboards were built for people. Existing automation was built for scripts. Neither gives humans and agents a shared operating surface.

Transition: The cost is slow response, hidden risk, and work that does not stay documented.

---

## Slide 3. Problem Impact

### Title

Every Critical Change Needs Context and Accountability

### Visual

A timeline with failure points:

Incident detected → context missing → unclear owner → risky change → undocumented result

### Slide Copy

Without shared context, agents add speed and risk.

### Speaker Notes

Time: 60 seconds.

A fast agent is not enough. A safe agent needs structured context, explicit boundaries, and a human approval path.

When an incident happens, teams need to connect the alert with service state, recent deploys, budgets, runbooks, and documents. If those pieces are disconnected, the agent has incomplete context. If the change is not recorded, the team cannot learn from it. If approval is unclear, teams cannot trust it.

AmbiOS treats the full change flow as one product workflow.

Transition: WebMCP gives the web the missing primitive for this workflow.

---

## Slide 4. Solution

### Title

AmbiOS Turns Websites Into Shared Agent Workspaces

### Visual

Product architecture diagram:

Human UI + ChatGPT agent → WebMCP tools → AmbiOS policy and audit layer → services and integrations

### Slide Copy

Inspect. Simulate. Propose. Approve. Apply. Verify.

### Speaker Notes

Time: 60 seconds.

AmbiOS is a WebMCP-powered workspace. It exposes clear capabilities to agents through the browser, while people use the same underlying system through the UI.

An agent does not guess through a complex interface. It calls structured AmbiOS tools. Before a sensitive action runs, AmbiOS checks policy, risk, approval, budget, and rollback readiness. The user reviews the plan. After approval, the agent executes only what was approved. AmbiOS records the full action history.

Transition: The MVP focuses this model on incident response and safe system changes.

---

## Slide 5. Product

### Title

From Incident to Verified Hot-Fix in One Workspace

### Visual

A four-frame product walkthrough:

1. Incident detail and service context
2. Agent hot-fix suggestions
3. Guardrail and approval panel
4. Activity Console and doc proposal

### Slide Copy

One workflow. One source of truth. One approval path.

### Speaker Notes

Time: 60 seconds.

This is the AmbiOS MVP workflow.

First, a user opens an incident. The agent retrieves structured context, including service state, recent deploys, alerts, and related documentation. Next, the agent proposes a rollback or config change. AmbiOS evaluates guardrails and budget. The human approves the selected action. AmbiOS applies the change, validates the result, records the action, and creates a documentation proposal for review.

This is human and agent collaboration on the same real state.

Transition: WebMCP makes this interaction reliable in a browser-native experience.

---

## Slide 6. Why WebMCP

### Title

WebMCP Replaces Guessing With Structured Capabilities

### Visual

Side-by-side comparison:

DOM automation: click, scrape, hope

WebMCP: inspect, query, propose, approve, execute

### Slide Copy

Agents use tools. Humans keep authority.

### Speaker Notes

Time: 60 seconds.

WebMCP allows a website to expose structured tools to an agent. This matters because the agent receives clear inputs, outputs, and action boundaries. Instead of scraping a dashboard or clicking through a UI, the agent calls a named capability such as `ambios.incident.get_incident_context` or `ambios.guardrails.evaluate_guardrails`.

AmbiOS adds the missing product layer around those tools. It provides identity, policies, activity history, shared context, approval flows, budgets, and integrations.

Transition: The result is a repeatable pattern for more than incident response.

---

## Slide 7. Initial Use Case

### Title

Safe Change Management Starts With Incident Response

### Visual

A user journey:

Alert → Context → Proposal → Approval → Hot-fix → Verification → Documentation

### Slide Copy

Fast response without silent automation.

### Speaker Notes

Time: 45 seconds.

Incident response is our starting point because the problem is urgent, measurable, and easy to demonstrate. Teams need speed during an outage, but they also need control. AmbiOS helps an agent investigate structured state and prepare a remediation plan. The incident commander retains authority over high-impact actions.

The same model later supports deploys, data syncs, workflow debugging, privacy requests, and e-commerce operations.

Transition: We built the MVP as an operational product, not a static prototype.

---

## Slide 8. MVP Proof

### Title

A Live WebMCP App Judges Can Test Today

### Visual

Screenshot of live AmbiOS workspace with a visible URL.

### Slide Copy

Live URL. Real tools. Shared agent and human state.

### Speaker Notes

Time: 60 seconds.

AmbiOS is designed for direct evaluation in ChatGPT's in-app browser or Google Chrome with WebMCP enabled. Judges open the live app, inspect the workspace, ask the agent about an active incident, request hot-fix options, review guardrails, approve a change, and inspect the shared activity trail.

The MVP includes a capability registry, workspace canvas, incident workflow, guardrails, budgets, documentation proposals, activity console, and an external integration path.

Only claim this slide after the live URL and tested workflow are ready.

Transition: The platform is designed to connect to the tools teams already use.

---

## Slide 9. Platform Architecture

### Title

Built for Real Services and Connected Systems

### Visual

Architecture diagram:

Next.js + WebMCP

Cloudflare Pages and Workers

D1, KV, R2, Queues, Durable Objects, Analytics Engine

Supabase Auth, Postgres, Realtime, Storage

Nango integration layer

External platforms: OpenAI, Cloudflare, Vercel, Netlify, Shopify, GitHub, Notion, Jira, Google services

### Slide Copy

A control plane for agent actions across the web.

### Speaker Notes

Time: 60 seconds.

AmbiOS uses a deliberate platform architecture. The frontend runs in Next.js with WebMCP registration. Cloudflare provides Pages, Workers, D1, KV, R2, Queues, Durable Objects, Cron Triggers, and Analytics Engine. Supabase provides Google OAuth, Postgres, realtime updates, and storage. Nango provides a unified integration layer.

The architecture separates user identity, agent capabilities, external connectors, audit records, and asynchronous work. This gives the product a clear path from a hackathon MVP to a multi-provider platform.

Transition: We are not replacing the tools teams use. We coordinate how humans and agents use them together.

---

## Slide 10. Competitive Position

### Title

AmbiOS Connects Control, Context, and Execution

### Visual

A 2x2 matrix:

X axis: Agent action depth
Y axis: Human control and auditability

Place:

- Chat interfaces: high interaction, low execution control
- Traditional automation: high execution, low human collaboration
- Observability tools: high visibility, lower agent-native execution
- AmbiOS: high agent action depth, high human control and auditability

### Slide Copy

Agents act inside guardrails. Every action stays visible.

### Speaker Notes

Time: 60 seconds.

AmbiOS is positioned between three existing categories. Chat tools help people ask questions. Automation tools run tasks. Observability tools show system state.

AmbiOS combines structured agent actions with human approval, shared context, and auditability. We do not ask teams to replace their hosting, observability, documentation, or e-commerce tools. We give those systems a shared, agent-native control plane.

Transition: Our business model follows the value of controlled agent operations.

---

## Slide 11. Business Model

### Title

Land With Teams. Expand Through Connected Workflows.

### Visual

Three plan cards:

- Free developer sandbox
- Team workspace
- Enterprise control plane

### Slide Copy

Usage-based platform plans with governance upgrades.

### Speaker Notes

Time: 45 seconds.

The initial model is SaaS. A free developer sandbox drives adoption and WebMCP experimentation. Team plans add shared workspaces, integrations, activity history, and expanded action limits. Enterprise plans add advanced policies, audit exports, self-hosting or data controls, support, and governance features.

Pricing is not finalized in the MVP. Do not present revenue claims before validation. The product value increases as teams add services, agents, workflows, and integrations.

Transition: We start with developers and operators who already feel the pain.

---

## Slide 12. Go-To-Market

### Title

Start With Developer Teams Managing Agent Workflows

### Visual

A three-step funnel:

WebMCP builders → developer teams → platform and enterprise teams

### Slide Copy

Open-source proof. Design partners. Integration-led expansion.

### Speaker Notes

Time: 45 seconds.

The first users are developers, founders, platform engineers, and operators experimenting with agents. We reach them through the WebMCP community, open-source examples, technical content, hackathons, and direct conversations with design partners.

The first wedge is the Safe Change Workspace. Expansion follows through integrations, team seats, audit needs, more services, and new workspace types such as workflow debugging or data rights operations.

Transition: The product roadmap follows the same shared-control foundation.

---

## Slide 13. Roadmap

### Title

One Core Pattern. Many High-Value Workspaces.

### Visual

Roadmap columns:

Now: Safe Change Workspace, Incident Room, Agent Activity Console

Next: Permission Simulator, Workflow Debugger, Cloud and GitHub controllers

Later: Data Rights Center, Evidence Workspace, Accessibility Layer, Contract and Research Workspaces

### Slide Copy

Build the control plane once. Expand by workflow.

### Speaker Notes

Time: 60 seconds.

The core pattern is stable. A human sets intent and boundaries. An agent works with structured capabilities. AmbiOS evaluates risk and approval rules. The system records every action.

We start with safe changes and incident response. Next, we expand to permission simulation, workflow debugging, cloud controllers, and deeper integrations. Later, the same operating model supports data rights, evidence work, accessibility, contracts, research, and learning.

Transition: We are looking for people who want to test and shape this platform.

---

## Slide 14. The Ask

### Title

Help Us Validate the Agent-Native Control Plane

### Visual

Two tracks:

For judges: test the live WebMCP workflow

For design partners: bring one high-value workflow

### Slide Copy

Test AmbiOS. Share feedback. Become a design partner.

### Speaker Notes

Time: 45 seconds.

For the WebMCP Challenge, we ask judges to test the live workflow in ChatGPT's in-app browser or Chrome with WebMCP enabled. Inspect the incident, ask the agent for a hot-fix, review the guardrails, approve the change, and inspect the audit trail.

For teams, we are looking for design partners with a real change-management, incident, deployment, or workflow-debugging problem. Bring one workflow. We will map it to AmbiOS and test the shared-control model.

---

## Slide 15. Close

### Title

The Open Web Needs Shared Agent Control

### Visual

AmbiOS logo, live URL, QR code, and three actions:

Open

Test

Talk

### Slide Copy

AmbiOS AI. Human intent. Agent execution. Shared control.

### Speaker Notes

Time: 30 seconds.

AmbiOS makes agent actions structured, visible, and safe on the open web. Open the live URL. Test the WebMCP tools. Tell us which workflow your team needs to control next.

Live app: https://ambios-ai.pages.dev  
Future home: https://ambios.ai

---

# Demo Script

## Demo Goal

Show a complete human-and-agent collaboration loop in under 3 minutes.

## Demo Setup

Prepare before recording or presenting:

- Seeded organization and demo service named `api-prod`
- Open incident with visible severity and recent deploy data
- Agent enabled and allowed to use incident tools
- Guardrail requiring human approval for production changes
- Budget with enough remaining balance for the demo action
- At least one service document ready for a proposed update
- Activity Console open in a second tab or panel
- WebMCP-capable browser environment tested

## Demo Steps

1. Open the Main Workspace Canvas.
   - Say: “This is AmbiOS. The workspace shows the active service, incident, recent changes, and the agent assigned to this workflow.”

2. Open the incident.
   - Say: “The API service has elevated error rate after a recent deployment.”

3. Ask the agent: “Inspect this incident and suggest safe hot-fixes.”
   - Show `ambios.incident.get_incident_context`.
   - Show `ambios.incident.suggest_hotfixes`.

4. Review agent suggestions.
   - Say: “The agent sees recent deploy history, alerts, and linked documentation. It proposes a rollback and a configuration change.”

5. Select the rollback proposal.
   - Say: “Before any write action, AmbiOS evaluates the guardrails and budget.”

6. Show guardrail output.
   - Show risk score, required approval, rollback availability, estimated cost.
   - Say: “The system requires a human approval because this affects production.”

7. Approve the action.
   - Say: “The human owns the decision. The agent only executes the approved plan.”

8. Apply the hot-fix.
   - Show `ambios.incident.apply_hotfix`.
   - Show status changed to mitigated or resolved.

9. Open Agent Activity Console.
   - Say: “Every step is recorded. We see the actor, input, policy decision, approval, execution result, and timestamp.”

10. Open documentation proposal.
    - Say: “After the change, the agent proposes an update to the deployment guide. A human reviews before publishing.”

11. Close.
    - Say: “This is the AmbiOS pattern. Humans set intent and authority. Agents operate through structured WebMCP capabilities. The system keeps the full history.”

---

# AMA Script

## Session Format

**Target length:** 30 to 45 minutes  
**Audience:** Developers, product builders, platform engineers, operators, founders, and WebMCP community members  
**Goal:** Explain why AmbiOS exists, show the product, gather feedback, and recruit design partners.

## Opening, 90 seconds

“Hey everyone. I am PC Gaming18, building AmbiOS AI.

AmbiOS is a WebMCP-native workspace where people and AI agents work on the same systems with shared context, approval rules, and a visible action history.

I started from a practical question. AI agents are getting better at taking actions, but how do we keep those actions clear, safe, and accountable when they affect real services, data, budgets, and customers?

Today I will cover three things. First, why existing dashboards and automation do not solve the agent-control problem. Second, how AmbiOS uses WebMCP for safe human-and-agent collaboration. Third, where we are taking the platform next.

Ask questions throughout. I want the hard questions, especially from people building agent tools, running production systems, or working with sensitive data.”

## Topic 1, 3 minutes

### Why agent work needs a shared control layer

“Most teams already have tools for alerts, deployments, documentation, tickets, budgets, and integrations. The issue is not a missing dashboard. The issue is that humans and agents work through different surfaces.

A person sees menus, charts, and buttons. An agent often sees unstructured pages, screenshots, or custom scripts. This creates weak accountability. A team needs to know what the agent read, what action it proposed, what policy applied, who approved it, and what happened next.

We want agents to help with high-value work. Incident response is a good example. During an incident, speed matters. Context also matters. A bad change made quickly still creates damage.

AmbiOS provides a shared control layer. The agent gets named, structured capabilities. The human gets context, approval, and auditability. Both work on the same state.

The key idea is simple. Human intent. Agent execution. Shared control.”

### Transition

“Next, I will show how WebMCP makes this browser-native instead of relying on fragile UI automation.”

## Topic 2, 3 minutes

### How WebMCP changes the product model

“WebMCP lets a web app expose structured tools to an agent. In AmbiOS, those tools use the `ambios.*` namespace.

An agent does not need to guess where a button is located. It calls a tool such as `ambios.incident.get_incident_context`. The tool returns structured information. Then the agent calls `ambios.incident.suggest_hotfixes`. Before a write action, it calls `ambios.guardrails.evaluate_guardrails` and `ambios.payments.check_budget`.

If approval is required, the system stops. The human sees the proposal, risk, scope, cost, and rollback path. After approval, the agent runs the approved action. AmbiOS logs each step in the Agent Activity Console.

This creates a useful workflow for people. The human does not need to navigate five separate systems. The agent does not get silent authority. Both see the decision path.

Our hackathon demo starts with a context-aware hot-fix. The same pattern supports deploys, workflow debugging, data syncs, privacy requests, and other operations.”

### Transition

“Now I want to explain why this starts as a developer and operations product, but does not end there.”

## Topic 3, 3 minutes

### Where AmbiOS goes next

“AmbiOS starts with safe change management because it is a clear, high-stakes workflow. The roadmap is broader.

We are building toward a Safe Change Workspace where humans set intent and agents inspect, simulate, propose, apply, and roll back changes. We also plan an Agent Permission Simulator, where teams test agent workflows against policies before production use.

Other workspace types follow the same model. A Personal Data Rights Center lets users direct agents to export, revoke, or delete data across connected services. An Evidence and Claim Workspace lets people build arguments while agents organize sources, contradictions, and provenance. An Accessibility Action Layer lets people state goals instead of fighting complex interfaces.

The common foundation stays the same. Structured capabilities. Shared state. Clear approvals. Full audit history.

The goal is not to replace every SaaS tool. The goal is to make the open web ready for human-and-agent collaboration.”

## Live Demo Transition, 30 seconds

“Let me show the core workflow. We will inspect an incident, ask the agent for a hot-fix, review guardrails, approve the change, and inspect the audit trail.”

Use the Demo Script above.

## Audience Engagement Prompts

Use these prompts during the AMA:

- “What is the riskiest action you would allow an agent to take today?”
- “Where do your teams lose context during incidents or deploys?”
- “Would you trust an agent more if every action had an approval path and rollback plan?”
- “Which system would you connect first: GitHub, Cloudflare, Vercel, Shopify, Notion, Jira, or something else?”
- “What should an agent never do without a human approval in your environment?”

## Call to Action, 60 seconds

“Thanks for the questions.

If you build with WebMCP, open AmbiOS in ChatGPT's in-app browser or Chrome with WebMCP enabled and test the workflow. If you run a team with real deployment, incident, or automation pain, reach out with one workflow you want to control better.

I am looking for design partners who want to help define the rules for safe agent execution on the open web.

The live app is https://ambios-ai.pages.dev. The future home is https://ambios.ai.”

---

# Q&A Preparation

## 1. Why does AmbiOS need WebMCP?

WebMCP lets the website expose explicit, structured capabilities to agents. This avoids unreliable screen scraping and DOM clicking. AmbiOS uses those capabilities with policy checks, approvals, and audit history.

## 2. Why not use existing automation tools?

Traditional automation runs tasks. AmbiOS focuses on shared control between a person and an agent. It adds context, explicit approval, risk checks, budgets, rollback paths, and a visible action history.

## 3. Why start with incident response?

Incident response has a clear problem. Teams need speed, context, accountability, and safe remediation. The workflow demonstrates the core AmbiOS pattern in a high-value setting.

## 4. What stops an agent from making a dangerous change?

Guardrails evaluate the planned action before execution. Policies define allowed tools, environments, budgets, approval requirements, and rollback rules. High-impact actions stop until an authorized person approves them.

## 5. What happens if an agent makes a mistake?

AmbiOS records the full action path. Sensitive actions require guardrail evaluation and, where required, human approval. The system prefers actions with a defined rollback path and validates the result after execution.

## 6. Does AmbiOS replace Cloudflare, Vercel, GitHub, or Shopify?

No. AmbiOS connects to existing systems. It provides a shared operating layer for people and agents to inspect and act across them.

## 7. Which integrations are planned?

The roadmap includes OpenAI, Cloudflare, Vercel, Netlify, Shopify, GitHub, Notion, Jira, Google Drive, Google Analytics, Google Calendar, and other SaaS platforms through Nango or direct integrations.

## 8. How do you protect OAuth tokens and external credentials?

AmbiOS stores connection metadata and provider identifiers. Provider credentials stay in approved secret storage or the integration provider. Browser clients do not receive server secrets.

## 9. Is this only for developers?

The first workflow targets developers and operators. The model extends to business users through goal-based workspaces, including e-commerce operations, data rights, evidence work, and accessibility flows.

## 10. What is the business model?

The planned model is SaaS. A free developer sandbox supports adoption. Team plans add shared workspaces and integrations. Enterprise plans add deeper governance, audit, support, and data controls. Pricing requires customer validation.

## 11. How is AmbiOS different from an agent framework?

An agent framework helps build or run agents. AmbiOS provides the operating environment around agent actions: structured capabilities, policy enforcement, approvals, shared context, integrations, and auditability.

## 12. What is the hardest technical challenge?

The hard part is not calling an API. The hard part is preserving a consistent authorization, policy, audit, and approval model across many providers while keeping the experience simple for people.

## 13. Why use Cloudflare, Supabase, and Nango?

Cloudflare provides edge compute, storage, queues, and deployment primitives. Supabase provides authentication and realtime application data. Nango provides a unified path for third-party integrations. Each maps to a specific platform need.

## 14. What does success look like after the hackathon?

Success means design partners use AmbiOS on real workflows, report clearer agent decisions, reduce manual context gathering, and resolve controlled changes with a complete audit trail.

## 15. What feedback do you want most?

We want to know which actions teams would delegate to agents, which actions must always require approval, what context agents need, and which integrations create the fastest user value.

---

# Rehearsal Guide

## Pitch Timing

- Slides 1 to 3: 2.5 minutes
- Slides 4 to 6: 3 minutes
- Slides 7 to 10: 3.5 minutes
- Slides 11 to 15: 2.5 minutes
- Total pitch: 11.5 minutes
- Live demo: 3 minutes
- Q&A: 5 to 10 minutes

## Rehearsal Checklist

- Test the live URL in ChatGPT's in-app browser
- Test the live URL in Chrome with WebMCP enabled
- Confirm WebMCP tools register before recording
- Confirm the demo account or demo mode works
- Seed an incident, service, deploy history, budget, and doc proposal path
- Confirm human approval blocks the sensitive action
- Confirm the action appears in the Activity Console
- Confirm the final slide has the correct URL and contact details
- Avoid unsupported traction, pricing, market, or customer claims
- Keep all slides readable without speaker notes

## Delivery Guidance

- Start with the problem before the stack
- Explain the workflow before architecture details
- Use the product screen as proof
- Pause after the human approval step
- Say what the agent knows, what the human decides, and what AmbiOS records
- End with one clear ask: test the live app or become a design partner
