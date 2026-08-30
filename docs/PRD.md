# Product Requirements Document

## AmbiOS AI

**Document status:** Draft  
**Product:** AmbiOS AI  
**Product type:** WebMCP-powered human-and-agent collaboration platform  
**Primary website:** `https://ambios.ai`  
**Temporary MVP URL:** `https://ambios-ai.pages.dev`  
**API base URL:** `https://api.ambios-ai.pages.dev/v1`  
**Prepared for:** AmbiOS AI stakeholders, development team, hackathon judges, and future pilot users  
**Prepared by:** @JustineDevs
**Date:** 2026-08-30  

---

## 1. Executive Summary

AmbiOS AI is a WebMCP-powered operating layer for the open web. It gives people and AI agents a shared, controlled workspace for operating services, investigating incidents, proposing changes, managing documentation, tracking budgets, and using connected third-party platforms.

The first release focuses on a high-value developer and operations use case: a **Context-Aware Hot-Fix Workspace**. A human retains ownership of intent and approval. An AI agent can inspect structured system context, investigate an incident, suggest remediation, simulate risk and cost, and apply an approved change. Every action is visible in a shared activity console and can result in an agent-proposed documentation update.

AmbiOS is designed as an extensible platform rather than a one-purpose dashboard. It exposes structured capabilities through WebMCP so agents can work with the same real state, permissions, rules, and audit history as human users.

---

## 2. Product Vision

### Vision Statement

Create an agent-native operating layer where people and AI agents can safely interact, collaborate, and create together on the open web.

### Product Promise

AmbiOS helps teams move from fragile agent automation and disconnected dashboards to structured, observable, policy-controlled collaboration.

### Core Principle

**Humans own intent, authority, and final approval; agents contribute investigation, synthesis, simulation, and execution within declared boundaries.**

---

## 3. Problem Statement

Teams increasingly use AI agents to assist with development, operations, documentation, customer workflows, and business processes. However, current agent integrations are often fragmented and unsafe:

- Agents rely on brittle browser automation, unstructured pages, and custom scripts.
- Human users cannot easily see what an agent did, why it did it, or what data it used.
- Sensitive actions such as deployments, rollbacks, data exports, and spending lack consistent approval controls.
- Information is split across hosting providers, repositories, incident tools, documents, analytics platforms, and SaaS applications.
- Documentation often drifts from system behavior after deployments or incident fixes.
- Developers cannot easily inspect, pause, replay, or understand multi-step agent workflows.

WebMCP creates an opportunity to make web applications expose explicit, structured capabilities to agents. AmbiOS turns that opportunity into a product: a shared workspace with tools, context, policies, and a visible history of human and agent activity.

---

## 4. Goals and Success Criteria

### Product Goals

1. Deliver a working, publicly accessible WebMCP-powered application for the WebMCP Challenge.
2. Demonstrate meaningful human-and-agent collaboration rather than a chat-only experience.
3. Provide a safe, auditable workflow for an agent-assisted incident hot-fix.
4. Expose real structured WebMCP tools under the `ambios.*` namespace.
5. Provide a platform foundation that can support infrastructure, developer tools, SaaS sync, e-commerce, privacy, research, accessibility, and workflow debugging in later releases.
6. Use a production-minded stack with clear module boundaries, validation, logging, security controls, and deployment practices.

### MVP Success Criteria

The MVP is considered complete when a judge or pilot user can:

1. Open `https://ambios-ai.pages.dev` in ChatGPT's in-app browser or Google Chrome with WebMCP enabled.
2. Authenticate with Google using Supabase Auth or use an approved demo mode if judge authentication is impractical.
3. View the Main Workspace Canvas and an active incident for a demo service.
4. Ask an agent to inspect the incident through registered WebMCP tools.
5. Receive structured hot-fix suggestions based on incident context.
6. See guardrail and budget evaluation before a sensitive action is executed.
7. Approve a proposed action and observe the agent apply the approved hot-fix.
8. View the resulting action, inputs, outputs, status, and actor in the Agent Activity Console.
9. Review an agent-proposed documentation update related to the change.
10. View at least one real external integration or connector workflow through the Plugin Configuration Panel.

