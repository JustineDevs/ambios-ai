# Contributor onboarding

This is the short path for someone making a safe, reviewable contribution.

## Before editing

1. Read [Developer onboarding](./DEVELOPER-ONBOARDING.md).
2. Search existing code before introducing a new utility, route, type, or dependency.
3. Check the relevant ADR and current [OpenAPI contract](../openapi.yaml).
4. Confirm whether the change belongs to the Next.js frontend, Core/Connector Hono Worker, shared packages, WebMCP registry, or documentation.

Keep the diff narrow. Existing uncommitted work belongs to the workspace owner; do not reset, reformat, or delete unrelated changes.

## Change rules

### Frontend

- Render server-backed state, not fixture success.
- Show loading, empty, unavailable, unsupported, error, retry, and success states where the route can reach them.
- Use semantic buttons and links, keyboard-accessible controls, visible focus, and inline actionable errors.
- Never place secrets, OAuth payloads, or provider responses in browser state or URLs.

### Worker/API

- Validate inputs at the boundary with the project’s schema conventions.
- Enforce authentication and organization scope on the server.
- Return structured JSON errors with truthful HTTP status codes.
- Redact and bound outputs before persistence or WebMCP return.
- Add audit and operation lineage for governed mutations.
- Add or update OpenAPI at the same time as the route.

### WebMCP

- Feature-detect `navigator.modelContext` and avoid duplicate registration.
- Keep tool schemas descriptive but never treat them as authorization.
- Use same-origin credentialed calls and return safe structured errors.
- Distinguish the root 29-tool contract registry from the current frontend’s 2 mounted tools; update both only when the capability is genuinely mounted and verified.

### Configuration

- Do not edit `.env.local` unless the task explicitly requires it.
- Do not commit secrets or paste them into issues, logs, screenshots, or audit records.
- Keep local HTTP behavior usable; enforce HTTPS at the production edge/runtime boundary.

## Verification checklist

Run from the repository root:

```sh
pnpm check-types
pnpm lint
pnpm test
AMBIOS_TEST_URL=http://localhost:3000 pnpm webmcp:browser-verify
pnpm build
git diff --check
```

Start the local backend pair when testing API-backed behavior:

```sh
pnpm dev:core
pnpm dev:connector
```

For route changes, also verify:

```sh
curl -i http://127.0.0.1:8787/api/health
curl -i http://127.0.0.1:8787/api/readiness
curl -i http://127.0.0.1:8787/api/not-yet-mounted
```

The last request must remain a structured 501 until the route is implemented. Do not “fix” a failing check by weakening the contract.

## Pull request handoff

Describe the cause, the bounded fix, and evidence. Include:

- changed files and architectural seam,
- user flow and state changes,
- security/auth implications,
- exact verification commands and results,
- local-only versus external/deployed evidence,
- known limitations.

For security vulnerabilities, follow [SECURITY.md](../SECURITY.md) instead of filing a public issue. Follow the [Code of Conduct](../CODE_OF_CONDUCT.md) in all project spaces.
