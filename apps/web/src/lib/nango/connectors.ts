import { z } from "zod";

export const connectorProviderSchema = z.enum([
  "openai",
  "notion",
  "cloudflare",
  "github",
  "vercel",
  "netlify",
  "shopify",
  "snyk",
  "socket",
]);
export type ConnectorProvider = z.infer<typeof connectorProviderSchema>;

export const REQUIRED_ONBOARDING_PROVIDERS = ["github"] as const;

const NANGO_CONFIG_KEYS: Record<ConnectorProvider, string> = {
  openai: "openai",
  notion: "notion",
  cloudflare: "cloudflare",
  github: "github-getting-started",
  vercel: "vercel-mcp",
  netlify: "netlify",
  shopify: "shopify",
  snyk: "snyk",
  socket: "socket",
};

const CANONICAL_PROVIDERS = new Map(
  Object.entries(NANGO_CONFIG_KEYS).map(([provider, configKey]) => [configKey, provider]),
);

export function getNangoProviderConfigKey(provider: ConnectorProvider): string {
  return NANGO_CONFIG_KEYS[provider];
}

export function normalizeNangoProvider(value: string): ConnectorProvider | null {
  const canonical = CANONICAL_PROVIDERS.get(value) ?? value;
  return isConnectorProvider(canonical) ? canonical : null;
}

export function getOnboardingRequirements(connectedProviders: Iterable<string>): string[] {
  const connected = new Set(connectedProviders);
  return REQUIRED_ONBOARDING_PROVIDERS.filter((provider) => !connected.has(provider)).map(
    () => "Connect GitHub",
  );
}

export function isConnectorProvider(value: string): value is ConnectorProvider {
  return connectorProviderSchema.safeParse(value).success;
}
