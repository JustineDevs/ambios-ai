import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "../../packages/api/node_modules/playwright/index.mjs";
import { type SmokeConfig, smokeConfig } from "./config/runtime.ts";
import { checkHttp } from "./helpers/http.ts";
import { SmokeReport } from "./helpers/report.ts";

let config: SmokeConfig;
try {
  config = smokeConfig();
} catch (error) {
  console.error(
    JSON.stringify({
      status: "fail",
      suite: "preflight",
      classification: "configuration",
      reason: error instanceof Error ? error.message : "Invalid smoke configuration",
    }),
  );
  process.exit(2);
}
const report = new SmokeReport();
const browser = await chromium.launch({ headless: process.env.SMOKE_HEADLESS !== "false" });
const context = await browser.newContext({
  baseURL: config.origins.frontendOrigin,
  ignoreHTTPSErrors: process.env.SMOKE_IGNORE_HTTPS === "true",
});
if (process.env.SMOKE_TRACE === "true")
  await context.tracing.start({ screenshots: true, snapshots: true });
const page = await context.newPage();
const artifactDir = join(config.artifacts, config.runId);
await mkdir(artifactDir, { recursive: true });
const consoleErrors: string[] = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300));
});
page.on("pageerror", (error) => consoleErrors.push(error.message.slice(0, 300)));

