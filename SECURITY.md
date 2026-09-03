# AmbiOS AI Security Policy

## Scope

This policy covers the Next.js application in `apps/web`, the Hono Core and Connector Workers, WebMCP registration and tool contracts, Supabase Auth, Nango connections, D1/KV/R2/Queue data paths, action approvals, provider execution, webhooks, and deployment configuration.

## Supported security surface

The current production surface is the Vercel app at `https://ambios-ai.vercel.app` and the Workers at `https://ambios-ai.pcg0255.workers.dev` and `https://ambios-ai-connector.pcg0255.workers.dev`. The `main` branch and current production deployments receive security fixes. Old previews and local bypass sessions are not supported production surfaces.

## Report a vulnerability privately

Use [GitHub Security Advisories](https://github.com/JustineDevs/AmbiOS-AI/security/advisories/new), or contact [@JustineDevs](https://github.com/JustineDevs) privately if the advisory form is unavailable. Include, where safe:

- affected hostname, route, Worker, package, deployment, or commit;
- reproducible steps and a minimal proof of concept;
- required privileges, tenant/workspace scope, and likely impact;
- redacted logs, request IDs, and relevant response status;
- a mitigation or disclosure timeline if you have one.

Never include live Supabase, Nango, provider, model, customer, or incident credentials/data. Redact tokens and use synthetic identifiers.

## Security invariants

- Browser and Vercel public variables may contain only public Supabase configuration and API routing information.
- Provider credentials are handled by Nango/Worker secrets and are never returned to the browser or stored in D1 metadata.
- Hono APIs fail closed when required bindings, identity, or workspace authorization are unavailable.
- Write approvals bind the actor, organization/workspace, capability, exact targets, canonical argument hash, policy result, expiry, and single-use state; the Connector Worker revalidates those bindings immediately before execution.
- Queue consumers are idempotent and bounded; webhook handlers verify raw signatures, timestamps/replay windows, and delivery IDs before enqueueing safe normalized events.
- WebMCP schemas and tool handlers do not replace server-side authentication, authorization, policy, or approval checks.

## Response process

Maintainers acknowledge a report, reproduce and isolate the issue, assess severity and affected trust boundaries, prepare and test a fix, and coordinate disclosure with the reporter. A report is not considered closed until the affected path has fresh verification evidence or is explicitly marked unavailable.
