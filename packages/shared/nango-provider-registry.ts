/** Providers with an implemented AmbiOS connection and execution contract. */
export const NANGO_PROVIDER_CONFIG_KEYS = {
  openai: "openai",
  notion: "notion",
  cloudflare: "cloudflare",
  github: "github-getting-started",
  vercel: "vercel-mcp",
  netlify: "netlify",
  shopify: "shopify",
  snyk: "snyk",
  socket: "socket",
} as const;

export type NangoProvider = keyof typeof NANGO_PROVIDER_CONFIG_KEYS;
export const NANGO_PROVIDERS: ReadonlySet<string> = new Set(
  Object.keys(NANGO_PROVIDER_CONFIG_KEYS),
);

export function nangoProviderConfigKey(provider: string) {
  return NANGO_PROVIDER_CONFIG_KEYS[provider as NangoProvider] ?? provider;
}