### Measurable MVP Targets

| Measure | Target |
|---|---|
| Public application availability | Live URL accessible to judges |
| WebMCP capability coverage | At least 8 working `ambios.*` tools |
| Core demonstration | Incident to approved hot-fix completed end-to-end |
| Action traceability | 100% of user and agent actions logged |
| Safety enforcement | All sensitive write actions evaluated by guardrails |
| Documentation collaboration | At least one working agent proposal and human review flow |
| External integration proof | At least one live connector or sync workflow |

---

## 5. Users and Roles

### Developer

A software developer responsible for building, deploying, debugging, or maintaining a service.

**Needs:**

- Current service context and deploy history
- Safer deployment and rollback controls
- Agent assistance without surrendering control
- Clear audit trails and workflow debugging
- Documentation that stays aligned with system changes

### Operator / SRE / Incident Commander

A person responsible for service reliability and incident coordination.

**Needs:**

- Fast access to incident context
- Structured investigation and remediation suggestions
- Approval gates for high-impact actions
- Shared visibility into actions taken during an incident
- Incident summaries and documentation updates

### Organization Administrator

A person who configures teams, agents, integrations, budgets, and policies.

**Needs:**

- Organization and member management
- Agent registration and permissions
- Connector configuration
- Budget controls
- Security, audit, and policy visibility

### Business or Non-Technical User

A future user such as a product manager, operations manager, store operator, or support lead.

**Needs:**

- Goal-oriented workflows instead of complex dashboards
- Agent assistance with clear approval steps
- Plain-language explanations of changes and risks
- A trustworthy record of actions and outcomes

### AI Agent

An AI system operating through ChatGPT's in-app browser, Chrome with WebMCP enabled, or a supported server-side runtime.

**Needs:**

- Structured capability discovery
- Clear input schemas and tool descriptions
- Access only to approved scopes
- Context needed to make useful suggestions
- Predictable responses, status codes, and error results

---

## 6. MVP Scope

### In Scope

#### 6.1 Main Workspace Canvas

The Main Workspace Canvas is the central user interface for human-and-agent collaboration.

**Requirements:**

- Show the current organization, selected service, selected agent, and active incident.
- Display a contextual summary including recent deploys, alerts, incident status, and related documentation.
- Provide direct actions for inspecting context, requesting hot-fix suggestions, reviewing guardrails, checking budget, and opening detailed views.
- Refresh shared state after human or agent actions.

#### 6.2 Identity and Agent Access

**Requirements:**

- Authenticate users through Supabase Auth with Google OAuth 2.0.
- Support organizations, memberships, roles, and agent records.
- Allow an administrator to create, enable, or disable a configured agent.
- Associate actions with a human or agent actor.
- Enforce organization boundaries on all data access.

#### 6.3 Unified Capability Registry

**Requirements:**

- Maintain a registry of AmbiOS capabilities and their schemas.
- Use a stable `ambios.*` namespace for WebMCP tools.
- Provide human-readable descriptions for every tool.
- Allow agents to retrieve capability metadata and accepted input shape.
- Record capability version and availability status.

#### 6.4 WebMCP Integration

**Requirements:**

- Detect WebMCP support in the browser.
- Register working tools using `navigator.modelContext` or the WebMCP API supported by the target browser environment.
- Route every tool call to authenticated AmbiOS backend logic.
- Return structured success and error responses.
- Ensure that WebMCP tools and human UI actions invoke the same underlying domain logic.

#### 6.5 Agent Activity Console

**Requirements:**

- Record every human and agent action.
- Show timestamp, actor, capability, status, affected resource, and outcome summary.
- Provide filters for actor, tool, status, service, and incident where available.
- Allow a user to inspect the input, output, policy decision, and error details for an action.
- Update activity in near real time.

#### 6.6 Incident Response and Context-Aware Hot-Fix

**Requirements:**

- Display a list of incidents and an incident detail page.
- Provide a demo incident associated with a service such as `api-prod`.
- Return incident context, including severity, summary, service state, recent deploys, related alerts, and related documentation.
- Generate at least two remediation candidates, such as rollback and configuration/feature-flag change.
- Allow a human to review a proposed hot-fix before it is executed.
- Validate the result after execution and update incident status.

