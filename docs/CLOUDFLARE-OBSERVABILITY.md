# Cloudflare observability and measurement

AmbiOS uses Cloudflare’s native observability for the canonical Hono Workers. The Next.js frontend is hosted by Vercel; Cloudflare owns only the backend runtime. The root `wrangler.toml` enables Workers Logs with full head sampling. Every request emits a structured `http_request` event containing only request ID, method, path, status, duration, and environment.

## What is measured

- Workers Logs: request events, exceptions, and sanitized application events.
- Workers metrics: requests, error rate, CPU time, wall time, and duration in the Cloudflare dashboard.
- Vercel metrics: frontend deployment and runtime health are verified in the Vercel project; do not infer frontend health from Worker metrics.
- SEO/RUM: Cloudflare Web Analytics may be enabled from the dashboard with the site token after the privacy review. No third-party analytics script is bundled by default.

## Privacy boundary

The request event intentionally excludes query strings, authorization headers, request bodies, emails, provider payloads, tokens, and API keys. Do not add those fields to logs. Cloudflare’s native Web Analytics is the preferred optional RUM path because its documented collection is performance-oriented; it still requires product-owner/privacy review and dashboard configuration.

## Verification

1. Deploy the canonical Worker with `pnpm deploy:cloudflare`.
2. Open Cloudflare Dashboard → Workers & Pages → `ambios-ai` → Observability.
3. Request `/api/health` and `/mcp` over HTTPS.
4. Confirm an `http_request` event appears with the expected status and no sensitive fields.
5. Inspect Workers metrics for request/error/CPU trends.
6. Verify the Vercel app’s `/api/health` response carries the Cloudflare Worker headers. Vercel proxies API requests to the canonical Worker, so application API events are owned by the Worker.

Logs are operational telemetry, not a user-activity or marketing profile. Retention and export destinations must be approved in the privacy/sub-processor register before enabling Logpush or Analytics Engine.
