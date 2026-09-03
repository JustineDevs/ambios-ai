# Authentication and API security findings

Review date: 2026-09-03  
Scope: Next.js middleware and routes, Core Worker, Connector Worker, MCP/OAuth, canonical operation registry, OpenAPI, and browser API callers.

This matrix is an implementation ledger. A route is not considered live merely because it is present in the registry or returns HTTP 200; the implementation and deployed behavior must satisfy the listed control.

## Route-family matrix

| Surface | Inventory evidence | Finding | Severity | Required correction | Current evidence |
|---|---|---|---|---|---|
| Next protected pages | `apps/web/src/proxy.ts`, Supabase middleware | Protected page redirects work; middleware is the primary page guard | High | Keep server session refresh and add protected-route regression coverage | Local `/agent` redirected to `/login` with auth enabled |
| Next `/api` proxy | `apps/web/src/app/api/[...path]/route.ts` | Owner routing was prefix-based and errors were ad hoc JSON | High | Resolve target from operation metadata and return problem responses | Source audit passes path inventory; owner parity remains under repair |
| Next agent chat | `agentChat` | Bearer presence was accepted without Supabase validation; raw stream errors could leak | Critical | Validate the bearer with Supabase and emit safe problem/stream errors | Implemented locally; typecheck pending final suite |
| Core health/readiness | `getCoreHealth`, `getHealth`, `getReadiness` | Duplicate health semantics and readiness can be synthetic | High | Give each health operation an unambiguous owner; readiness must use persisted state | Registry/OpenAPI parity passes; semantic/deployed proof pending |
| Workspace/identity | `getWorkspace`, `createWorkspace`, `getIdentity` | First-membership selection and manual body handling weaken tenant guarantees | Critical | Bind explicit workspace, strict schemas, object authorization, audit mutations | Finding confirmed by route roast |
| Incidents/actions/approvals | `listIncidents`, `createIncident`, `listActions`, hotfix/deploy operations | Manual validation and incomplete exact-approval enforcement | Critical | Shared schemas, state machine, policy/approval/revision/idempotency checks | Finding confirmed by route roast |
| Provider integrations | `listIntegrations`, connect/verify/disconnect, provider actions | Core/Connector duplicates; wildcard provider action accepts broad input | Critical | One owner per operation, strict provider action schemas, capability/mapping checks | Finding confirmed; provider details are not fully mounted |
| Canvas/console/runs/audit | Canvas, console, runs, audit operations | Several handlers use plain JSON errors or incomplete pagination | High | Shared problem responses, bounded cursors, scoped records, persisted projection | Finding confirmed by route roast |
| Connector webhook | `nangoWebhook` | Signature comparison lacks replay protection and constant-time verification; malformed JSON can 500 | Critical | Verify timestamp/signature safely, parse failures as structured errors, idempotent event handling | Finding confirmed by route roast |
| MCP metadata | metadata operations | Vercel has not routed metadata/MCP paths to the Worker | Critical | Registry-driven rewrites to the canonical MCP origin; deployed metadata parity | Local rewrite added; deployed evidence pending |
| MCP authorization | authorize/register/consent | Workspace is selected from first membership; DCR is too permissive; state/client scope binding incomplete | Critical | Bind client, redirect, resource, scopes, user, org, workspace, PKCE, expiry; strict redirect allowlist | Finding confirmed by OAuth roast |
| MCP token exchange | `mcpToken` | Code and refresh consumption require atomic affected-row checks | Critical | Compare-and-consume transaction/conditional update and race tests | Finding confirmed; repair pending |
| MCP calls | `mcp` | Arbitrary arguments and generic fallthrough can misrepresent tool execution | Critical | Strict tool registry/schema dispatch; reject unsupported tools; revalidate membership and scopes | Finding confirmed by OAuth roast |
| OAuth callback | Supabase callback | Redirect handling can rely on request-derived origin | High | Redirect only to canonical configured application origin | Existing allowlist is incomplete; repair pending |

## Cross-cutting control matrix

| Control | Required invariant | Finding | Fix lane |
|---|---|---|---|
| Authentication | Every protected operation receives a verified Supabase principal | Agent route accepted bearer presence only; some handlers inspect headers directly | Auth hardening |
| Organization/workspace scope | Scope is derived from the principal and explicit workspace, never request/model input | First organization membership is used repeatedly | Tenant authorization |
| Role/capability | Mutation requires server-side role and capability checks | Several mutation routes rely on global auth only | API hardening |
| Input schemas | Body/query/params use strict schemas with unknown keys rejected | Manual parsing and broad `Record<string, unknown>` exist | Contract hardening |
| Errors | API errors use `application/problem+json`; OAuth errors remain standards-shaped | Connector and Next routes emit `{code,error}` | Error standardization |
| Idempotency | Connect, sync, approval, queue, webhook, and execution retries are safe | Multiple operations lack effective idempotency | Lifecycle hardening |
| Rate limiting | Auth, DCR, provider, webhook, and mutation surfaces are bounded | Registry metadata is not equivalent to enforcement | Abuse protection |
| Audit | Material state transitions persist actor, scope, operation, status, and safe target | Some handlers write incomplete or synthetic records | Audit hardening |
| Privacy | Public responses use safe schemas and exclude secrets/internal IDs | Agent, MCP, setup, and provider outputs have leak paths | Privacy hardening |
| Registry parity | Every mounted route and OpenAPI operation maps exactly to one registry operation | 116 definitions vs 60 detected mounts; wildcard/duplicate ownership | Route inventory repair |
| Origin integrity | Vercel, Worker, MCP resource, OAuth issuer, metadata, and rewrites agree | Deployed Vercel MCP paths returned HTML 404 | Deployment repair |
| OAuth | Exact resource, explicit scopes, PKCE S256, strict redirect, single-use code, workspace binding | Several controls are partial | OAuth repair |

## Standards basis

- OAuth 2.0 Security Best Current Practice: https://www.rfc-editor.org/info/rfc9700/
- PKCE: https://www.rfc-editor.org/info/rfc7636/
- Problem Details for HTTP APIs: https://www.rfc-editor.org/rfc/rfc9457.html
- OWASP API Security Top 10: https://owasp.org/API-Security/

## Completion rule

Each row remains open until code-level tests and deployed evidence prove the invariant. Green registry/OpenAPI checks alone do not close a security finding.