#### 6.7 Declarative Guardrail Flow

**Requirements:**

- Evaluate planned actions before sensitive execution.
- Return a clear risk classification, reasons, approval requirement, estimated blast radius, and rollback availability.
- Require human approval for sensitive actions such as production deploys, rollbacks, hot-fixes, spending, and external write operations.
- Reject execution if the action violates the configured policy.
- Record all guardrail decisions in the action audit record.

#### 6.8 Budgeting and Usage

**Requirements:**

- Support a simple budget attached to an organization and/or agent.
- Estimate the cost of an execution where applicable.
- Check available budget before sensitive execution.
- Record spend after an approved action is completed.
- Display used, remaining, and recent spend entries.

#### 6.9 Documentation and Knowledge Operations

**Requirements:**

- Store at least one service documentation record.
- Allow an agent to propose a documentation update with rationale.
- Require a human to approve or reject the proposed update.
- Retain version and proposal status.
- Link documentation records to a service and, when relevant, an incident or action.

#### 6.10 Plugin Configuration and Integration

**Requirements:**

- Provide a Plugin Configuration Panel.
- Display available integrations and configured connections.
- Support at least one working external connector through Nango or a direct API integration.
- Store only connection metadata and identifiers in AmbiOS; external provider credentials must remain with the integration provider or secret store.
- Provide basic connector status and a manual sync or refresh action.

#### 6.11 Backend Compute Controller

**Requirements:**

- Represent at least one managed service.
- Display service status and active version.
- Support a controlled deploy and rollback operation for the demo service.
- The MVP may use a deterministic simulated service operation when a production provider integration is unavailable, but the user-facing flow, guardrail enforcement, audit log, and status transitions must be real.

---

## 7. MVP WebMCP Capabilities

| Tool | Purpose | Write Risk |
|---|---|---|
| `ambios.identity.get_current_user` | Returns authenticated user and organization context | Read |
| `ambios.registry.list_capabilities` | Lists available capabilities and metadata | Read |
| `ambios.workspace.get_current_context` | Returns active workspace, service, incident, and context | Read |
| `ambios.workspace.set_context` | Changes the user's active workspace context | Controlled write |
| `ambios.console.list_agent_actions` | Lists recent human and agent actions | Read |
| `ambios.incident.get_incident_context` | Returns structured incident context | Read |
| `ambios.incident.suggest_hotfixes` | Returns remediation candidates | Read / proposal |
| `ambios.guardrails.evaluate_guardrails` | Evaluates policy, approval requirements, and risk | Read / evaluation |
| `ambios.payments.check_budget` | Checks available budget and estimated action cost | Read / evaluation |
| `ambios.incident.apply_hotfix` | Applies an approved remediation | Sensitive write |
| `ambios.backend.deploy_service` | Deploys or simulates a service version | Sensitive write |
| `ambios.docs.get_doc` | Returns a document and proposal state | Read |
| `ambios.docs.propose_doc_update` | Creates a proposed documentation update | Controlled write |

All sensitive write tools must perform authentication, authorization, guardrail evaluation, approval validation, audit logging, and result verification.

---

## 8. User Flows

### 8.1 Developer: Safe Change Flow

1. The developer signs in with Google.
2. The developer selects an organization, service, and agent in the Workspace Canvas.
3. The developer asks the agent to inspect the current system context.
4. The agent retrieves deployment state, active incidents, documentation, and recent actions through WebMCP tools.
5. The developer asks the agent to prepare a change or hot-fix.
6. AmbiOS evaluates guardrails and budget impact.
7. The developer reviews the proposal, risk explanation, and rollback plan.
8. The developer approves the action.
9. The agent executes the approved action through AmbiOS.
10. AmbiOS logs the result, updates state, and offers a documentation proposal.

### 8.2 Incident Commander: Context-Aware Hot-Fix Flow

