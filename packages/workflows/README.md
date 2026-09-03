# AmbiOS Render Workflows

This package is the Node-based long-running workflow service for AmbiOS. It uses Render's official TypeScript SDK to register workflow tasks. It is intentionally separate from the Cloudflare edge application because Render Workflows provisions independent task-run instances and retains task arguments/results according to its service model.

## Current workflow

`incident-investigation` runs two bounded steps:

1. Load organization-scoped incident context.
2. Re-read and verify the resulting incident state.

The workflow does not accept approval tokens or provider credentials as task arguments. The service reads `AMBIOS_INTERNAL_API_URL` and `AMBIOS_INTERNAL_TOKEN` from its server-side environment. Sensitive execution remains in AmbiOS's guarded API; this workflow is for long-running investigation and verification orchestration.

## Render configuration

Create a Render Workflow service from this repository and configure the package as the service root. Use:

```text
Build command: pnpm install --frozen-lockfile && pnpm --filter @ambios-ai/workflows build
Start command: pnpm --filter @ambios-ai/workflows start
```

Environment variables:

- `RENDER_API_KEY`: required by the authenticated AmbiOS caller when it triggers a task run through Render's official SDK or API; it is not a browser secret.
- `AMBIOS_INTERNAL_API_URL`: HTTPS base URL for the AmbiOS API.
- `AMBIOS_INTERNAL_TOKEN`: server-only token for the authenticated workflow endpoint, once that endpoint is enabled.

Do not place `AMBIOS_INTERNAL_TOKEN`, OAuth tokens, or provider credentials in task input. Render documents that task arguments and return values are retained temporarily, so credentials must remain environment-managed.

## Boundary with Cloudflare

Cloudflare remains the public WebMCP and policy surface. A future authenticated server endpoint may trigger this workflow after guardrail evaluation. The workflow service must never become a second authorization system or a way to bypass human approval.

See the official [Render Workflows documentation](https://render.com/docs/workflows), [task definition guide](https://render.com/docs/workflows-defining), and [task triggering guide](https://render.com/docs/workflows-running).
