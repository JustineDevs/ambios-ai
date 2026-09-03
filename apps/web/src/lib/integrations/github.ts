import type { ProviderAdapter, ProviderStatus, SyncRequest } from "./types";
import { createSyncJob, requireSecret } from "./types";

type GitHubConfig = { token?: string; fetch?: typeof globalThis.fetch };
type GitHubUser = { login?: string; name?: string };

export function createGitHubAdapter(config: GitHubConfig): ProviderAdapter {
  const token = requireSecret(config.token, "GITHUB_TOKEN");
  const request = config.fetch ?? globalThis.fetch;
  const baseUrl = "https://api.github.com";

  async function status(): Promise<ProviderStatus> {
    const response = await request(`${baseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    const body = (await response.json().catch(() => null)) as GitHubUser | null;
    if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
    return {
      provider: "github",
      ownership: "direct",
      status: "connected",
      account: body?.login ?? body?.name,
    };
  }

  return {
    provider: "github",
    ownership: "direct",
    authenticate: status,
    status,
    createSyncJob: (syncRequest: SyncRequest) => createSyncJob("github", syncRequest),
  };
}
