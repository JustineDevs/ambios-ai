# ChatGPT MCP OAuth drift matrix

This is the source-of-truth repair register for the ChatGPT account bridge.
Only findings with code, documentation, and verification evidence are marked
resolved.

| ID | Finding | Correction | Evidence | Status |
| --- | --- | --- | --- | --- |
| MCP-001 | ChatGPT was described as separate from an internal model path | Product copy now says users bring their own ChatGPT account and AmbiOS remains the authority | `docs/integrations/chatgpt-mcp.md`, Agent setup copy | Resolved |
| MCP-002 | WebMCP and remote MCP OAuth were conflated | Documentation and code comments define browser-local WebMCP separately from remote OAuth | `docs/integrations/chatgpt-mcp.md`, `src/hono-app.ts` | Resolved |
| MCP-003 | OAuth used a broad `mcp` scope | Explicit least-privilege scopes are parsed, persisted, advertised, and enforced per tool | `packages/shared/mcp-resource-registry.ts`, `src/mcp-oauth.ts`, `src/mcp-routes.ts` | Resolved locally; production redeploy and OpenAI rescan required |
| MCP-004 | Tool discovery did not filter by granted scope | Discovery and `tools/list` expose only tools allowed by the access token | `src/mcp-routes.ts` | Resolved |
| MCP-005 | Opaque credentials were not explicitly authority-bound | Access and refresh records persist issuer/audience; lookup rejects mismatches | migration `0011_mcp_token_authority.sql`, `src/mcp-oauth.ts` | Resolved |
| MCP-006 | OAuth lifecycle had no revocation endpoint | `/revoke` invalidates the presented access token and associated refresh sessions | `src/mcp-routes.ts`, OpenAPI | Resolved |
| MCP-007 | OAuth events were not represented in the audit stream | Consent, issuance, rotation, and revocation create durable MCP audit actions | `src/mcp-routes.ts` | Resolved |
| MCP-008 | Plugin readiness could crash when requirements were absent | Requirements are normalized and rendered with an empty-array guard | `apps/web/src/app/(dashboard)/plugins/page.tsx` | Resolved |
| MCP-009 | Public docs overstated live ChatGPT/WebMCP/provider support | Support labels now distinguish Live, Unsupported, Unverified, and Not configured | `docs/integrations/chatgpt-mcp.md` | Resolved |

## Verification record

- `pnpm lint` — passed.
- `pnpm --filter web check-types` — passed.
- `pnpm check-worker` — passed.
- `pnpm webmcp:evals` — passed, 7 cases / 9 tools.
- `pnpm webmcp:verify` — passed, 29 contract tools.
- Local route sweep — passed for the authenticated dashboard route inventory.

Production ChatGPT OAuth and provider-side execution remain evidence-gated:
they may only be labeled `Live` after a deployed HTTPS consent, token,
scoped-call, revocation, and independent provider verification run is recorded.
