import { NANGO_PROVIDER_CONFIG_KEYS, nangoProviderConfigKey } from "@ambios-ai/shared";
import { z } from "zod";

const CONNECTOR_PROVIDERS = Object.keys(NANGO_PROVIDER_CONFIG_KEYS) as [
  keyof typeof NANGO_PROVIDER_CONFIG_KEYS,
  ...(keyof typeof NANGO_PROVIDER_CONFIG_KEYS)[],
];
export const connectorProviderSchema = z.enum(CONNECTOR_PROVIDERS);
export type ConnectorProvider = z.infer<typeof connectorProviderSchema>;

export const REQUIRED_ONBOARDING_PROVIDERS = ["github"] as const;

const CANONICAL_PROVIDERS = new Map<string, string>(
  Object.entries(NANGO_PROVIDER_CONFIG_KEYS).map(([provider, configKey]) => [configKey, provider]),
);

export function getNangoProviderConfigKey(provider: ConnectorProvider): string {
  return nangoProviderConfigKey(provider);
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
