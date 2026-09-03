import { expect, test } from "@playwright/test";
import { INTEGRATION_CATALOG, operationPath } from "../../packages/shared/dist/index.js";
import { ambiosWebMCPTools } from "../../webmcp/register";

test("direct route loads with truthful runtime state", async ({ page }) => {
  await page.goto("/agent");
  await expect(page).toHaveTitle(/AmbiOS/i);
  await expect(page.getByRole("heading", { name: "Operations copilot" })).toBeVisible();
  await expect(page.getByPlaceholder(/Message ambios/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Past chats" })).toBeVisible();
});

test("all primary routes survive direct navigation", async ({ page }) => {
  for (const route of [
    "/",
    "/tools",
    "/runs",
    "/systems",
    "/incidents",
    "/plugins",
    "/docs",
    "/settings",
    "/account",
    "/organization",
    "/deployment",
    "/support",
    "/privacy",
  ]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  }
});

test("source route families survive direct navigation", async ({ page }) => {
  for (const route of [
    "/agents",
    "/approvals",
    "/budget",
    "/services",
    "/workspace",
    "/onboarding",
    "/playground",
    "/ai",
    "/welcome",
    "/login",
    "/sign-in",
    "/signup",
    "/settings/api-keys",
    "/docs/example",
    "/plugins/github",
    "/systems/example",
    "/tools/example",
    "/tools/manual",
    "/incidents/example",
    "/incidents/example/hotfix",
  ]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  }
});

test("settings exposes the privacy recovery surface", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Manage your data" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read privacy details" })).toBeVisible();
});

test("tool registry renders the canonical WebMCP contracts", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: "WebMCP tool registry" })).toBeVisible();
  await expect(page.getByText("ambios.identity.get_current_user", { exact: true })).toBeVisible();
  await expect(
    page.getByText(`${ambiosWebMCPTools.length} contract definitions`, { exact: true }),
  ).toBeVisible();
});

