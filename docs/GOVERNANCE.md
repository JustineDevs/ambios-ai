# Governance

AmbiOS treats authorization, provider access, durable state, and public claims as shared product responsibilities. The person who writes a change does not approve its own security or release evidence by default.

## Decision ownership

| Change | Required review |
| --- | --- |
| Documentation | Maintainer review |
| UI or interaction | Frontend review and accessibility check |
| API, schema, or OpenAPI | API review and scope/security review |
| Auth, permissions, secrets, or provider scope | Security review and maintainer approval |
| D1 migration, queue, approval, audit, or verification | Platform/security review plus tests |
| Deployment or production configuration | Release owner and deployment evidence |
| New dependency or runtime | ADR, security review, and maintainer approval |

## Change and merge rules

A pull request must identify the problem, owning runtime, user-visible behavior, contract/data changes, security and privacy impact, tests, evidence level, and known limitations. CI must pass before merge. Missing external evidence is recorded as a limitation; it is never disguised by changing a label.

## ADRs

Write an ADR before changing runtime topology, authentication, data ownership, lifecycle states, provider strategy, WebMCP contracts, deployment, or a security invariant. Use the [ADR template](./ADR/templates/ADR-template.md). An ADR records the decision, alternatives, consequences, migration, and verification. Historical proposals must not be cited as current behavior without matching implementation and evidence.

## Incidents and vulnerabilities

Production incidents need an owner, timeline, impact, mitigation, verification, and follow-up. Preserve relevant audit records while removing credentials and personal data from logs and reports. Report vulnerabilities privately through [SECURITY.md](../SECURITY.md), never through a public issue.

## Claim integrity

Use the status vocabulary in [Feature status](./FEATURE-STATUS.md). “Verified” requires the evidence described in [Release evidence](./RELEASE-EVIDENCE.md); code, metadata, a screenshot, or a successful page load is not enough.
