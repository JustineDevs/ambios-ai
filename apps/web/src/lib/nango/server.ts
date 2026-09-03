import { runtimeEnv } from "@/lib/ambios/runtime";
import { getNangoProviderConfigKey, normalizeNangoProvider } from "@/lib/nango/connectors";

function nangoConfigKey(provider: string) {
  const canonical = normalizeNangoProvider(provider);
  return canonical ? getNangoProviderConfigKey(canonical) : provider;
}

async function nangoConfig() {
  const secretKey = await runtimeEnv("NANGO_SECRET_KEY");
  if (!secretKey) throw new Error("AmbiOS requires NANGO_SECRET_KEY for Nango integration.");
  const configuredHost = await runtimeEnv("NANGO_HOST");
  const baseUrl = (configuredHost ?? "https://api.nango.dev").replace(/\/$/, "");
  if (!baseUrl.startsWith("https://")) throw new Error("AmbiOS requires NANGO_HOST to use HTTPS.");
  return { baseUrl, secretKey };
}

export async function nangoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, secretKey } = await nangoConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Nango request failed (${response.status})`);
  return body as T;
}

export async function nangoProxyRequest<T>(options: {
  providerConfigKey: string;
  connectionId: string;
  path: string;
  init?: RequestInit;
}): Promise<{ status: number; payload: T | null }> {
  const { baseUrl, secretKey } = await nangoConfig();
  const response = await fetch(`${baseUrl}/proxy/${options.path.replace(/^\//, "")}`, {
    ...options.init,
    headers: {
      ...options.init?.headers,
      Accept: "application/json",
      Authorization: `Bearer ${secretKey}`,
      "Provider-Config-Key": nangoConfigKey(options.providerConfigKey),
      "Connection-Id": options.connectionId,
    },
  });
  return {
    status: response.status,
    payload: (await response.json().catch(() => null)) as T | null,
  };
}

export async function nangoActionRequest<T>(options: {
  providerConfigKey: string;
  connectionId: string;
  actionName: string;
  input: Record<string, unknown>;
}): Promise<{ status: number; payload: T | null }> {
  const { baseUrl, secretKey } = await nangoConfig();
  const response = await fetch(`${baseUrl}/action/trigger`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${secretKey}`,
      "Connection-Id": options.connectionId,
      "Content-Type": "application/json",
      "Provider-Config-Key": nangoConfigKey(options.providerConfigKey),
    },
    body: JSON.stringify({ action_name: options.actionName, input: options.input }),
  });
  return {
    status: response.status,
    payload: (await response.json().catch(() => null)) as T | null,
  };
}

export async function nangoProxyFetch(options: {
  providerConfigKey: string;
  connectionId: string;
}) {
  const { baseUrl, secretKey } = await nangoConfig();
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    return fetch(`${baseUrl}/proxy${target.pathname}${target.search}`, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        Accept: "application/json",
        Authorization: `Bearer ${secretKey}`,
        "Provider-Config-Key": nangoConfigKey(options.providerConfigKey),
        "Connection-Id": options.connectionId,
      },
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    });
  };
}

export type NangoFunctionDefinition = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  scopes?: string[];
};

export async function getNangoIntegrationFunctions(providerConfigKey: string) {
  const result = await nangoRequest<
    | Array<Record<string, unknown>>
    | {
        actions?: Array<Record<string, unknown>>;
        syncs?: Array<Record<string, unknown>>;
      }
  >(
    `/scripts/config?provider_config_key=${encodeURIComponent(nangoConfigKey(providerConfigKey))}&format=nango`,
  );
  const definitions = Array.isArray(result)
    ? result
    : [...(result.actions ?? []), ...(result.syncs ?? [])];
  return definitions.map(
    (item) =>
      ({
        name: typeof item.name === "string" ? item.name : "",
        description: typeof item.description === "string" ? item.description : "",
        inputSchema: (item.json_schema as Record<string, unknown> | undefined) ??
          (item.input as Record<string, unknown> | undefined) ?? { type: "object", properties: {} },
        outputSchema: (item.outputSchema as Record<string, unknown> | undefined) ?? null,
        scopes: Array.isArray(item.scopes)
          ? item.scopes.filter((scope): scope is string => typeof scope === "string")
          : [],
      }) satisfies NangoFunctionDefinition,
  );
}

export function deleteNangoConnection(connectionId: string, provider: string) {
  return nangoRequest<{ success: boolean }>(
    `/connections/${encodeURIComponent(connectionId)}?provider_config_key=${encodeURIComponent(nangoConfigKey(provider))}`,
    { method: "DELETE" },
  );
}
