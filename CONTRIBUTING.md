# Contributing to AmbiOS AI

## Before you start

Read the [Code of Conduct](./CODE_OF_CONDUCT.md) and check existing issues before starting substantial work. For security issues, use [SECURITY.md](./SECURITY.md) instead of opening a public issue.

## Development

```sh
pnpm install
cp .env.example .env
pnpm dev:web
```

Keep changes focused and reuse existing patterns. Do not commit secrets, generated build output, or unrelated formatting changes.

## Verification

```sh
pnpm check-types
pnpm test
pnpm build
pnpm lint
```

Describe the user-visible result, tests run, configuration changes, and known limitations in the pull request.
