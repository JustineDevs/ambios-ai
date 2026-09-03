# Frontend source audit

The source inventory audit is complete. `apps/web` is the canonical Next.js source and contains the original agent interface, composer, right context sidebar, Bento details, branded connector catalog, theme controls, modals, and React Flow canvas. There is one browser application and one UI deployment source.

## Fidelity boundary

The original AmbiOS component tree is present in the canonical Next.js application; this is source-level evidence, not a claim of pixel-perfect rendered parity. Rendered parity still requires a stable baseline capture of the intended 3000 UI and a bounded browser comparison at the same viewport, theme, and readiness state. The canonical Next.js source is the only source of truth.

Watermelon UI was evaluated against its public catalog on 2026-09-03. The catalog provides animated components, reusable blocks, showcases, dashboards, templates, and developer/MCP resources ([Watermelon UI](https://ui.watermelon.sh/home)). None of those surfaces is a drop-in replacement for the existing AmbiOS agent shell, connector Bento interaction, or operational canvas. Its public animated primitives and dashboard blocks are therefore not copied into the product: adding a second primitive library would create style and behavior drift without a concrete missing interaction. Re-evaluate a specific Watermelon component only when a concrete missing interaction is identified and record the selection here before integrating it.

## Runtime ownership

- Vercel: Next.js routes, SSR, middleware, image handling, client state, and browser WebMCP registration.
- Core Worker: authenticated domain APIs, D1/KV/R2 access, policy, approvals, audit, and MCP gateway.
- Connector Worker: Nango lifecycle, provider actions, webhooks, independent verification, and queue consumption.

The source audit is intentionally evidence-based: local checks prove compilation and route behavior; deployed checks prove Vercel/Cloudflare runtime behavior. See `webmcp/VERIFICATION.md` for the current boundary.
