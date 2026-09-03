# Engineering standards

## Non-negotiable boundaries

- The browser never authorizes itself; authentication, tenant scope, capability scope, and approval are enforced server-side.
- Provider credentials remain in approved secret storage or the provider connector. Never put them in React state, URLs, logs, screenshots, or tool output.
- A `501`, `503`, missing binding, or failed provider call must remain visible as failure/unavailable state.
- Use Next.js only for the Vercel UI runtime and Hono only for Cloudflare backend runtimes. Do not add a third server runtime.

## API standard

Every route must have typed input/output schemas, truthful HTTP status codes, bounded/redacted output, structured errors, and an OpenAPI operation. Mutating routes must record audit/operation lineage and enforce organization scope. Browser validation improves UX; it is not a security control.

## UI standard

Every server-backed surface must represent loading, ready, empty, unavailable, unsupported, failure, retry, and success states that it can actually reach. Use semantic controls, keyboard access, visible focus, readable labels, and inline recovery guidance. Do not use fixture data as success proof.

## Data and job standard

Schema changes use forward-only migrations. Queue handlers are idempotent, tenant-scoped, bounded, observable, and safe on redelivery. Approval binds exact capability, target, arguments hash, actor, expiry, and single-use consumption. Execution requires revalidation and independent verification.

## WebMCP standard

Tools use the `ambios.*` namespace, feature-detect the browser API, avoid duplicate registration, expose descriptive schemas, call same-origin APIs, and return safe structured errors. Registry presence is not execution proof; each live tool needs authenticated compatible-browser evidence.

## Verification standard

Run targeted tests first, then `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm production:gate`. A passing build is not production evidence. Record local, deployed, authenticated, provider, and browser evidence separately.
