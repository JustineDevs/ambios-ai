# Feature status and evidence

This is the authoritative status vocabulary for product, UI, API, WebMCP, and judge claims.

| Status | Meaning | Allowed claim |
| --- | --- | --- |
| Implemented | Code exists and a local automated or runtime check exercises it | “Implemented locally” |
| Verified | Implemented plus required integration/browser/deployment evidence exists | “Verified” |
| Unverified | Code or metadata exists, but required proof is missing | “Unverified” |
| Not configured | Required binding, secret, account, or provider setup is absent | “Not configured” |
| Unsupported | Current runtime returns a structured `501` | “Unsupported” |
| External evidence required | Requires deployed HTTPS, OAuth, provider, or compatible browser proof | “External evidence required” |
| Roadmap | Product intent without a current implementation | “Planned” |

## Current release snapshot

| Surface | Current status | Evidence |
| --- | --- | --- |
| Next.js UI direct routes | Implemented locally | Browser/direct-load smoke |
| Hono health/readiness | Implemented locally | `curl` smoke |
| Identity/workspace adapters | Unsupported/unconfigured | Structured `401`/`501` responses |
| Incident/action/approval APIs | Implemented locally / unverified externally | Mounted Hono routes; D1-backed records and record-only action paths require runtime bindings; provider execution evidence is pending |
| WebMCP contract registry | Implemented locally | 29-tool contract verification |
| Frontend WebMCP mounting | Implemented locally | Current deployed verification records 18 mounted read-only tools; the source registry contract contains 29 tools, with capability filtering and write tools withheld from anonymous/read-only mounting |
| Authenticated WebMCP execution | External evidence required | HTTPS compatible-browser session |
| Nango provider workflows | Not configured/external evidence required | Real connection and mapping proof |
| Production deployment | Verified | Vercel UI and both Hono Worker endpoints are recorded in `webmcp/VERIFICATION.md` |
| Integration OAuth callback | Unsupported | `/oauth/callback` and `/api/auth/init-oauth` return structured `501` until a server-side token exchange, secret storage, and scoped connection flow is implemented |
| Legacy welcome tenant capture | Compatibility-only / unverified | The legacy client references retired `/v1/tenant-info`; no Worker route exists. Use authenticated `/api/workspace` setup. |

Claims in older PRD, pitch, ADR, or WebMCP documents must be read as target behavior unless this table and release evidence prove otherwise.
