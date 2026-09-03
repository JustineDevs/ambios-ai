# ADR 017: Sage Vendor Evidence Register

**Status:** Conditional approval for architecture; implementation and release remain gated  
**Date:** 2026-09-01  
**Scope:** WebMCP, ChatGPT Apps/MCP, Cloudflare Browser Run, Nango, Render, GitHub security APIs, Snyk, and Socket.dev

## Decision

Retain the current vendor choices for the AmbiOS MVP, with strict boundaries:

- AmbiOS owns the policy, identity, tenant scope, normalized capability registry, audit, and user experience.
- Nango owns user connector authorization and credential handling for supported external accounts.
- ChatGPT Apps/MCP and browser WebMCP are interaction surfaces, not authorization systems.
- Cloudflare owns the public edge, Pages/Workers runtime, and optional Browser Run validation harness.
- Render owns long-running workflow execution through the separate `packages/workflows` service.
- GitHub, Snyk, and Socket remain authoritative sources for their respective security findings.

No alternative integration platform is approved in this lane. The evidence supports the architecture, but live deployment, OAuth, and compatible-browser execution are still required before release approval.

## Evidence matrix

| Decision | Exact local mapping | Primary evidence | Grade | Result |
| --- | --- | --- | --- | --- |
| Browser WebMCP registration | `webmcp/register.ts`, `apps/web/src/app/client-layout.tsx` | [Chrome WebMCP security](https://developer.chrome.com/docs/ai/webmcp/secure-tools), [Chrome WebMCP evals](https://developer.chrome.com/docs/ai/webmcp/evals) | PARTIAL | Correct direction; native runtime and probabilistic tool-selection evals remain external gates |
| WebMCP inspection and testing | `tests/webmcp-*`, `webmcp/VERIFICATION.md` | [Chrome DevTools WebMCP panel](https://developer.chrome.com/docs/devtools/application/webmcp) | VERIFIED | DevTools provides the required available-tool, invocation, schema, and failure visibility |
| Cloudflare browser validation | Cloudflare deployment and browser verification scripts | [Cloudflare Browser Run WebMCP](https://developers.cloudflare.com/browser-run/features/webmcp/) | VERIFIED | Appropriate for beta/lab validation; lab sessions must not be treated as production workloads |
| ChatGPT app entry | `/api/mcp`, OAuth metadata routes, MCP app docs | [OpenAI developer mode and MCP apps](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt), [Apps SDK](https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk) | VERIFIED | Remote MCP app is the correct ChatGPT integration boundary; availability and write actions depend on workspace plan/admin controls |
| Nango user integrations | `@nangohq/frontend`, `/api/nango/*`, Nango metadata tables | [Nango Frontend SDK](https://nango.dev/docs/reference/frontend/frontend-sdk), [Nango upstream repository](https://github.com/NangoHQ/nango) | VERIFIED | Hosted Connect UI and server-side proxy/functions match the intended credential boundary |
| Render long-running work | `packages/workflows`, `@renderinc/sdk` `^1.0.0` | [Render Workflows](https://render.com/docs/workflows), [TypeScript SDK](https://render.com/docs/workflows-sdk-typescript), [official SDK repository](https://github.com/render-oss/sdk) | PARTIAL | Correct service boundary and package; Workflows/SDK are early access and need task-run smoke evidence |
| GitHub security | `/api/integrations/github/security`, GitHub capability actions | [Dependabot REST API](https://docs.github.com/en/rest/dependabot), [fine-grained permissions](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens), [secret scanning REST API](https://docs.github.com/en/rest/secret-scanning/secret-scanning) | VERIFIED | Dependabot, code scanning, and secret scanning correctly belong under GitHub authorization |
| Snyk findings | `/api/integrations/snyk/vulnerabilities` and shared security wrapper | [Snyk REST API](https://docs.snyk.io/snyk-api/rest-api), [Snyk issues API](https://docs.snyk.io/snyk-api/reference/issues) | PARTIAL | Vendor endpoint is authoritative, but the current route must resolve `{org_id}`, API version, and region explicitly |
| Socket package analysis | `/api/integrations/socket/analyze` and package input schema | [Socket PURL](https://docs.socket.dev/reference/socket-package-urls-purl), [Socket package analysis](https://docs.socket.dev/docs/socket-package) | PARTIAL | PURL approach is correct; upstream adapter status, URL encoding, and response contract need verification |

## Exact upstream mappings

| Local dependency or surface | Upstream mapping |
| --- | --- |
| `@nangohq/frontend` | [NangoHQ/nango](https://github.com/NangoHQ/nango), [Frontend SDK reference](https://nango.dev/docs/reference/frontend/frontend-sdk) |
| `@renderinc/sdk` | [render-oss/sdk](https://github.com/render-oss/sdk), [Render TypeScript Workflow SDK](https://render.com/docs/workflows-sdk-typescript) |
| `@opennextjs/cloudflare` | [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare) |
| `wrangler` and Cloudflare bindings | [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/) |
| `@modelcontextprotocol/server` | [MCP TypeScript SDK repository](https://github.com/modelcontextprotocol/typescript-sdk), [Cloudflare tool guidance](https://developers.cloudflare.com/agents/model-context-protocol/protocol/tools/) |
| Native WebMCP API | [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp/), [WebMCP explainer](https://github.com/webmachinelearning/webmachinelearning.github.io/tree/main/webmcp) |

## Recommendations

1. Keep the capability registry as the single source for tool names, ownership, risk, approval, endpoint, and availability. Generate or test REST and WebMCP contracts against it.
2. Keep ChatGPT app MCP and native page WebMCP as separate adapters over the same server-side policy boundary. Do not make either browser surface a second auth layer.
3. Use Cloudflare Browser Run lab sessions only for compatibility and end-to-end verification. Do not use the lab runtime as evidence of stable production browser support.
4. Keep Render out of user connector OAuth. Trigger allow-listed workflow tasks from a server-side runtime boundary, persist a correlation ID, and map asynchronous task states into AmbiOS Runs.
5. Treat Snyk and Socket as `metadata-only` until each upstream request, authentication path, response schema, pagination behavior, and error mapping has a passing contract test.
6. Use GitHub’s least-privilege permissions for the exact repository security capabilities requested. Secret-scanning responses must be redacted and must never be copied into prompts, client payloads, or audit records.

## Blockers to promote evidence to release approval

- No live authenticated WebMCP execution has been proven on the deployed HTTPS origin.
- Cloudflare deployment currently has a documented Worker size/budget blocker and two competing Wrangler ownership paths.
- Render workflow task registration and task-run status have not been smoke-tested against a deployed workflow service.
- Snyk organization resolution, region selection, and API version are not yet explicit in the route contract.
- Socket adapter behavior and exact upstream response validation are not yet proven.
- ChatGPT custom-app availability, OAuth, and write-action behavior depend on account/workspace configuration outside the repository.

## Next allowed trigger

`$flow` — model the verified and conditional vendor operations as explicit states, including connector authorization, read, proposal, approval, asynchronous Render execution, retry, failure, and rollback.
