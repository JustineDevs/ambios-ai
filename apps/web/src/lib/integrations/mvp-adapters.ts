import { createTokenAdapter } from "./token-adapter";
export const createVercelAdapter = (config: { token?: string; fetch?: typeof fetch }) =>
  createTokenAdapter({
    provider: "vercel",
    token: config.token,
    endpoint: "https://api.vercel.com/v9/projects",
    fetch: config.fetch,
    accountFrom: (body) =>
      (body as { projects?: Array<{ name?: string }> })?.projects?.[0]?.name ?? "Vercel",
  });
export const createNetlifyAdapter = (config: { token?: string; fetch?: typeof fetch }) =>
  createTokenAdapter({
    provider: "netlify",
    token: config.token,
    endpoint: "https://api.netlify.com/api/v1/sites",
    fetch: config.fetch,
    accountFrom: (body) => (body as Array<{ name?: string }>)?.[0]?.name ?? "Netlify",
  });
export const createShopifyAdapter = (config: {
  token?: string;
  shopDomain?: string;
  fetch?: typeof fetch;
}) =>
  createTokenAdapter({
    provider: "shopify",
    token: config.token,
    endpoint: `https://${config.shopDomain ?? "invalid"}/admin/api/latest/shop.json`,
    fetch: config.fetch,
    headers: { "X-Shopify-Access-Token": config.token ?? "" },
    accountFrom: (body) =>
      (body as { shop?: { name?: string; domain?: string } })?.shop?.name ?? config.shopDomain,
  });
