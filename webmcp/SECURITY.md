# WebMCP security and transport

- WebMCP calls are same-origin and use the authenticated browser session (`credentials: include`).
- Tool requests are rejected unless the page is loaded over HTTPS, preventing mixed content.
- Every API route remains behind the Supabase middleware boundary; server-side validation is required independently of tool schemas.
- Mutating hot-fixes require explicit `approved: true` and produce an auditable action-ai/doc result.
- TLS termination, HTTP-to-HTTPS redirect, and insecure protocol disablement belong to the Cloudflare deployment edge. `wrangler.toml` contains the HTTPS production origin; certificate provisioning is Cloudflare-managed.
- Never place bearer tokens or provider secrets in `webmcp-ai/` or browser bundles.
