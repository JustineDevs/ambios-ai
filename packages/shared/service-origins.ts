import type { ServiceOriginName, ServiceOriginRegistry } from "./operations.js";

const productionDefaults: ServiceOriginRegistry = {
  frontendOrigin: "https://ambios-ai.vercel.app",
  coreApiOrigin: "https://ambios-ai.pcg0255.workers.dev",
  connectorApiOrigin: "https://ambios-ai-connector.pcg0255.workers.dev",
  mcpResourceOrigin: "https://ambios-ai.pcg0255.workers.dev/mcp",
  oauthIssuerOrigin: "https://ambios-ai.pcg0255.workers.dev",
  webhookOrigin: "https://ambios-ai-connector.pcg0255.workers.dev",
};

const localDefaults: ServiceOriginRegistry = {
  frontendOrigin: "http://localhost:3000",
  coreApiOrigin: "http://127.0.0.1:8787",
  connectorApiOrigin: "http://127.0.0.1:8788",
  mcpResourceOrigin: "http://127.0.0.1:8787/mcp",
  oauthIssuerOrigin: "http://localhost:3000",
  webhookOrigin: "http://127.0.0.1:8788",
};

function origin(value: string, name: ServiceOriginName, allowHttp: boolean) {
  const parsed = new URL(value);
  if (!allowHttp && parsed.protocol !== "https:")
    throw new Error(`${name} must use HTTPS outside local development`);
  return parsed.toString().replace(/\/$/, "");
}

export function serviceOriginsFromEnv(
  env: Record<string, string | undefined> = {},
): ServiceOriginRegistry {
  const local = env.NODE_ENV !== "production";
  const defaults = local ? localDefaults : productionDefaults;
  const values = {
    frontendOrigin: env.NEXT_PUBLIC_APP_URL ?? defaults.frontendOrigin,
    coreApiOrigin: env.AMBIOS_WORKER_URL ?? defaults.coreApiOrigin,
    connectorApiOrigin: env.AMBIOS_CONNECTOR_URL ?? defaults.connectorApiOrigin,
    mcpResourceOrigin: env.MCP_RESOURCE_URL ?? defaults.mcpResourceOrigin,
    oauthIssuerOrigin: env.MCP_AUTHORIZATION_SERVER_URL ?? defaults.oauthIssuerOrigin,
    webhookOrigin: env.NANGO_WEBHOOK_URL ?? defaults.webhookOrigin,
  } satisfies ServiceOriginRegistry;
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      origin(value, key as ServiceOriginName, local),
    ]),
  ) as ServiceOriginRegistry;
}

export function servicePath(
  service: ServiceOriginName,
  path: string,
  env?: Record<string, string | undefined>,
) {
  return `${serviceOriginsFromEnv(env)[service]}${path.startsWith("/") ? path : `/${path}`}`;
}