1. An incident is visible in the incident list or created by a connected signal source.
2. The incident commander opens the incident detail view.
3. The agent retrieves structured incident context.
4. The agent proposes hot-fix options with expected benefits and risk.
5. AmbiOS evaluates policy, approval needs, cost, and rollback readiness.
6. The incident commander approves a permitted remediation.
7. AmbiOS applies the remediation and validates service state.
8. The Activity Console records every decision and execution event.
9. The agent proposes a documentation or runbook update for human review.

### 8.3 Administrator: Connector Setup Flow

1. The administrator opens the Plugin Configuration Panel.
2. The administrator chooses a connector, such as Cloudflare, Notion, or GitHub.
3. AmbiOS starts the provider authorization flow through Nango or the selected integration mechanism.
4. The administrator grants the required provider scopes.
5. AmbiOS stores connection metadata and displays connection health.
6. The administrator runs a manual sync or refresh.
7. AmbiOS processes the result asynchronously and displays status in the UI and Activity Console.

### 8.4 Normal User: Goal-Based Interaction Flow

1. The user opens a workspace with only the capabilities allowed by their role.
2. The user describes a desired result in plain language or chooses a simplified action.
3. The agent converts the goal into a structured plan.
4. AmbiOS explains the affected systems, risk, cost, and required approval.
5. The user approves, rejects, or adjusts the plan.
6. AmbiOS executes only the approved actions and records the outcome.

---

## 9. Functional Requirements

### Authentication and Authorization

- The system must authenticate users through Supabase Auth.
- The system must support Google OAuth 2.0 sign-in.
- The system must validate user sessions on server-side requests.
- The system must scope all records to an organization.
- The system must reject cross-organization resource access.
- The system must distinguish human actions from agent actions.

### Data and Audit

- The system must create an immutable action record for every attempted and completed capability invocation.
- The system must preserve action status, input, output, errors, policy decision, approval state, timestamps, and actor identity.
- The system must allow authorized users to inspect action history.
- The system must retain enough data to reconstruct the MVP hot-fix workflow.

### Guardrails

- The system must evaluate high-impact actions before execution.
- The system must support rules for approval requirements, allowed environments, allowed capabilities, maximum budget, and rollback requirements.
- The system must prevent execution when a guardrail denies the action.
- The system must clearly explain a denial or approval requirement.

### Integrations

- The system must isolate external integrations behind a connector abstraction.
- The system must never expose integration secrets to browser clients.
- The system must store connection IDs and metadata separately from provider credentials.
- The system must record connector failures and sync failures in the Activity Console.

### Documentation

- The system must maintain document versions and proposal states.
- The system must preserve the original document until a human approves a proposed update.
- The system must link a proposal to the originating agent action when applicable.

---

## 10. Non-Functional Requirements

### Reliability

- The MVP application must be publicly available during the hackathon judging window.
- Sensitive write actions must be idempotent or protected from unintended duplicate execution.
- Async tasks must support retry handling and failure visibility.

### Performance

- Standard read views should provide a usable response within 3 seconds under normal demo load.
- Guardrail evaluation should complete before a sensitive action can be approved.
- Long-running integration and document tasks should be processed asynchronously with a visible status.

### Security

- Secrets must be stored in Cloudflare Secrets, Supabase secrets, or the approved integration provider secret store.
- Client-side code must not contain service-role credentials, provider access tokens, or Nango secret keys.
- All externally received data must be validated before use.
- Inputs must be validated with Zod schemas or equivalent server-side validation.
- Sensitive actions must require explicit approval when policy requires it.

### Accessibility

- Core controls must be keyboard navigable.
- Status, errors, and approvals must be understandable without relying only on color.
- Forms must have visible labels and useful validation messages.
- The platform should support goal-based agent interaction as a future accessibility pathway.

### Internationalization

- The application must be structured for `next-intl` localization.
- MVP content may launch in English, but visible strings must be organized for translation.

---

## 11. Technical Requirements

### Application Stack

- TypeScript across frontend, backend, shared packages, and tooling.
- Next.js with React and App Router.
- Tailwind CSS.
- shadcn/ui using Radix primitives, Nova style, Lucide icons, neutral theme, Geist font, and default radius.
- tRPC for the typed internal application API.
- Drizzle ORM with PostgreSQL.
- Supabase Auth with Google OAuth 2.0.
- OpenAI Agents SDK for server-side agent orchestration where needed.
- WebMCP for browser-native tool exposure.

