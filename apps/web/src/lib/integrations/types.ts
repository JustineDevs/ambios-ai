export const PROVIDERS = [
  "openai",
  "cloudflare",
  "vercel",
  "netlify",
  "shopify",
  "github",
  "jira",
  "notion",
  "google-drive",
  "google-calendar",
  "google-analytics",
  "slack",
  "linear",
  "hubspot",
  "stripe",
  "figma",
  "framer",
  "custom-rest",
  "snyk",
  "socket",
] as const;
export type Provider = (typeof PROVIDERS)[number];

export type ProviderOwnership = "nango" | "direct" | "ambios_mcp";
export type IntegrationStatus = "pending" | "connected" | "disconnected" | "error";
export type SyncStatus = "queued" | "processing" | "completed" | "failed";

export type SyncQueueMessage = {
  type: "nango_sync";
  organizationId: string;
  syncJobId: string;
  provider: Provider;
};

export type ProviderStatus = {
  provider: Provider;
  ownership: ProviderOwnership;
  status: IntegrationStatus;
  account?: string;
};

export type SyncRequest = {
  organizationId: string;
  syncJobId?: string;
};

export type ProviderAdapter = {
  provider: Exclude<Provider, "notion">;
  ownership: "direct";
  authenticate(): Promise<ProviderStatus>;
  status(): Promise<ProviderStatus>;
  createSyncJob(request: SyncRequest): SyncQueueMessage;
};

export function requireSecret(value: string | undefined, name: string): string {
  if (!value) throw new Error(`AmbiOS requires ${name} for direct integration.`);
  return value;
}

export function createSyncJob(provider: Exclude<Provider, "notion">, request: SyncRequest) {
  return {
    type: "nango_sync" as const,
    provider,
    organizationId: request.organizationId,
    syncJobId: request.syncJobId ?? crypto.randomUUID(),
  };
}
