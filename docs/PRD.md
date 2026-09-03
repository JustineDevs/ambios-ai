# AmbiOS AI product requirements

**Status:** Working product specification (implementation status is authoritative in `docs/FEATURE-STATUS.md`)
**Last aligned:** 2026-09-03
**Browser UI:** https://ambios-ai.vercel.app
**Core API:** https://ambios-ai.pcg0255.workers.dev
**Connector/Execution:** https://ambios-ai-connector.pcg0255.workers.dev

## Product promise

AmbiOS is a governed workspace where people and agents inspect operational context, propose changes, obtain explicit approval, execute through controlled connectors, and verify outcomes. The human owns intent and authority; the agent contributes investigation and execution within declared capability and policy boundaries.

## Canonical architecture

```text
Browser → Vercel Next.js (`apps/web`)
        → same-origin rewrites for /api, /mcp, /health
        → Hono Core Worker (`src/worker.ts`)
        → Hono Connector/Execution Worker (`src/connector-worker.ts`)
        → D1 / KV / R2 / Queue / Supabase / Nango / providers
```

Vercel is the only frontend runtime. Cloudflare runs backend Workers only. The browser receives public Supabase configuration, never service keys, Nango secrets, provider tokens, or model API keys. Nango owns external provider credentials; D1 stores connection metadata, resource mappings, verification state, actions, and audit records.

## Primary user workflow

1. A user authenticates with Supabase and selects an authorized workspace.
2. The user or agent reads workspace, service, incident, and capability context.
3. The agent creates a structured proposal with exact capability, target, arguments, risk, and rollback information.
4. Core evaluates policy, budget, prerequisites, and approval requirements.
5. A required approval binds actor, workspace, capability, targets, canonical arguments hash, policy result, expiry, and single-use state.
6. Connector revalidates every binding immediately before provider execution.
7. Queue processing executes idempotently, independently verifies the result, and records every transition in D1.
8. Agent, Runs, Console, and Canvas surfaces project the same persisted action and audit state.

## Core requirements

### Identity and tenancy

- Supabase Auth is the identity authority.
- Every domain read and write is scoped to the authenticated organization/workspace.
- Unauthenticated or missing-binding requests fail closed with structured errors.
- Workspace bootstrap and readiness state are visible rather than hidden behind endless loading.

### Capability and WebMCP

- Tools use the `ambios.*` namespace and descriptive JSON schemas.
- Browser registration feature-detects the native WebMCP runtime and avoids duplicate registration.
- Tool schemas are discoverability contracts, not authorization; Worker authorization remains mandatory.
- The full contract registry is distinct from the smaller set of browser-mounted tools and from live provider capability.

### Action governance

Actions use the canonical lifecycle:

```text
DRAFT → CONTEXT_GATHERED → BLOCKED_MISSING_PREREQUISITE → PROPOSED
→ POLICY_EVALUATED → AWAITING_APPROVAL → APPROVED → QUEUED → EXECUTING
→ VERIFYING → SUCCEEDED | FAILED | PARTIALLY_SUCCEEDED | DENIED | CANCELLED | EXPIRED
```

Sensitive writes require policy evaluation and, when required, an exact server-bound approval. Denial creates audit evidence and cannot enqueue a provider write. Expired or reused approvals cannot execute.

### Connectors and external systems

- Nango handles provider connection lifecycle and credential storage.
- Connector handles OAuth lifecycle, webhook verification, provider calls, retries, execution, and independent verification.
- Provider status must be labeled `live`, `preview`, `sandbox`, `not configured`, `mocked`, `unverified`, `unsupported`, or `planned` as applicable.
- A connection becomes `connected · verified` only after a safe real read-only check succeeds.
- Webhooks validate raw signatures, timestamps/replay windows, and event/delivery deduplication before queueing normalized events.

### Operational canvas

The canvas is a client-side React Flow projection of persisted graph, action, and audit records. Nodes and edges must map to persisted objects and relationships. The client is never authoritative. Agent cursor movement is derived from persisted action/run events, not arbitrary user-pointer state.

## Current capability boundary

The repository currently proves the Next.js route surface, Hono health/readiness boundaries, D1 migration path, WebMCP contracts, mounted read-only browser tools, Nango catalog access, and Worker bundle budgets as documented in `webmcp/VERIFICATION.md`. Authenticated browser WebMCP invocation, human OAuth consent, and live provider execution require compatible HTTPS runtime evidence and must not be described as complete from configuration alone.

## Quality and release requirements

- Direct-load and refresh behavior must work for every listed UI route.
- Loading, empty, blocked, unauthorized, failure, retry, and success states must be explicit.
- API responses use typed contracts and truthful HTTP status codes; unsupported routes return structured `501` responses.
- Core and Connector Workers target less than 2.5 MiB gzip and must remain below the 3 MiB hard limit.
- Required checks include typecheck, lint, tests, Next production build, Worker budget checks, WebMCP verification/evals, route smoke, and release evidence review.

This document defines product intent and acceptance shape. For what is actually live, use `docs/FEATURE-STATUS.md` and `webmcp/VERIFICATION.md`.
