import { INTEGRATION_CATALOG } from "@ambios-ai/shared";
import { describe, expect, it, vi } from "vitest";
import {
  getNangoProviderConfigKey,
  getOnboardingRequirements,
  normalizeNangoProvider,
} from "../nango/connectors";
import { createCloudflareAdapter } from "./cloudflare";
import { createGitHubAdapter } from "./github";
import { createNetlifyAdapter, createShopifyAdapter, createVercelAdapter } from "./mvp-adapters";

describe("Phase 0 provider integrations", () => {
  it("keeps OpenAI API access on the Nango provider path", () => {
    const openAi = INTEGRATION_CATALOG.find((entry) => entry.provider === "openai");
    expect(openAi).toMatchObject({ auth: "nango_api_key" });
    expect(getNangoProviderConfigKey("openai")).toBe("openai");
    expect(normalizeNangoProvider("openai")).toBe("openai");
  });

  it("requires the GitHub provider before onboarding is ready", () => {
    expect(getOnboardingRequirements([])).toEqual(["Connect GitHub"]);
    expect(getOnboardingRequirements(["github"])).toEqual([]);
  });

  it("normalizes deployed Nango configuration keys to canonical providers", () => {
    expect(normalizeNangoProvider("github")).toBe("github");
    expect(normalizeNangoProvider("vercel")).toBe("vercel");
    expect(getNangoProviderConfigKey("github")).toBe("github");
    expect(normalizeNangoProvider("unknown-provider")).toBeNull();
  });

  it.each([
    ["vercel", createVercelAdapter, "https://api.vercel.com/v9/projects"],
    ["netlify", createNetlifyAdapter, "https://api.netlify.com/api/v1/sites"],
  ])("uses HTTPS for %s", (_provider, factory, endpoint) => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ projects: [], data: [] }));
    const adapter = factory({ token: "secret", fetch: request });
    return expect(adapter.status())
      .resolves.toMatchObject({ status: "connected" })
      .then(() => expect(request).toHaveBeenCalledWith(endpoint, expect.anything()));
  });

  it("uses Shopify's server-only access token header", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ shop: { name: "Demo" } }));
    await expect(
      createShopifyAdapter({
        token: "secret",
        shopDomain: "demo.myshopify.com",
        fetch: request,
      }).status(),
    ).resolves.toMatchObject({ account: "Demo" });
    expect(request).toHaveBeenCalledWith(
      "https://demo.myshopify.com/admin/api/latest/shop.json",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Shopify-Access-Token": "secret" }),
      }),
    );
  });

  it("uses the internal Cloudflare HTTPS adapter and creates a Nango sync job", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ success: true, result: { id: "account-1", name: "AmbiOS" } }),
      );
    const adapter = createCloudflareAdapter({
      apiToken: "secret",
      accountId: "account-1",
      fetch: request,
    });

    await expect(adapter.authenticate()).resolves.toMatchObject({
      provider: "cloudflare",
      ownership: "direct",
      status: "connected",
    });
    expect(request).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/accounts/account-1",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer secret" }),
      }),
    );
    expect(adapter.createSyncJob({ organizationId: "org-1", syncJobId: "job-1" })).toEqual({
      type: "nango_sync",
      provider: "cloudflare",
      organizationId: "org-1",
      syncJobId: "job-1",
    });
  });

  it("uses the GitHub HTTPS API and fails closed without a token", async () => {
    expect(() => createGitHubAdapter({})).toThrow("GITHUB_TOKEN");
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ login: "ambios" }));
    const adapter = createGitHubAdapter({ token: "secret", fetch: request });

    await expect(adapter.status()).resolves.toMatchObject({
      provider: "github",
      ownership: "direct",
      status: "connected",
      account: "ambios",
    });
    expect(request).toHaveBeenCalledWith(
      "https://api.github.com/user",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer secret" }),
      }),
    );
  });
});
