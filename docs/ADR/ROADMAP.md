# AmbiOS AI – Product Roadmap

**Vision:**  
AmbiOS is a WebMCP‑native operating layer for the open web where humans and AI agents co‑operate on real systems: services, incidents, docs, budgets, and integrations. Our MVP demonstrates safe change management and incident response; our roadmap extends this to privacy, evidence work, accessibility, contract negotiation, research, learning, and debugging.

**Hackathon goal (10 days):**  
Ship a working WebMCP‑powered app at `https://ambios-ai.pages.dev` that shows humans and agents collaborating on:

- Context‑aware incident response  
- Guardrailed deploys / hot‑fixes  
- Shared audit log (Agent Activity Console)  
- Agent‑proposed documentation updates  
- One real external integration via Nango  

Everything beyond this is roadmap.

---

## How to read this roadmap

- **Phases:** MVP → Phase 1 → Phase 2 → Phase 3+  
- **Categories:**  
  - Core Control Plane  
  - Infrastructure & Execution  
  - Observability, Safety & Incident Patterns  
  - Data, Context & AI  
  - Payments, Policy & Governance  
  - Integration & Extension  
  - Human + Agent Interaction Concepts  
- **Each item includes:**
  - What it is  
  - Why it matters  
  - Target users  
  - Priority (P0–P3)  
  - Target phase  

---

## Phase 0 – MVP (Hackathon, 10 days)

**Goal:** Prove the core vision with one crisp end‑to‑end story.

### Core Control Plane

- **Identity & Access (AgentIAM) – MVP slice**  
  - Google OAuth via Supabase; orgs, users, agents, basic delegation.  
  - Tools: `ambios.identity.*`  
  - Users: all  
  - Priority: P0  
  - Phase: MVP  

- **Unified Capability Registry – MVP slice**  
  - Register and expose `ambios.*` tools via WebMCP.  
  - Tools: `ambios.registry.*`  
  - Users: devs, agents  
  - Priority: P0  
  - Phase: MVP  

- **Agent Activity Console – MVP slice**  
  - Timeline of agent & human actions; filters; basic detail view.  
  - Tools: `ambios.console.*`  
  - Users: all  
  - Priority: P0  
  - Phase: MVP  

- **Main Workspace Canvas – MVP slice**  
  - Single workspace view: context, suggested actions, quick tools.  
  - Tools: `ambios.workspace.*`  
  - Users: all  
  - Priority: P0  
  - Phase: MVP  

### Infrastructure & Execution

- **Backend Compute Controllers – MVP slice**  
  - One mock service (`api-prod`), deploy/rollback (mocked).  
  - Tools: `ambios.backend.*`  
  - Users: devs  
  - Priority: P0  
  - Phase: MVP  

### Observability, Safety & Incident Patterns

- **Observability & Incident Response (IncidentOS) – MVP slice**  
  - Mock metrics/alerts; create incidents; one runbook (rollback).  
  - Tools: `ambios.observability.*`, `ambios.incident.*`  
  - Users: devs, ops  
  - Priority: P0  
  - Phase: MVP  

- **The Context‑Aware Hot‑Fix (Incident Response Pattern)**  
  - Incident → suggest hot‑fixes → human approve → apply → validate.  
  - Tools: `ambios.hotfix.*`  
  - Users: devs, ops  
  - Priority: P0  
  - Phase: MVP  

- **The Declarative Guardrail Flow (Safe Execution Pattern) – MVP slice**  
  - Simple guardrails: “no prod deploy without approval”, basic budget check.  
  - Tools: `ambios.guardrails.*`  
  - Users: devs, ops, managers  
  - Priority: P0  
  - Phase: MVP  

### Data, Context & AI

- **AI Synthesis & Context Engine – MVP slice**  
  - Rule‑based context: recent deploys, incidents, config changes.  
  - Tools: `ambios.context.*`  
  - Users: devs, agents  
  - Priority: P1  
  - Phase: MVP  

- **Documentation & Knowledge Ops (DocEngine) – MVP slice**  
  - One doc per service; agent‑proposed updates; human approve/reject.  
  - Tools: `ambios.docs.*`  
  - Users: devs, tech writers  
  - Priority: P1  
  - Phase: MVP  

### Payments, Policy & Governance

