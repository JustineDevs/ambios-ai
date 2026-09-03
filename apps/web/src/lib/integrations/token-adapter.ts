import type { Provider, ProviderAdapter, ProviderStatus, SyncRequest } from "./types";
import { createSyncJob, requireSecret } from "./types";

type TokenAdapterConfig = {
  provider: Exclude<Provider, "notion">;
  token?: string;
  endpoint: string;
  account?: string;
  headers?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
  accountFrom?: (body: unknown) => string | undefined;
};

export function createTokenAdapter(config: TokenAdapterConfig): ProviderAdapter {
  const token = requireSecret(config.token, `${config.provider.toUpperCase()}_API_TOKEN`);
  const request = config.fetch ?? globalThis.fetch;
  if (!config.endpoint.startsWith("https://"))
    throw new Error("Integration endpoints must use HTTPS.");
  async function status(): Promise<ProviderStatus> {
    const response = await request(config.endpoint, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...config.headers },
    });
    const body = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) throw new Error(`${config.provider} request failed (${response.status})`);
    return {
      provider: config.provider,
      ownership: "direct",
      status: "connected",
      account: config.accountFrom?.(body) ?? config.account,
    };
  }
  return {
    provider: config.provider,
    ownership: "direct",
    authenticate: status,
    status,
    createSyncJob: (request: SyncRequest) => createSyncJob(config.provider, request),
  };
}
