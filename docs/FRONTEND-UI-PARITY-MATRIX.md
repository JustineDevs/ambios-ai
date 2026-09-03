# Frontend source-of-truth matrix

The only frontend is `apps/web`, deployed to Vercel. The interface uses the restored Next.js component tree and its existing primitives; Cloudflare Workers do not render UI.

| Surface | Canonical implementation | Backend boundary |
| --- | --- | --- |
| App shell, grouped sidebar, theme, plans | `apps/web/src/app/client-layout.tsx`, `apps/web/src/components/sidebar/` | Same-origin Next rewrites |
| Agent conversation and composer | `apps/web/src/components/agent/` | Core Worker APIs |
| Right context sidebar | `apps/web/src/components/sidebar/RightSidebar.tsx` | Core context, logs, and audit APIs |
| Connector catalog and Bento details | `apps/web/src/app/(dashboard)/plugins/`, `apps/web/src/components/ui/expandable-bento-grid.tsx` | Connector Worker for Nango/provider paths |
| Canvas and AmbiOS cursor | `apps/web/src/components/canvas/` | Core canvas access and realtime authorization |
| Tools, runs, console, incidents, docs | `apps/web/src/app/` route families | Core Worker APIs |
| WebMCP browser registry | `apps/web/src/lib/webmcp/` and `webmcp/register.ts` | Authenticated Core/Connector APIs |

Verification is split into local source checks and deployed evidence. A production provider or WebMCP claim is not considered proven until its HTTPS run is recorded in `webmcp/VERIFICATION.md`.
