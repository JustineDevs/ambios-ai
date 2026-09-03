# AmbiOS AI onboarding

Welcome. This page routes you to the right starting point.

| You are here to… | Start here |
| --- | --- |
| Build or debug the product | [Developer onboarding](./DEVELOPER-ONBOARDING.md) |
| Submit a change | [Contributor onboarding](./CONTRIBUTOR-ONBOARDING.md) |
| Evaluate the project or a demo | [Judge onboarding](./JUDGE-ONBOARDING.md) |

For implementation and review rules, read [Engineering standards](./ENGINEERING-STANDARDS.md), [Governance](./GOVERNANCE.md), and the [Development process](./DEVELOPMENT-PROCESS.md). For release claims, use [Feature status](./FEATURE-STATUS.md), [Release evidence](./RELEASE-EVIDENCE.md), and [CI/CD operations](./CI-CD.md).

## One architectural fact to remember

AmbiOS runs locally as a Next.js frontend and two Cloudflare Worker processes; in production, the frontend is hosted on Vercel and the Workers are deployed separately:

```text
Browser → Vercel Next.js → Core Hono Worker → D1/KV/R2/Queue
                              ↘ Connector Hono Worker → Nango/providers
```

The browser UI and Workers are separate applications. A successful page load does not prove that an API operation is implemented; use the route and Worker smoke checks.

## Current evidence vocabulary

- **Implemented** — code exists and a local check exercises it.
- **Unverified** — code or metadata exists, but the required runtime/provider evidence is missing.
- **Not configured** — a required binding, secret, or external account is absent.
- **Unsupported** — the current Worker returns a structured 501; do not present it as live.
- **External evidence required** — deployment, OAuth consent, or a compatible HTTPS WebMCP runtime is needed.

Read [Architecture](../ARCHITECTURE.md) and the [current API contract](../openapi.yaml) before changing runtime boundaries.
