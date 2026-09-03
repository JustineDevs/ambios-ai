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
  jira: "jira",
  "google-drive": "google-drive",
  "google-calendar": "google-calendar",
  "google-analytics": "google-analytics",
  slack: "slack",
  linear: "linear",
  hubspot: "hubspot",
  stripe: "stripe",
  figma: "figma",
  framer: "framer",
} as const;

export type NangoProvider = keyof typeof NANGO_PROVIDER_CONFIG_KEYS;
export const NANGO_PROVIDERS: ReadonlySet<string> = new Set(
  Object.keys(NANGO_PROVIDER_CONFIG_KEYS),
);

export function nangoProviderConfigKey(provider: string) {
  return NANGO_PROVIDER_CONFIG_KEYS[provider as NangoProvider] ?? provider;
}

export type NangoSafeReadRequest = {
  path: string;
  method: "GET" | "POST";
  body?: string;
};

export const NANGO_SAFE_READ_REQUESTS: Record<string, NangoSafeReadRequest> = {
  github: { path: "/user", method: "GET" },
  cloudflare: { path: "/accounts?page=1&per_page=1", method: "GET" },
  notion: { path: "/v1/search?page_size=1", method: "GET" },
  openai: { path: "/v1/models", method: "GET" },
  vercel: { path: "/v9/projects?limit=1", method: "GET" },
  netlify: { path: "/api/v1/sites?page=1&per_page=1", method: "GET" },
  shopify: { path: "/admin/api/2024-01/shop.json", method: "GET" },
  snyk: { path: "/v1/orgs", method: "GET" },
  socket: { path: "/v0/purl", method: "GET" },
  jira: { path: "/rest/api/3/myself", method: "GET" },
  "google-drive": { path: "/drive/v3/about?fields=user", method: "GET" },
  "google-calendar": { path: "/calendar/v3/calendars/primary", method: "GET" },
  "google-analytics": { path: "/analytics/v3/management/accounts", method: "GET" },
  slack: { path: "/api/auth.test", method: "GET" },
  linear: {
    path: "/graphql",
    method: "POST",
    body: JSON.stringify({ query: "query { viewer { id } }" }),
  },
  hubspot: { path: "/crm/v3/objects/companies?limit=1", method: "GET" },
  stripe: { path: "/v1/account", method: "GET" },
  figma: { path: "/v1/me", method: "GET" },
  framer: { path: "/v1/sites?limit=1", method: "GET" },
};

export const nangoSafeReadRequest = (provider: string) =>
  NANGO_SAFE_READ_REQUESTS[provider] ?? null;
export const nangoSafeReadPath = (provider: string) => nangoSafeReadRequest(provider)?.path ?? null;
