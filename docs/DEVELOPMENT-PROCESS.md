# Development process

```text
Issue → scope and status → design/threat review → ADR if needed
     → implementation → focused tests → contract/UI updates
     → full checks → evidence review → pull request → merge
     → deploy → post-deploy smoke → status update
```

## Before coding

Define the user outcome, owning boundary, data changes, auth/scope, failure states, audit requirements, and acceptance evidence. Search for existing utilities and check [FEATURE-STATUS.md](./FEATURE-STATUS.md).

## During coding

Keep changes narrow. Update implementation, OpenAPI, UI state, WebMCP metadata, migrations, and tests in the same change when applicable. Do not silently broaden provider scopes or change `.env.local`.

## Before merge

Run targeted checks and then:

```sh
pnpm check-types
pnpm lint
pnpm test
pnpm webmcp:browser-verify
pnpm build
pnpm production:gate
```

Attach exact outputs and distinguish local proof from external proof.

## Release flow

Run Cloudflare preflight, deploy the static UI and Worker through their supported scripts, apply migrations, smoke health/readiness/API routes, verify the deployed UI, and record deployment URL, commit, timestamp, migration version, and remaining blockers.
