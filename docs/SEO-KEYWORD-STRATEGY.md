# AmbiOS SEO, AEO, and GEO strategy

**Scope:** Public trust and product-discovery surfaces only. Authenticated operational routes are intentionally `noindex`.

## Positioning and intent

| Keyword cluster | Example query | Intent | Target surface | Priority |
| --- | --- | --- | --- | --- |
| Governed agent operations | governed AI agent operations workspace | Commercial | Future public homepage | High |
| Human approval | human approval for AI agent actions | Informational/commercial | Product explanation | High |
| WebMCP workspace | WebMCP human agent collaboration | Informational | WebMCP product guide | High |
| Safe automation | auditable AI automation with approval gates | Commercial | Product/security page | High |
| Connector security | OAuth connector credential security for AI agents | Informational | Support/privacy | Medium |
| Data rights | AI agent data access and deletion controls | Informational | Privacy | Medium |

Search volume, difficulty, and current rankings were not available from a connected Search Console or keyword provider, so no numeric demand or difficulty is fabricated. Validate these terms with Search Console and a keyword source before creating additional pages.

## Implementation rules

- Public pages lead with direct answers, descriptive headings, visible authorship/updated dates, and links to primary technical sources.
- JSON-LD describes only visible content; it does not claim certifications, customers, rankings, or legal compliance.
- `robots.txt`, `sitemap.xml`, and `llms.txt` expose only the public trust pages `/support`, `/privacy`, and `/terms`; app/API routes remain non-public discovery surfaces.
- Measure crawl/index coverage in Search Console and AI referral/citation signals separately. Cloudflare Web Analytics is appropriate for privacy-preserving performance/RUM once its site token is configured; do not add a third-party tracker by default.
- Add new public pages only when they answer a distinct intent; update an existing page before creating a competing page.

## Evidence sources

- Google Search Central: title links, crawling/indexing, robots, and sitemaps.
- Google Search Central: JSON-LD structured data guidance.
- Cloudflare Workers Observability: Workers Logs and native metrics.