- **Payments, Budgeting & Usage (AmbiOS Pay) – MVP slice**  
  - Logical budgets per org/agent; record spend per deploy/hot‑fix.  
  - Tools: `ambios.payments.*`  
  - Users: devs, managers  
  - Priority: P1  
  - Phase: MVP  

### Integration & Extension

- **Integrations & Connectors (Plugin Layer) – MVP slice**  
  - Nango‑backed: 1–2 connectors (e.g., Notion or Cloudflare).  
  - Tools: `ambios.plugins.*`, `ambios.sync.*`  
  - Users: admins, devs  
  - Priority: P1  
  - Phase: MVP  

### Human + Agent Interaction Concepts

- **Safe Change Workspace – MVP slice**  
  - Human owns intent/approval; agent modifies live system graph (deploy/hot‑fix).  
  - Priority: P0  
  - Phase: MVP  

- **Collaborative Incident Room – MVP slice**  
  - Human as incident commander; agent investigates, proposes, does not silently execute.  
  - Priority: P0  
  - Phase: MVP  

- **Agent‑Native Workflow Debugger – MVP slice**  
  - Developer watches agent execution (deploys, hot‑fixes) and intervenes.  
  - Priority: P1  
  - Phase: MVP  

---

## Phase 1 – Post‑Hackathon (1–3 months)

**Goal:** Harden MVP into a usable internal platform; expand integrations and safety.

### Core Control Plane

- **Identity & Access – full**  
  - Richer policies (time‑bound, scope‑bound).  
  - Service accounts / API keys.  
  - Priority: P1  

- **Agent Activity Console – full**  
  - Advanced filtering, saved views, exportable audit logs.  
  - Priority: P1  

- **Plugin Configuration Panel**  
  - Full UI for Nango connectors, sync jobs, health, diagnostics.  
  - Priority: P1  

### Infrastructure & Execution

- **Frontend Cloud Pipeline Controllers**  
  - Real integrations with Cloudflare Pages/Workers, Vercel, Netlify.  
  - Deploy, preview, promote, rollback.  
  - Priority: P1  

- **Backend Compute Controllers – full**  
  - Real services, jobs, cron tasks; not just mock.  
  - Priority: P1  

- **Automation & Scripting**  
  - Basic workflow engine; scheduled jobs; event‑driven automations.  
  - Priority: P2  

### Observability, Safety & Incident Patterns

- **Observability & Incident Response – full**  
  - Real metrics/logs ingestion (or deeper integrations with existing tools).  
  - Multiple runbooks per service; incident templates.  
  - Priority: P1  

- **The Staging/Sandbox Reseed (Data Sync Pattern)**  
  - Seed staging envs with realistic, masked data.  
  - Priority: P2  

### Data, Context & AI

- **AI Synthesis & Context Engine – full**  
  - Richer context aggregation (code, docs, incidents, metrics).  
  - Basic “project memory” and “org memory”.  
  - Priority: P1  

- **Documentation & Knowledge Ops – full**  
  - Multi‑doc workspaces; drift detection; runbook generation from operations.  
  - Priority: P1  

- **Productivity & Workspaces**  
  - Projects, tasks, notes; integrations with Jira/Notion via Nango.  
  - Priority: P2  

### Payments, Policy & Governance

- **Payments, Budgeting & Usage – full**  
  - Multi‑budget policies; forecasts; alerts on overspend.  
  - Priority: P2  

- **Policy, Governance & Audit**  
  - Formal policy engine; compliance reports; exportable audit trails.  
  - Priority: P2  

### Integration & Extension

- **Data & SaaS Sync – expanded**  
  - More connectors: GitHub, Google (Drive, GA, Calendar), Jira, etc.  
  - Priority: P1  

- **E‑Commerce Storefront Synchronizers**  
  - Shopify integration: products, inventory, orders, promos.  
  - Priority: P2  

### Human + Agent Interaction Concepts

- **Agent Permission Simulator**  
  - Visualize what agents can/cannot do; simulate workflows; show escalations.  
  - Priority: P1  

- **Personal Data Rights Center (exploratory)**  
  - User‑driven privacy intents; selective delete/export/revoke across SaaS.  
  - Priority: P2  

---

## Phase 2 – Platform Expansion (3–9 months)

