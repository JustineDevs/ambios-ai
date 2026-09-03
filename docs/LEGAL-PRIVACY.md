# AmbiOS legal, privacy, and support register

**Status:** Engineering baseline — counsel review required before external legal or compliance claims.

This register describes the current product boundary. It is not a privacy notice, legal opinion, or substitute for a qualified data-protection review.

## Processing register

| Activity | Purpose | Data categories | Storage/recipient | Retention decision |
| --- | --- | --- | --- | --- |
| Account and workspace access | Authenticate a user and scope workspaces | Provider subject ID, email/name when supplied, membership role | Supabase Auth and tenant-scoped D1 metadata | Account lifetime plus a counsel-approved support period; exact period is `[VERIFY]` |
| Connector lifecycle | Start, reconcile, disconnect, and report vendor connections | Provider, connection ID, status, scopes, sync timestamps, bounded errors | D1 metadata; Nango/provider handles credentials | Connection lifetime plus documented cleanup window; exact period is `[VERIFY]` |
| Operations and audit | Explain governed actions and approvals | Actor reference, tool/resource reference, decision/status, bounded summaries | Append-only operational records in D1 | Preserve only as required; anonymize subject references on erasure where retention is required |
| Support and rights requests | Resolve product issues and verify rights requests | Minimum request details and contact information | Support mailbox/process; never secrets or full vendor payloads | Delete or anonymize after a counsel-approved period; exact period is `[VERIFY]` |

## Rights process

The Support page provides a human process for access/portability, correction, restriction, objection, and erasure. Requests are identity-verified before disclosure or deletion. The operator must record request date, type, verification state, deadline, stores checked, third-party follow-up, completion date, and outcome in the approved back-office tracker.

The canonical Next.js frontend does not claim that an automated DSR worker is mounted. Production implementation must connect the tracker to every store in the data map, anonymize retained audit records, purge caches/object copies, and document vendor-side deletion and backup expiry.

## Risk assessment

| Risk | Likelihood | Impact | Rating | Control/owner |
| --- | --- | --- | --- | --- |
| Provider credential appears in UI, WebMCP output, or logs | Possible | Severe | High | Server-owned Nango boundary, redaction, secret scanning; platform engineering |
| Tenant metadata crosses organization boundaries | Unlikely | Severe | High | Server-side session and membership checks; platform engineering |
| Third-party content injects instructions into an agent workflow | Possible | Major | High | Treat vendor content as untrusted; approval policy and audit; agent platform |
| Retention period is undefined for support or audit data | Likely | Major | High | Periods are marked `[VERIFY]`; counsel/privacy owner must approve |
| User cannot complete a rights request | Possible | Major | High | Support route and documented tracker process; operations owner |

Risk ratings use likelihood × impact and must be reassessed when a new vendor, data category, or automated decision is introduced. No row is evidence that a legal obligation has been satisfied.

## Security rules

- Never put access tokens, API keys, passwords, OAuth codes, or full personal data in URLs, logs, support mail, model transcripts, or WebMCP tool results.
- Use TLS-only production endpoints and server-side secret storage.
- Validate tenant and provider-connection ownership before reads or writes.
- Keep analytics/marketing collection opt-in and separate from service access if introduced.
- Use synthetic data in tests and run secret/dependency scanning in CI.