### Required Platform Services

- Cloudflare Pages for web delivery.
- Cloudflare Workers for AmbiOS edge/API and WebMCP-compatible service handlers.
- Cloudflare D1 for operational data where Worker-local storage is required.
- Cloudflare KV for caches, feature state, rate counters, and short-lived context snapshots.
- Cloudflare R2 for artifacts, exports, attachments, and seed data.
- Cloudflare Queues for asynchronous processing.
- Cloudflare Cron Triggers for scheduled processing.
- Durable Objects for organization-level coordination and sensitive-operation locking.
- Cloudflare Analytics Engine for internal product metrics.
- Supabase Postgres, Realtime, and Storage.
- Nango for external integration connection and synchronization workflows.

### Supporting Services

- Xendit for payment processing when payment collection is enabled.
- Resend for transactional email.
- Uppy for browser file uploads.
- evlog for structured application logging.
- Sentry for application error tracking and release monitoring.
- Upstash Rate Limit for API abuse protection.
- Payload CMS for marketing and content management requirements.
- Kong for API gateway configuration where a gateway layer is required.

### Development and Quality Tooling

- pnpm package manager.
- Turborepo workspace management.
- Biome for formatting and code quality.
- Husky for Git hooks.
- Knip for unused-code analysis.
- Gitleaks for secret detection.
- GitHub Actions for CI/CD.
- Vitest, Playwright, MSW, and Storybook for testing and UI validation.
- Dev Container and Docker Compose for reproducible development environments.
- SWR and Axios for frontend data access where required.
- Zustand for client state.
- React Hook Form and Zod for form and input validation.
- Framer Motion for purposeful interface motion.
- Claude Markdown, AGENTS instructions, Skills, and Ruler for AI-assisted development workflows.

---

## 12. Data Requirements

### Core Entities

| Entity | Purpose |
|---|---|
| Organization | Tenant boundary for members, agents, policies, actions, and integrations |
| Membership | User role within an organization |
| Agent | Configured AI actor with allowed capabilities and policy association |
| Capability | Registered action or tool exposed to humans and agents |
| Action | Immutable audit record for a human or agent capability invocation |
| Service | Managed or observed deployment target |
| Incident | Reliability event with severity, status, context, and remediation history |
| Hot-Fix Proposal | Candidate remediation linked to an incident and guardrail decision |
| Guardrail | Declarative action restrictions, approval rules, risk controls, and limits |
| Budget | Limit and usage boundary associated with an organization, project, or agent |
| Spend Entry | Cost record linked to an action |
| Document | Versioned knowledge record associated with services and workflows |
| Document Proposal | Agent or human suggested change pending review |
| Integration | Connection metadata for an external provider |
| Sync Job | Definition and status of a provider-to-AmbiOS synchronization job |

### Data Ownership

- Users own their profile and account data subject to applicable terms.
- Organizations own operational data entered or connected under their workspace.
- AmbiOS stores only the minimum external integration metadata required for operation.
- OAuth tokens and provider credentials must remain in approved secret-management systems.

---

## 13. Out of Scope for MVP

The following are important AmbiOS roadmap capabilities but are not required for the hackathon MVP:

- Full multi-provider frontend pipeline control across Cloudflare, Vercel, and Netlify.
- Full backend compute abstraction for containers, functions, jobs, networking, and storage.
- A general-purpose visual automation and scripting builder.
- Full Shopify product, inventory, order, pricing, and promotion synchronization.
- Full staging and sandbox data reseeding with masking.
- Advanced multi-agent orchestration and autonomous remediation.
- A complete enterprise compliance suite, SSO, SAML, and SOC 2 controls.
- A public plugin marketplace and third-party capability SDK.
- A complete Personal Data Rights Center.
- A full Evidence and Claim Workspace.
- A complete Accessibility Action Layer.
- Contract Negotiation Workspace, Research Reproducibility Lab, and Adaptive Learning Lab.
- Full agent-native workflow debugging with breakpoints, replay, and distributed tracing.

---

## 14. Product Roadmap Summary

### Phase 0: Hackathon MVP