**Goal:** Make AmbiOS a general platform for human+agent collaboration across domains.

### Core Control Plane

- **Unified Capability Registry – full**  
  - Versioning, deprecation, marketplace‑like discovery of capabilities.  
  - Priority: P2  

### Infrastructure & Execution

- **Infrastructure & Compute**  
  - Abstracted compute, storage, networking resources; agent‑requestable.  
  - Priority: P2  

- **Automation & Scripting – full**  
  - Visual workflow builder; reusable workflow library.  
  - Priority: P2  

### Data, Context & AI

- **Evidence & Claim Workspace**  
  - Structured arguments, claims, evidence, contradictions; provenance tracking.  
  - Priority: P2  

- **Adaptive Learning Lab**  
  - Interactive simulations where students and agents co‑control experiments.  
  - Priority: P3  

### Human + Agent Interaction Concepts

- **Accessibility Action Layer**  
  - Goal‑based interaction; agent translates goals into tool calls across apps.  
  - Priority: P2  

- **Contract Negotiation Workspace**  
  - Structured contract terms; agent compares versions, drafts proposals.  
  - Priority: P2  

- **Research Reproducibility Lab**  
  - Experiment definitions, parameter sweeps, reproducible runs, provenance.  
  - Priority: P2  

---

## Phase 3+ – Long‑Term Vision (9+ months)

**Goal:** Establish AmbiOS as the standard OS for human+agent collaboration on the open web.

### Strategic Themes

- **Multi‑tenant, multi‑org platform**  
  - Org hierarchies, billing, marketplace of capabilities.  

- **Enterprise governance & compliance**  
  - SOC2‑ready audit trails, fine‑grained policies, data residency controls.  

- **Ecosystem & plugins**  
  - Third‑party capabilities, public plugin registry, revenue share.  

- **Advanced AI**  
  - Multi‑agent orchestration, negotiation between agents, autonomous workflows under human policy.  

### Human + Agent Interaction Concepts (full realization)

- **Personal Data Rights Center – full**  
- **Evidence & Claim Workspace – full**  
- **Accessibility Action Layer – full**  
- **Agent Permission Simulator – full**  
- **Collaborative Incident Room – full**  
- **Contract Negotiation Workspace – full**  
- **Research Reproducibility Lab – full**  
- **Adaptive Learning Lab – full**  
- **Agent‑Native Workflow Debugger – full**  

---

## Non‑Goals (for now)

- Building a competing LLM or foundation model.  
- Replacing existing observability platforms entirely; we integrate and add agent‑native patterns.  
- Full‑blown e‑commerce platform; we sync and operate on existing storefronts.  
- Consumer social product; focus is dev/ops/business users first.

---

## Success Metrics

**MVP (hackathon):**

- Working WebMCP app at `https://ambios-ai.pages.dev`.  
- Judges can:
  - Sign in with Google.  
  - Use an agent in ChatGPT’s in‑app browser to:
    - Inspect an incident.  
    - Get suggested hot‑fixes.  
    - Apply a hot‑fix under guardrails.  
    - See the action in the Agent Activity Console.  
    - Review an agent‑proposed doc update.  
- At least one real Nango integration demonstrated.

**Phase 1:**

- 2–3 teams using AmbiOS internally for incident response and deploys.  
- 5+ connectors live via Nango.  
- Measurable reduction in mean time to resolve incidents (MTTR) for pilot teams.

**Phase 2:**

- Public docs + SDK for building `ambios.*` capabilities.  
- External teams building on top of AmbiOS (even if small).  

---

## How this aligns with the WebMCP Challenge

- **WebMCP‑powered web app:**  
  - Next.js app on Cloudflare Pages registering `ambios.*` tools via `navigator.modelContext`.  

- **Humans and agents interact, collaborate, and create together:**  
  - Shared workspace, console, incidents, docs, budgets.  
  - Agents propose and execute changes; humans approve and oversee.  

- **Working live URL:**  
  - `https://ambios-ai.pages.dev` accessible in ChatGPT’s in‑app browser or Chrome with WebMCP.  

- **Future of the open web:**  
  - AmbiOS as an OS layer where any site/service can expose tools for human+agent collaboration, starting with dev/ops and expanding to privacy, evidence, learning, and more.