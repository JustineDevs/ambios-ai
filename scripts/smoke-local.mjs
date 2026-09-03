// Low-level local smoke fixture: the registry owns this route; this script
// intentionally probes the explicit development service origin.
const workerUrl = process.env.AMBIOS_WORKER_URL ?? "http://127.0.0.1:8787";
const frontendUrl = process.env.AMBIOS_TEST_URL ?? "http://localhost:3000";
const authorization = process.env.AMBIOS_SMOKE_AUTHORIZATION;
const authenticated = Boolean(authorization);
const localAuthDisabled =
  !authenticated &&
  process.env.AUTH_DISABLE === "true" &&
  ["development", "test"].includes(process.env.ENVIRONMENT ?? "development");

async function request(url, body, method = "GET") {
  const response = await fetch(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authorization ? { Authorization: authorization } : {}),
    },
    signal: AbortSignal.timeout(5000),
  });
  const responseBody = await response.text();
  return { response, body: responseBody };
}

const checks = [
  ["worker health", `${workerUrl}/api/health`, 200, '"status":"ok"'],
  ["worker readiness", `${workerUrl}/api/readiness`, [200, 503], '"runtime":"hono"'],
  [
    "actions resource",
    `${workerUrl}/api/actions`,
    authenticated || localAuthDisabled ? [200, 403] : [401, 503],
    authenticated || localAuthDisabled
      ? ['"actions"', '"ORGANIZATION_REQUIRED"']
      : '"AUTH_REQUIRED"',
  ],
  [
    "integrations resource",
    `${workerUrl}/api/integrations`,
    authenticated ? 200 : localAuthDisabled ? 200 : [401, 503],
    authenticated || localAuthDisabled ? '"integrations"' : '"AUTH_REQUIRED"',
  ],
  [
    "vendor action boundary",
    `${workerUrl}/api/integrations/snyk/vulnerabilities`,
    authenticated || localAuthDisabled ? 503 : [401, 503],
    authenticated || localAuthDisabled ? '"VENDOR_ACTION_UNAVAILABLE"' : '"AUTH_REQUIRED"',
  ],
  [
    "deployment approval boundary",
    `${workerUrl}/api/backend/deploy`,
    authenticated || localAuthDisabled ? 403 : [401, 503],
    authenticated || localAuthDisabled ? '"APPROVAL_REQUIRED"' : '"AUTH_REQUIRED"',
    "POST",
    { service: "cloudflare", environment: "staging", operation: "deploy" },
  ],
  ["frontend route", `${frontendUrl}/agent`, [200, 307], ["AmbiOS", "/login"]],
  [
    "unsupported route boundary",
    `${workerUrl}/api/not-yet-mounted`,
    authenticated || localAuthDisabled ? 404 : [401, 503],
    authenticated || localAuthDisabled ? '"code":"NOT_FOUND"' : '"AUTH_REQUIRED"',
  ],
];

let failed = false;
for (const [label, url, expectedStatus, marker, method, body] of checks) {
  try {
    const { response, body: responseBody } = await request(url, body, method);
    const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const markers = Array.isArray(marker) ? marker : [marker];
    const passed =
      statuses.includes(response.status) && markers.some((value) => responseBody.includes(value));
    console.log(`${passed ? "PASS" : "FAIL"} ${label}: HTTP ${response.status}`);
    if (!passed) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) process.exit(1);