- WebMCP tool registration and real agent interaction
- Main Workspace Canvas
- Agent Activity Console
- Incident context and hot-fix suggestions
- Guardrails, approvals, budget checks, and audit log
- Documentation proposal and review flow
- One real connector or integration workflow

### Phase 1: Operational Hardening

- Real deployment and incident integrations
- Expanded policy model and agent permission simulation
- More Nango connectors: Cloudflare, GitHub, Notion, Jira, Google services
- Connector health, sync controls, and reliable async job operations
- Context engine expansion and documentation drift detection

### Phase 2: Workspace Expansion

- Safe Change Workspace as a broader product surface
- Agent-Native Workflow Debugger
- Personal Data Rights Center exploration
- Evidence and Claim Workspace
- Accessibility Action Layer
- Shopify and e-commerce synchronizers

### Phase 3: Open Web Platform

- Public capability registry and plugin ecosystem
- Third-party SDK and marketplace
- Enterprise governance and compliance controls
- Multi-agent orchestration under human authority
- Domain-specific collaborative workspaces for contracts, research, education, and privacy

---

## 15. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| WebMCP browser support or implementation changes | Core demo may fail | Test early in ChatGPT in-app browser and Chrome with WebMCP enabled; maintain a visible in-app human flow as fallback |
| OAuth flow fails in judge environment | Judges cannot access user-specific data | Provide a documented demo account or safe seeded demo workspace where allowed |
| External integration setup is delayed | Connector requirement becomes incomplete | Build an adapter interface and prioritize one supported provider with a deterministic demo path |
| Excessive scope | MVP quality suffers | Treat the Context-Aware Hot-Fix flow as the single non-negotiable vertical slice |
| Unsafe agent execution | Trust and security risk | Require guardrails, explicit approval, audit logging, and rollback planning for sensitive writes |
| Multiple data stores cause inconsistency | Incorrect activity or state | Define source-of-truth ownership per entity and use queued synchronization with idempotency keys |
| Provider API limits or outages | Integrations fail | Cache non-sensitive reads, surface provider status, and retain a seeded demo dataset |

---

## 16. Acceptance Criteria

The MVP will be accepted when all of the following are demonstrated:

- A live AmbiOS URL is reachable by judges.
- The app operates in a WebMCP-capable browser environment.
- At least eight `ambios.*` WebMCP tools are registered and return real structured responses.
- A human and an AI agent can operate on the same incident and service state.
- The agent can inspect incident context and propose a hot-fix.
- A guardrail evaluation is displayed before sensitive action execution.
- A required approval blocks execution until a human grants it.
- The approved hot-fix updates service or demo-service state.
- The system records the full activity in the Agent Activity Console.
- The agent can create a documentation proposal and a human can review it.
- At least one integration connection, connector state, or sync workflow is visible and operational.
- The UI is coherent, accessible, and understandable without requiring technical knowledge for basic review steps.

---

## 17. Follow-Up: Basic Programming Service Agreement

> This section is a basic plain-language template for a programming service. It is not legal advice. Have a qualified lawyer review it for your jurisdiction and specific engagement.

# Basic Programming Service Agreement

**Effective date:** ____________________  
**Client:** ____________________  
**Service Provider:** ____________________  
**Project:** AmbiOS AI or related custom software work

## 1. Services

The Service Provider will design, develop, configure, test, and deliver the software services described in the agreed Product Requirements Document (PRD), statement of work, proposal, or written change request.

Services may include application development, user interface work, API work, integrations, deployment configuration, documentation, testing, and maintenance as specifically agreed in writing.

## 2. Scope and Deliverables

The deliverables, milestones, timeline, and acceptance criteria will be listed in the PRD or a written statement of work. Work not listed in that document is outside the agreed scope and requires a written change request.

The Service Provider will make reasonable efforts to deliver the agreed work professionally and on schedule. Dates depend on timely client feedback, access to required accounts, and the availability of third-party services.

## 3. Client Responsibilities

The Client agrees to:

- Provide accurate requirements, feedback, content, approvals, and access needed for the work.
- Maintain valid accounts for paid third-party services unless the parties agree otherwise.
- Review deliverables and provide approval or written feedback within the agreed review period.
- Confirm that it has the rights to all content, data, trademarks, and materials it gives to the Service Provider.

