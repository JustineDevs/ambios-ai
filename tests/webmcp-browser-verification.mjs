import assert from "node:assert/strict";
import { chromium } from "../packages/api/node_modules/playwright/index.mjs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true });
await page.addInitScript(() => {
  const registered = [];
  Object.defineProperty(window.navigator, "modelContext", {
    configurable: true,
    value: { registerTool: async (tool) => registered.push(tool) },
  });
  window.__ambiosWebMCPRegistered = registered;
});

const insecureRequests = [];
const baseUrl = process.env.AMBIOS_TEST_URL ?? "http://localhost:3000";
const baseOrigin = new URL(baseUrl).origin;
page.on("request", (request) => {
  if (request.url().startsWith("http://") && !request.url().startsWith(baseOrigin))
    insecureRequests.push(request.url());
});
await page.goto(`${baseUrl}/agent`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => (window.__ambiosWebMCPRegistered?.length ?? 0) >= 2);

const tools = await page.evaluate(() => window.__ambiosWebMCPRegistered.map(({ name }) => name));
assert.ok(tools.length >= 2);
assert.equal(new Set(tools).size, tools.length, "WebMCP tools must be registered once");
assert.ok(tools.includes("ambios.identity.get_current_user"));
assert.ok(tools.includes("ambios.workspace.get_current_context"));
assert.ok(tools.includes("get_workspace_readiness"));
assert.ok(tools.includes("get_current_workspace_context"));
assert.deepEqual(insecureRequests, []);
await browser.close();
console.log(`Browser WebMCP registration passed for ${tools.length} mounted read-only tools.`);
