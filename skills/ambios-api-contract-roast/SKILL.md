---
name: ambios-api-contract-roast
description: Audit every documented API operation against its real implementation and repair confirmed contract, auth, scope, validation, error, lifecycle, and audit drift. Use for OpenAPI, Hono, Next API, MCP, or provider-route work.
metadata:
  short-description: Adversarial operation-level API audit and repair
---

# API contract roast

Read [package-contract.md](../_shared/package-contract.md), [verification-protocol.md](../_shared/references/verification-protocol.md), and [operation-matrix.md](references/operation-matrix.md). Treat OpenAPI as binding, then enumerate documented and discovered routes.

## Pipeline

1. Parse method, path, parameters, request body, status codes, content type, and response/error schemas.
2. Trace every caller: typed client, server action, page, WebMCP tool, rewrite, worker, queue, and provider adapter. Flag stale paths and undocumented behavior.
3. Roast independently for schema/serialization, auth/scope, mutation safety, persistence/lifecycle, errors/redaction, pagination/limits, and deployment routing. Every candidate needs a concrete request/state → wrong-result scenario.
4. Deduplicate, then classify each candidate `confirmed`, `plausible`, or `refuted`; preserve verifier evidence.
5. Repair the canonical boundary with strict schemas, server-side identity/org/workspace/role/capability/resource checks, stable errors, request IDs, idempotency, concurrency protection, audit events, and normalized output.
6. Probe success, validation failure, unauthorized, forbidden, unsupported, dependency failure, and retry behavior. Re-run contract alignment after edits.

## Consequential operations

Persist intent before enqueue or provider write. Bind approval to exact action, capability, target, canonical argument hash, resource version, actor scope, policy result, expiry, and single-use state. Revalidate immediately before execution. Denial must prove no external write; execution must produce independent verification and audit evidence.

## Required result

Produce the operation matrix, root causes, patch/test files, probe evidence, unsupported operations, and a receipt conforming to [output-schema.json](references/output-schema.json). Use [error-contract.md](references/error-contract.md) for safe response semantics. Never return HTML or raw provider errors from an API path.
