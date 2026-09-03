# Contributing to AmbiOS AI

## Before you start

Read the [Code of Conduct](CODE_OF_CONDUCT.md) and check existing issues before starting substantial work. For security issues, use [SECURITY.md](SECURITY.md) instead of opening a public issue.

Start with the [contributor onboarding guide](docs/CONTRIBUTOR-ONBOARDING.md) for the current Next.js + Hono runtime boundary, evidence vocabulary, and verification checklist.

Read the [engineering standards](docs/ENGINEERING-STANDARDS.md), [governance rules](docs/GOVERNANCE.md), and [development process](docs/DEVELOPMENT-PROCESS.md) before making a change that affects runtime behavior, security, data, providers, or WebMCP.

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
pnpm webmcp:browser-verify
pnpm production:gate
```

Describe the user-visible result, tests run, configuration changes, and known limitations in the pull request.
