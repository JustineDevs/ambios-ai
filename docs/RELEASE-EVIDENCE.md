# Release evidence

Each release candidate gets an evidence record containing:

- commit SHA and build timestamp;
- commands and pass/fail outputs;
- frontend and Worker URLs;
- route smoke results and response codes;
- database migration version and binding readiness;
- WebMCP registry count, mounted-tool count, and browser evidence;
- authentication/session result;
- provider connection, capability, mapping, and redaction evidence;
- approval denial/no-write, exact-scope, expiry, execution, verification, and audit evidence;
- bundle-size measurements;
- unresolved blockers and their truthful feature statuses.

## Gate interpretation

`pnpm production:gate` is a repository gate. It covers code quality, build, contract checks, WebMCP checks, bundle budgets, and generated-artifact hygiene. It does not prove external OAuth, Nango, Cloudflare deployment, production D1 state, or native HTTPS WebMCP execution.

## Claim rule

Every public feature claim must link to an implementation and an evidence item. If either is absent, use `unverified`, `unsupported`, `not configured`, `roadmap`, or `external evidence required`.
