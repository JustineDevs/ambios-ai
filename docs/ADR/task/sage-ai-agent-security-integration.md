# ADR: Mandatory SAGE governance gate

**Status:** Accepted and implemented
**Last updated:** 2026-09-03

## Decision

AmbiOS uses an internal, deterministic SAGE governance gate at the last trusted
boundary before provider execution. SAGE is mandatory for every connector
queue consumer and every direct provider action path. It is not a UI flag, a
frontend approval, a ChatGPT instruction, or an optional environment feature.

This implementation is intentionally dependency-free for Cloudflare Workers.
The repository does not claim that the external Gen Digital Sage package is
installed or active. The implemented control is the AmbiOS SAGE policy
contract in `packages/shared/sage-governance.ts`.

## Enforcement contract

Every decision receives the canonical operation ID, actor, organization,
workspace, capability, target, and canonical arguments. Consequential
execution additionally requires a server-validated exact approval, approval
reference hash, and arguments hash. The gate evaluates to:

- `ALLOW`: the request may proceed after the decision is durably persisted.
- `ASK`: execution is blocked until the exact human approval context exists.
- `DENY`: execution is blocked because the context is invalid or the payload
  matches a destructive/shell-execution rule.

The SAGE decision is persisted in D1 before any Nango/provider request. An
append-only `sage_governance` action record makes every decision visible in the
Runs and Console projections. If D1 is unavailable, SAGE fails closed and no
provider request is attempted. A denied queue message is acknowledged after
the operation is recorded as failed; it is never retried into a provider write.

## Trust boundary

```text
MCP / WebMCP / AmbiOS UI / queue
  → canonical identity, scope, policy, and approval checks
  → SAGE deterministic verdict (persisted in D1)
  → Connector Worker provider adapter
  → independent verification
  → audit and run projections
```

ChatGPT text, model output, client state, a provider connection, and a generic
`approved` boolean cannot bypass SAGE or authorize a provider write.

## Rules currently enforced

1. Missing actor, tenant, workspace, capability, target, or canonical
   arguments is `DENY`.
2. Bounded read-only operations are `ALLOW`.
3. Mutations and executions without exact server approval are `ASK`.
4. Destructive and shell-like payload patterns are `DENY`, even with an
   approval flag.
5. Provider execution can occur only after the persisted SAGE decision is
   `ALLOW`.

## Evidence

- Implementation: `packages/shared/sage-governance.ts` and
  `src/sage-governance.ts`.
- D1 migration: `packages/db/migrations/0014_sage_governance.sql`.
- Queue enforcement: `src/connector-worker.ts`.
- Direct provider enforcement: `src/hono-app.ts`.
- Regression tests: `tests/sage-governance.test.ts`.

The test suite covers read-only allow, missing approval, exact approval,
destructive payload denial, and invalid context denial. Deployment evidence
must include a fresh production Worker deployment and a persisted decision
record for a real authenticated operation. Provider success must still only be
claimed when provider authorization and independent verification exist.

## Explicit limitations

SAGE is an AmbiOS policy gate, not a general malware-reputation, URL-reputation,
or package-supply-chain scanner. Such analysis remains `Unsupported` unless a
separate reviewed implementation is added. This limitation does not weaken the
mandatory fail-closed execution boundary.
