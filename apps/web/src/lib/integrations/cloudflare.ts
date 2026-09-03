import type { ProviderAdapter, ProviderStatus, SyncRequest } from "./types";
import { createSyncJob, requireSecret } from "./types";

type CloudflareConfig = {
  apiToken?: string;
  accountId?: string;
  fetch?: typeof globalThis.fetch;
};

type CloudflareResponse = { success?: boolean; result?: { id?: string; name?: string } };

export function createCloudflareAdapter(config: CloudflareConfig): ProviderAdapter {
  const token = requireSecret(config.apiToken, "CLOUDFLARE_API_TOKEN");
  const accountId = requireSecret(config.accountId, "CLOUDFLARE_ACCOUNT_ID");
  const request = config.fetch ?? globalThis.fetch;
  const baseUrl = "https://api.cloudflare.com/client/v4";

  async function status(): Promise<ProviderStatus> {
    const response = await request(`${baseUrl}/accounts/${encodeURIComponent(accountId)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const body = (await response.json().catch(() => null)) as CloudflareResponse | null;
    if (!response.ok || body?.success !== true)
      throw new Error(`Cloudflare request failed (${response.status})`);
    return {
      provider: "cloudflare",
      ownership: "direct",
      status: "connected",
      account: body.result?.name ?? body.result?.id ?? accountId,
    };
  }

  return {
    provider: "cloudflare",
    ownership: "direct",
    authenticate: status,
    status,
    createSyncJob: (syncRequest: SyncRequest) => createSyncJob("cloudflare", syncRequest),
  };
}
