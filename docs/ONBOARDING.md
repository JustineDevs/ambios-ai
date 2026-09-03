# AmbiOS AI onboarding

Choose the path that matches what you need to do:

| Goal | Guide |
| --- | --- |
| Understand the product or review a release | [Judge onboarding](./JUDGE-ONBOARDING.md) |
| Run and change the code | [Developer onboarding](./DEVELOPER-ONBOARDING.md) |
| Submit a focused contribution | [Contributor onboarding](./CONTRIBUTOR-ONBOARDING.md) |

The project has one browser application and two backend Workers:

```text
Browser → Next.js on Vercel → Core Hono Worker → D1 / KV / R2 / Queue
                                      ↘ Connector Hono Worker → Nango / providers
```

The browser renders the product and registers WebMCP when the compatible browser API is available. The Core Worker owns identity, workspace scope, domain reads, policy, approvals, audit, and queue production. The Connector Worker owns provider calls, webhooks, retries, verification, and queue consumption. The browser and model never grant themselves authority.

Use the vocabulary in [Feature status](./FEATURE-STATUS.md) when describing what exists. A page loading or a local test passing is not deployment, provider, or authenticated WebMCP evidence. Current proof is recorded in [Release evidence](./RELEASE-EVIDENCE.md) and [WebMCP verification](../webmcp/VERIFICATION.md).

Before changing a runtime boundary, data model, auth rule, provider scope, WebMCP contract, or deployment path, read [Architecture](../ARCHITECTURE.md), the applicable [ADR](./ADR/README.md), and [Engineering standards](./ENGINEERING-STANDARDS.md).