## 4. Fees and Payment

The Client will pay the fees stated in the proposal, invoice, or statement of work.

Unless otherwise agreed in writing:

- A deposit may be required before work begins.
- Milestone payments are due when the related milestone is delivered or approved.
- Final payment is due before final production handover.
- Late payments may pause work until the account is current.
- Third-party costs, including hosting, domains, API usage, subscriptions, payment processing, and provider fees, are paid by the Client unless explicitly included in the quote.

## 5. Changes

The Client may request changes in writing. The Service Provider will confirm whether the request affects cost, scope, timeline, or technical design before beginning the change.

No out-of-scope work is required until both parties approve the change in writing.

## 6. Testing and Acceptance

The Service Provider will test deliverables using reasonable development practices. The Client will review delivered work against the agreed acceptance criteria.

A deliverable is accepted when the Client approves it in writing, deploys or uses it in production, or does not provide material written issues within the agreed review period.

Bug fixes for agreed functionality are included during the stated support period. New features, changed requirements, third-party outages, and issues caused by unauthorized changes are outside normal bug-fix scope.

## 7. Ownership and Intellectual Property

After the Client pays all invoices in full, the Client owns the custom project deliverables specifically created for the Client, unless the proposal says otherwise.

The Service Provider retains ownership of:

- Pre-existing tools, libraries, templates, frameworks, utilities, and know-how.
- General methods, concepts, and reusable non-client-specific components.
- Open-source software, which remains subject to its applicable license.

The Service Provider may reuse general knowledge and non-confidential techniques learned during the project.

## 8. Confidentiality

Each party will protect the other party's non-public business, technical, financial, customer, and security information. Confidential information may be used only to perform this agreement.

This obligation does not apply to information that is public through no fault of the receiving party, already known without confidentiality restrictions, independently developed, or required to be disclosed by law.

## 9. Security and Third-Party Services

The Service Provider will use reasonable security practices for the agreed scope. The Client understands that no software, cloud service, integration, or internet-connected system can be guaranteed completely secure or uninterrupted.

Third-party services, including hosting providers, payment processors, AI providers, OAuth providers, and external APIs, are governed by their own terms, availability, pricing, and security practices. The Service Provider is not responsible for third-party outages, policy changes, account suspensions, or service limitations outside its control.

## 10. AI-Assisted Features

If the project includes AI-assisted features, the Client understands that AI outputs may be incomplete, inaccurate, or unsuitable for a particular purpose. The Client remains responsible for reviewing important outputs, especially legal, financial, medical, security, privacy, deployment, and business decisions.

Where the software supports approvals, guardrails, or audit logs, those controls help reduce risk but do not remove the need for human review.

## 11. Support and Maintenance

Any included support period and maintenance services will be stated in the proposal or statement of work. After the included support period, maintenance, feature work, monitoring, and operational support require a separate agreement or approved hourly work.

## 12. Limitation of Liability

To the maximum extent allowed by law, the Service Provider's total liability related to the project is limited to the amount the Client paid for the specific services giving rise to the claim.

Neither party is liable for indirect, incidental, special, consequential, or lost-profit damages, including loss of data, revenue, business opportunity, or goodwill, except where liability cannot legally be limited.

## 13. Termination

Either party may terminate this agreement by written notice if the other party materially breaches the agreement and does not fix the breach within a reasonable written cure period.

The Client must pay for all completed work, approved work, committed third-party costs, and work reasonably performed up to the termination date.

## 14. Independent Contractor

The Service Provider is an independent contractor, not an employee, partner, or legal representative of the Client.

## 15. Governing Law

This agreement is governed by the laws of: ____________________.

## 16. Entire Agreement

This agreement, together with the PRD, statement of work, approved proposals, and written change requests, represents the complete agreement between the parties for the project.

Any change must be in writing and approved by both parties.

## Signatures

**Client**  
Name: ____________________  
Signature: ____________________  
Date: ____________________

**Service Provider**  
Name: ____________________  
Signature: ____________________  
Date: ____________________
