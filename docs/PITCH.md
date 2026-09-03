# AmbiOS AI pitch and demo brief

**Current UI:** https://ambios-ai.vercel.app
**Core API:** https://ambios-ai.pcg0255.workers.dev
**Connector/Execution:** https://ambios-ai-connector.pcg0255.workers.dev
**Stage:** Early product / pre-revenue

## One sentence

AmbiOS is the WebMCP workspace where humans set intent and approve changes while agents investigate, execute within policy, and leave a verifiable audit trail.

## The problem

Teams operate across alerts, source control, deployments, documentation, and SaaS dashboards. Agents add speed but can also add invisible decisions, unclear authority, and weak rollback evidence. Existing automation runs tasks; existing dashboards show state. Neither gives people and agents one governed operating surface.

## The product

AmbiOS combines:

- structured `ambios.*` browser tools;
- shared workspace, service, and incident context;
- policy, budget, and approval gates;
- Nango-managed external connections;
- queue-backed execution and independent verification;
- persisted Runs, Console, and Canvas views of the same action history.

## Three-minute demo

1. Open the Vercel UI and show the workspace and incident context.
2. Ask the compatible browser agent to inspect the incident.
3. Show the structured context and a proposed remediation.
4. Show policy, risk, target, budget, and rollback information.
5. Deny one write proposal and show the audit event with no provider execution.
6. Approve a separate exact-scope action only when a real provider connection and safe test target are available.
7. Show queue state, independent verification, audit history, and Canvas projection.

Do not claim a live provider workflow, OAuth consent, or native WebMCP execution without matching evidence in `webmcp/VERIFICATION.md`. If unavailable, demonstrate the real read-only or governed internal boundary and label the provider `unverified` or `not configured`.

## Architecture message

```text
Vercel Next.js UI + browser WebMCP
              ↓ same-origin API rewrites
Cloudflare Hono Core Worker → D1/KV/R2/Queue
              ↓ execution boundary
Cloudflare Hono Connector Worker → Nango → provider APIs
```

Vercel hosts the frontend. Cloudflare hosts backend APIs and execution. Provider credentials remain with Nango or Worker secrets and never enter the browser.

## Who it is for

Developers, platform engineers, SREs, incident commanders, and teams that need agent assistance without surrendering authority over production changes.

## Honest proof points

- UI routes, Worker health/readiness, D1 migrations, WebMCP contracts, mounted read-only tools, Nango catalog access, and Worker size budgets are documented with evidence.
- Authenticated native WebMCP, human OAuth, and live provider writes are external verification gates, not implied by a screenshot or configuration file.
- Pricing, traction, customer count, and market claims are not established and must not be presented as facts.
