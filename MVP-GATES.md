# AmbiOS AI MVP gates

Last evidence refresh: 2026-09-03. Status vocabulary: `PASS` means the stated scope has fresh evidence, `BLOCKED` means required external evidence is unavailable, and `FAIL` means a check was attempted and did not meet its requirement. Deployment is verified for the recorded Vercel and Cloudflare endpoints; browser WebMCP, OAuth, and live provider gates remain external where explicitly noted.

| Gate | Status | Evidence / remaining proof |
| --- | --- | --- |
| 1 WebMCP | PASS | 29 tools register through `navigator.modelContext`; canonical names, schemas, annotations, lifecycle cleanup, and structured invalid-input responses pass `pnpm webmcp:verify`. Live ChatGPT/Chrome invocation remains external. |
| 2 Deployment | PASS | Vercel serves the Next.js app and both Hono Workers are deployed and healthy; route and Worker evidence is recorded in `webmcp/VERIFICATION.md`. |
| 3 Auth/RBAC | BLOCKED | Google-only Supabase flow, server session checks, organization scoping, and first-workspace bootstrap exist. Cross-organization behavior needs two authenticated users in a real Supabase environment. |
| 4 Hot-fix | BLOCKED | Context, suggestions, approval, guarded apply, incident update, action/doc records, and budget settlement exist. Provider-backed execution and live-agent proof remain open. |
| 5 Guardrails | PASS | Persisted policy evaluation, production approval requirement, denial, approval token, and audit decisions are implemented; authenticated end-to-end approval needs live credentials. |
| 6 Audit console | PASS | Append-only D1 action records include actor, inputs, outputs, status, guardrails, approval, and resource fields; console route and UI exist. Five-action live evidence remains open. |
| 7 Budget | PASS | Seeded free credits, atomic reservation condition, settlement, spend log, check API, and persisted budget UI are implemented and type/build tested. |
| 8 Docs | PASS | Proposal API, tenant scope, idempotency, rationale/version fields, review authorization, and approval version increment exist. Authenticated UI review needs live session evidence. |
| 9 Nango | BLOCKED | REST client, Notion connect/status, signed webhook dedupe, metadata-only persistence, and queue dispatch exist. Provider credentials and a real sync are unavailable here. |
| 10 Security | PASS (local) | Zod boundaries, server auth, tenant filters, Nango-only user connectors, no checked-in secrets, HTTPS WebMCP origin enforcement, KV rate limits, HMAC webhook verification, Sage fail-closed decisions, and invalid-input tests pass. |
| 11 Demo docs | EXTERNAL EVIDENCE REQUIRED | README, demo/pitch docs, route inventory, and gate log exist. A live authenticated demo account and unfamiliar-user rehearsal still require human OAuth/browser verification. |
| 12 Verification loop | EXTERNAL EVIDENCE REQUIRED | Repository checks and deployed route/health evidence pass. Native authenticated WebMCP browser execution still requires a compatible HTTPS runtime and session. |
| 13 Snyk | BLOCKED | No authenticated Snyk provider result and corresponding AmbiOS audit evidence are recorded. |
| 14 Socket.dev | BLOCKED | No authenticated Socket.dev provider result and corresponding AmbiOS audit evidence are recorded. |

## Local command evidence

```text
pnpm --filter web check-types       PASS
pnpm --filter web test              PASS (current suite; see command output for count)
pnpm webmcp:verify                  PASS (29 tools)
pnpm --filter web build             PASS (all listed API and dashboard routes compiled)
pnpm build  PASS (Next.js build + Hono typecheck)
Vercel deployment                         EXTERNAL EVIDENCE REQUIRED (record URL and deployment ID per release)
wrangler r2 bucket create ambios-artifacts  PASS (resource provisioning evidence)
wrangler queues create ambios-jobs           PASS (resource provisioning evidence)
wrangler d1 execute ... --local              PASS (31 commands)
targeted biome checks               PASS
pnpm lint                           PASS (494 files)
```

This file intentionally does not mark external gates as passed without the required deployed HTTPS browser and provider evidence.