test("plugins renders the canonical provider and roadmap catalog", async ({ page }) => {
  const staleRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/nango/features")) staleRequests.push(request.url());
  });
  await page.goto("/plugins");
  await expect(page.getByRole("heading", { name: "Plugins" })).toBeVisible();
  await expect(page.getByText("OpenAI", { exact: true })).toBeVisible();
  await expect(page.getByText("Connect AmbiOS to ChatGPT", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy app URL" })).toHaveCount(0);
  for (const removedProvider of ["Dependabot", "GitHub Security", "Apify", "Intercom"]) {
    await expect(page.getByText(removedProvider, { exact: true })).toHaveCount(0);
  }
  for (const entry of INTEGRATION_CATALOG) {
    await expect(page.getByText(entry.label, { exact: true })).toBeVisible();
  }
  await expect(page.getByText("Unknown", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Connector locked until supported")).toHaveCount(
    INTEGRATION_CATALOG.filter((entry) => entry.phase === "roadmap").length,
  );
  expect(staleRequests).toEqual([]);
});

test("GitHub owns security capability families without duplicate connectors", async ({ page }) => {
  await page.goto("/plugins");
  await expect(page.getByText("GitHub", { exact: true })).toBeVisible();
  await expect(page.getByText("Dependabot", { exact: true })).toHaveCount(0);
  await expect(page.getByText("GitHub Security", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Connect GitHub" })).toBeVisible();
});

test("data routes render their Hono-backed empty states", async ({ page }) => {
  await page.goto("/console");
  await expect(page.getByRole("heading", { name: "Runtime console" })).toBeVisible();
  await expect(page.getByText("No runtime actions have been recorded yet.")).toBeVisible();
  await page.goto("/incidents");
  await expect(page.getByText("No incidents are recorded for this workspace.")).toBeVisible();
  await page.goto("/docs");
  await expect(page.getByText("No operational documents are recorded yet.")).toBeVisible();
});

test("sidebar controls stay local to the shell", async ({ page }) => {
  await page.goto("/agent");
  await page.getByRole("button", { name: "Plans" }).click();
  await expect(page.getByRole("dialog", { name: /choose the workspace capacity/i })).toBeVisible();
  await page.getByRole("button", { name: "Close plans" }).click();
  await expect(page.getByRole("dialog", { name: /choose the workspace capacity/i })).toHaveCount(0);

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("sidebar follows the original mobile navigation behavior", async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 800 });
  await page.goto("/agent");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByRole("link", { name: "Plugins" })).toBeVisible();
  await page.getByRole("link", { name: "Plugins" }).click();
  await expect(page).toHaveURL(/\/plugins$/);
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
});

test("composer exposes the original context mention affordance", async ({ page }) => {
  await page.goto("/agent");
  const composer = page.getByLabel("Message AmbiOS");
  await composer.fill("@sys");
  await expect(page.getByRole("listbox", { name: /mention a workspace surface/i })).toBeVisible();
  await page.getByRole("option", { name: /@systems/i }).click();
  await expect(composer).toHaveValue("@systems ");
});

test("agent capabilities opens as a source-shaped modal and closes safely", async ({ page }) => {
  await page.goto("/agent");
  await page.getByRole("button", { name: "Open agent capabilities" }).click();
  await expect(page.getByRole("dialog", { name: /agent capabilities/i })).toBeVisible();
  await expect(page.getByText(/mapped vendor capabilities/)).toBeVisible();
  await expect(page.getByText("snyk.get_vulnerabilities", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close agent capabilities" }).click();
  await expect(page.getByRole("dialog", { name: /agent capabilities/i })).toHaveCount(0);
});

test("composer executes grounded runtime probes and supports edit/retry", async ({ page }) => {
  await page.route(`**${operationPath("getReadiness")}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ready: true,
        runtime: "hono",
        blockers: [],
        workspace: { id: "test-workspace", name: "Test workspace" },
        integrations: [
          { provider: "openai", status: "connected" },
          { provider: "github", status: "connected" },
        ],
      }),
    });
  });
  await page.goto("/agent");
  const composer = page.getByLabel("Message AmbiOS");
  await page.getByRole("button", { name: "Open composer context" }).click();
  await expect(page.getByRole("dialog", { name: "Composer context" })).toContainText(
    "Context is ready",
  );
  await page.getByRole("button", { name: "Open composer context" }).click();
  await composer.fill("show me the WebMCP tools");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText(/workspace registry currently advertises \d+ WebMCP tool contracts/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(composer).toHaveValue("show me the WebMCP tools");
  await composer.fill("check runtime readiness");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/runtime is (ready|not ready)/i).last()).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).last().click();
  await expect(page.getByText(/runtime is (ready|not ready)/i).last()).toBeVisible();
});

test("connector OAuth loading is isolated per card", async ({ page }) => {
  await page.route(
    `**${operationPath("connectNango", { providerId: "notion" })}`,
    async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((resolve) => setTimeout(resolve, 400));
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: '{"error":"test"}',
        });
        return;
      }
      await route.continue();
    },
  );
  await page.goto("/plugins");
  await page.getByRole("button", { name: "Notion details" }).click();
  await page.getByRole("button", { name: "Close details" }).click();
  const notion = page.getByRole("button", { name: "Connect Notion" });
  await expect(notion).toBeVisible();
  await notion.click();
  await page.getByRole("button", { name: "Cloudflare details" }).click();
  const cloudflare = page.getByRole("button", { name: "Connect Cloudflare" });
  await expect(cloudflare).toBeEnabled();
});

test("direct connector detail routes use the real Bento modal", async ({ page }) => {
  await page.goto("/plugins/cloudflare");
  const dialog = page.getByRole("dialog", { name: "Cloudflare details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close details" })).toBeVisible();
  await expect(page.getByText(/Review Cloudflare connection state/i)).toBeVisible();
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(page.getByRole("dialog", { name: "Cloudflare details" })).toHaveCount(0);
});
