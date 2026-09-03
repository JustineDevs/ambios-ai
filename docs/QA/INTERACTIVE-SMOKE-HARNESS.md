# Interactive smoke harness

`pnpm smoke:interactive` runs a bounded, real-environment smoke pass against the configured frontend, Core API, Connector Worker, and MCP OAuth metadata. It uses the canonical operation registry for protocol paths and Playwright for browser navigation. It never fabricates provider success.

## Target selection

Set `TEST_ENVIRONMENT` to `development`, `test`, `preview`, `staging`, or `production`. For deployed targets, provide `FRONTEND_ORIGIN`, `CORE_API_ORIGIN`, `CONNECTOR_API_ORIGIN`, `MCP_RESOURCE_URL`, and `OAUTH_ISSUER_URL`; the preflight rejects HTTP, localhost, port `4136`, Pages, and Vite origins. Local defaults are only used for development/test.

The optional secure runtime inputs are `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, `DEMO_WORKSPACE_REFERENCE`, `DEMO_ORGANIZATION_REFERENCE`, `DEMO_PROVIDER_TEST_MODE`, and `DEMO_PROVIDER_SANDBOX_REFERENCE`. Credentials are read only from the process environment and are never written to reports. A missing demo account or sandbox is reported as `skip/not-configured`, not as a fake pass.

## Evidence

Each run writes `reports/smoke/<TEST_RUN_ID>/smoke-report.json` and `smoke-report.md`. Optional bounded screenshots and a Playwright trace are written under `TEST_ARTIFACT_DIRECTORY/<TEST_RUN_ID>`; enable traces explicitly with `SMOKE_TRACE=true`. Reports contain only safe response summaries, operation IDs, status codes, classifications, and artifact paths. They do not contain credentials, tokens, cookies, authorization codes, raw provider payloads, or raw logs.

## Coverage

The runner checks deployed HTML/API content types, Core and Connector health, readiness, OAuth authorization-server and protected-resource metadata, direct browser loads for the primary authenticated and public route inventory, browser page errors, real demo login/session restoration when credentials are present, and sandbox execution gating. Unsupported or unconfigured lanes remain explicit skips until their real fixture and deployment evidence exist.

Run the operation guard separately before release:

```sh
pnpm operations:check:strict
pnpm smoke:interactive
```

The command exits non-zero for a failed reachable check. A run with no local server or unreachable deployment therefore produces useful failure evidence and must not be mistaken for a passing deployment.
