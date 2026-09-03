# ADR task queue

These records remain in the task queue until their decision, implementation, and applicable verification evidence all match the current AmbiOS architecture. A design proposal, local unit test, fixture, or configuration value is not sufficient evidence for a live deployment, OAuth lifecycle, provider-side write, or compatible-browser WebMCP claim.

## Current disposition

| Records | Disposition |
| --- | --- |
| ADR-002, ADR-015 | Historical/superseded single-hosting decisions; current delivery is Vercel Next.js plus Hono Core and Connector/Execution Workers. |
| ADR-003 through ADR-012 | Accepted architecture decisions that still require a record-specific implementation/evidence review before completion. |
| ADR-016, ADR-017 | Accepted or conditionally approved topology/evidence records; live provider and release evidence remains scoped per record. |
| ADR-018, ADR-019, ADR-020, ADR-021, ADR-022 | Supporting strategy, security, and WebMCP records; their external/security gates remain open. |
| ADR-023 | Current UI/UX, route, authentication-proxy, and documentation reconciliation; local evidence is captured, deployment verification remains open. |
| `*-guide.md` and `*-checklist*.md` | Guides/checklists, not completion evidence. They remain until their stated external or adoption gates are directly reproduced. |

## Completion rule

Move a record to [`../done/`](../done/) only after its own acceptance criteria are satisfied and the evidence is linked from the record or [`webmcp/VERIFICATION.md`](../../webmcp/VERIFICATION.md). If a record conflicts with the canonical strategy, update it with a superseded notice instead of moving it as complete.
