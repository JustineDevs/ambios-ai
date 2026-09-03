# Governance

## Decision rights

| Change | Required owner/review |
| --- | --- |
| Documentation-only | Contributor + maintainer review |
| UI behavior | Frontend owner + accessibility check |
| API/OpenAPI | API owner + security/scope review |
| Auth, permissions, provider scopes, secrets | Security review and maintainer approval |
| Database/schema/migration | Data owner + migration evidence |
| Queue, approval, audit, verification | Platform/security review |
| Deployment or production configuration | Release owner + deployment evidence |
| New dependency or runtime | ADR and maintainer approval |

## Merge policy

Every pull request must state intent, affected boundaries, user-visible behavior, security impact, tests, evidence, and known limitations. CI must pass. Missing external evidence must be labelled; it must not be hidden by changing status text or weakening tests.

## ADR policy

Write an ADR before changing runtime topology, auth model, data model, provider strategy, WebMCP contract, deployment model, or a security invariant. Use the [ADR template](./ADR/templates/ADR-template.md). An ADR records context, decision, alternatives, consequences, migration, and verification.

## Incident and vulnerability policy

Security issues follow `SECURITY.md` and are never disclosed through a public issue. Production incidents require an owner, timeline, impact, mitigation, verification, and follow-up issue. Preserve audit records and redact credentials.

## Status integrity

Only call a capability “verified” when the evidence in [RELEASE-EVIDENCE.md](./RELEASE-EVIDENCE.md) exists. Product documents, screenshots, registry entries, and page loads are not substitutes for execution proof.
