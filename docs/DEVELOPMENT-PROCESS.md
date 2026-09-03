# Development process

```text
Issue → scope and status → design/security review → ADR when required
      → implementation → focused tests → contract/UI/docs update
      → full checks → review → merge → deploy → smoke test → evidence update
```

## Before coding

State the user outcome, owning runtime, contract and data changes, authorization scope, failure states, audit requirements, and acceptance evidence. Search for existing routes, schemas, clients, types, and utilities. Check [Feature status](./FEATURE-STATUS.md) and the relevant [ADR](./ADR/README.md).

## During implementation

Keep the change narrow and update all affected surfaces together: implementation, schema, OpenAPI, UI states, WebMCP metadata, migrations, tests, and documentation. Do not broaden provider permissions, add a duplicate runtime, or change environment behavior silently.

## Before merge

Run focused checks, then the repository gate:

```sh
pnpm check-types
pnpm lint
pnpm test
pnpm build
pnpm production:gate
```

Attach command results and identify which claims are local-only, deployed, authenticated, provider-backed, or compatible-browser evidence.

## Release

The release owner runs Cloudflare preflight, deploys the Vercel UI and both Hono Workers through the supported scripts, applies forward-only migrations, probes health/readiness and protected boundaries, and records the commit, deployment versions, migration state, route results, bundle sizes, and remaining limitations in [Release evidence](./RELEASE-EVIDENCE.md).