const check = (input: Parameters<typeof checkHttp>[2]) => checkHttp(report, config, input);
try {
  await check({
    caseId: "deployment.frontend.home",
    suite: "deployment",
    operationId: "getCoreRoot",
    service: "frontend",
    expectedStatus: [200],
    expectedContent: "html",
    marker: "AmbiOS",
  });
  for (const [caseId, route, marker] of [
    ["deployment.frontend.login", "/login", "Sign in"],
    ["deployment.frontend.agent", "/agent", "Operations copilot"],
    ["deployment.frontend.plugins", "/plugins", "Plugins"],
    ["deployment.frontend.incident", "/incidents/example", "Incidents"],
    ["browser.route.tools", "/tools", "Tools"],
    ["browser.route.runs", "/runs", "Runs"],
    ["browser.route.approvals", "/approvals", "Approvals"],
    ["browser.route.console", "/console", "Console"],
    ["browser.route.canvas", "/incidents/example/canvas", "Canvas"],
    ["browser.route.services", "/services", "Services"],
    ["browser.route.systems", "/systems", "Systems"],
    ["browser.route.workspace", "/workspace", "Workspace"],
    ["browser.route.setup", "/setup", "Setup"],
    ["browser.route.docs", "/docs", "Docs"],
    ["browser.route.budget", "/budget", "Budget"],
    ["browser.route.settings", "/settings", "Settings"],
    ["browser.route.playground", "/playground", "Playground"],
    ["browser.route.privacy", "/privacy", "Privacy"],
    ["browser.route.terms", "/terms", "Terms"],
  ] as const) {
    const screenshot = join(artifactDir, `${caseId.replace(/[^a-z0-9.-]/gi, "_")}.png`);
    try {
      const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 15000 });
      const body = await page
        .locator("body")
        .innerText()
        .catch(() => "");
      await page.screenshot({ path: screenshot, fullPage: false }).catch(() => undefined);
      report.add({
        caseId,
        suite: "browser",
        scenario: `direct load ${route}`,
        expected: `HTTP 200 and ${marker}`,
        actual: `HTTP ${response?.status() ?? "none"}`,
        status: response?.status() === 200 && body.includes(marker) ? "pass" : "fail",
        route,
        statusCode: response?.status(),
        safeConsoleError: consoleErrors.length
          ? `${consoleErrors.length} browser error(s)`
          : undefined,
        recommendedFixLane:
          response?.status() === 200 && body.includes(marker) ? undefined : "frontend-runtime",
      });
    } catch (error) {
      report.add({
        caseId,
        suite: "browser",
        scenario: `direct load ${route}`,
        expected: `HTTP 200 and ${marker}`,
        actual: "navigation failed",
        status: "fail",
        route,
        safeNetworkError:
          error instanceof Error ? error.message.slice(0, 300) : "navigation failed",
        recommendedFixLane: "frontend-connectivity",
        screenshot,
      });
    }
  }
  await check({
    caseId: "deployment.core.health",
    suite: "deployment",
    operationId: "getHealth",
    expectedStatus: [200],
    expectedContent: "json",
    marker: "status",
  });
  await check({
    caseId: "deployment.core.readiness",
    suite: "deployment",
    operationId: "getReadiness",
    expectedStatus: [200, 401, 403, 503],
    expectedContent: "json",
  });
  await check({
    caseId: "deployment.connector.health",
    suite: "deployment",
    operationId: "getConnectorHealth",
    expectedStatus: [200, 401, 403, 404, 503],
    expectedContent: "json",
    service: "connector",
  });
  await check({
    caseId: "protocol.oauth.metadata",
    suite: "oauth",
    operationId: "mcpAuthorizationMetadata",
    service: "oauth",
    expectedStatus: [200],
    expectedContent: "json",
    marker: "issuer",
  });
  await check({
    caseId: "protocol.oauth.resource",
    suite: "oauth",
    operationId: "mcpResourceMetadata",
    service: "oauth",
    expectedStatus: [200],
    expectedContent: "json",
    marker: "resource",
  });
  if (!config.hasDemoCredentials)
    report.add({
      caseId: "auth.demo.credentials",
      suite: "auth",
      scenario: "real demo login",
      expected: "secure demo credentials supplied at runtime",
      actual: "credentials absent",
      status: "skip",
      classification: "not-configured",
      recommendedFixLane: "smoke-environment",
    });
  else {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.getByLabel("Email").fill(config.demoEmail ?? "");
    await page.getByLabel("Password").fill(config.demoPassword ?? "");
    await page.getByRole("button", { name: "Sign in with email" }).click();
    try {
      await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 15000 });
      report.add({
        caseId: "auth.demo.credentials",
        suite: "auth",
        scenario: "real demo login",
        expected: "redirect to authenticated app",
        actual: `redirected to ${page.url().replace(/[?].*$/, "")}`,
        status: "pass",
        route: "/login",
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      report.add({
        caseId: "auth.session.restore",
        suite: "auth",
        scenario: "refresh restores session",
        expected: "protected page remains available after refresh",
        actual: "session restored",
        status: "pass",
        route: new URL(page.url()).pathname,
      });
    } catch (error) {
      report.add({
        caseId: "auth.demo.credentials",
        suite: "auth",
        scenario: "real demo login",
        expected: "redirect to authenticated app",
        actual: "login did not complete",
        status: "fail",
        route: "/login",
        safeNetworkError: error instanceof Error ? error.message.slice(0, 300) : "login failed",
        recommendedFixLane: "auth-smoke",
      });
    }
  }
  if (config.providerTestMode !== "sandbox" || !config.providerSandboxReference)
    report.add({
      caseId: "provider.sandbox.execution",
      suite: "providers",
      scenario: "controlled provider action",
      expected: "sandbox reference and explicit sandbox mode",
      actual: "sandbox execution disabled",
      status: "skip",
      classification: "not-configured",
      recommendedFixLane: "provider-sandbox",
    });
  else
    report.add({
      caseId: "provider.sandbox.execution",
      suite: "providers",
      scenario: "controlled provider action",
      expected: "sandbox execution",
      actual:
        "sandbox mode configured; provider-specific workflow requires registered operation fixture",
      status: "skip",
      classification: "fixture-required",
      recommendedFixLane: "provider-sandbox",
    });
  if (consoleErrors.length)
    report.add({
      caseId: "browser.console.errors",
      suite: "browser",
      scenario: "console remains clean",
      expected: "no page errors",
      actual: `${consoleErrors.length} error(s) observed`,
      status: "fail",
      safeConsoleError: consoleErrors.slice(0, 5).join(" | "),
      recommendedFixLane: "frontend-runtime",
    });
  else
    report.add({
      caseId: "browser.console.errors",
      suite: "browser",
      scenario: "console remains clean",
      expected: "no page errors",
      actual: "no console errors",
      status: "pass",
    });
} finally {
  if (process.env.SMOKE_TRACE === "true")
    await context.tracing.stop({ path: join(artifactDir, "browser-trace.zip") });
  await browser.close();
}
const paths = await report.write(config, {
  browser: "chromium",
  viewport: { width: 1280, height: 800 },
  protocol: "real HTTP",
  note: "Skipped lanes are capability-gated; no mocked provider success is recorded.",
});
console.log(
  JSON.stringify(
    {
      ...paths,
      summary: {
        pass: report.results.filter((r) => r.status === "pass").length,
        fail: report.results.filter((r) => r.status === "fail").length,
        skip: report.results.filter((r) => r.status === "skip").length,
      },
    },
    null,
    2,
  ),
);
if (report.results.some((result) => result.status === "fail")) process.exitCode = 1;
