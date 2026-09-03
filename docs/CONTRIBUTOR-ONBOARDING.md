# Contributor onboarding

AmbiOS contributions should be small enough to review and complete enough to verify. Start with the owning boundary, not with a new abstraction.

## Before editing

1. Read [Developer onboarding](./DEVELOPER-ONBOARDING.md) and [Engineering standards](./ENGINEERING-STANDARDS.md).
2. Search for the existing route, schema, type, client, status, and test before adding another one.
3. Check [Feature status](./FEATURE-STATUS.md) and the relevant [ADR](./ADR/README.md).
4. Confirm whether the change belongs to Next.js, the Core Worker, the Connector Worker, shared packages, WebMCP, infrastructure, or documentation.

Do not reset or reformat unrelated working-tree changes.

## Change requirements

| Area | Required with the change |
| --- | --- |
| UI | Real backend state, reachable loading/empty/error/retry states, keyboard and screen-reader access |
| Core API | Validated input, server-side scope checks, structured errors, bounded output, OpenAPI alignment |
| Connector/provider | Secret isolation, capability/resource checks, idempotency, retry behavior, independent verification |
| Mutation | Exact approval binding, persisted lifecycle, audit event, and denial/no-write coverage |
| WebMCP | Feature detection, canonical tool contract, safe output, truthful annotations, registration and authorization tests |
| Schema/config | Forward migration, environment validation, deployment impact, and rollback note where applicable |

## Verification

```sh
pnpm check-types
pnpm lint
pnpm test
pnpm build
pnpm production:gate
git diff --check
```

Run focused route, browser, security, or provider tests as appropriate. Separate local results from deployed HTTPS, authenticated, and external-provider evidence. A successful build is not proof that a provider or MCP client can use the feature.

## Pull request handoff

Include:

- the problem and bounded solution;
- changed runtime boundaries and user-visible states;
- auth, scope, privacy, audit, and side-effect impact;
- commands and test results;
- deployed or external evidence, or a precise limitation;
- migration, release, and rollback considerations.

Report security issues through [SECURITY.md](../SECURITY.md), not a public issue. Follow the [Code of Conduct](../CODE_OF_CONDUCT.md).
