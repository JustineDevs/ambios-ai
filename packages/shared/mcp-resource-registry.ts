import { serviceOriginsFromEnv } from "./service-origins.js";

export const MCP_SCOPE_DEFINITIONS = [
  {
    scope: "ambios.workspace.read",
    description: "Read the authorized workspace context.",
    readOnly: true,
  },
  {
    scope: "ambios.incidents.read",
    description: "Read incidents in the authorized workspace.",
    readOnly: true,
  },
  {
    scope: "ambios.systems.read",
    description: "Read systems and service relationships.",
    readOnly: true,
  },
  {
    scope: "ambios.resources.read",
    description: "Read mapped workspace resources.",
    readOnly: true,
  },
  {
    scope: "ambios.tools.read",
    description: "Read the tools available to this workspace.",
    readOnly: true,
  },
  { scope: "ambios.runs.read", description: "Read governed run status.", readOnly: true },
  {
    scope: "ambios.audit.read",
    description: "Read the authorized audit timeline.",
    readOnly: true,
  },
  {
    scope: "ambios.proposals.create",
    description: "Create a structured proposal; this does not execute it.",
    readOnly: false,
  },
  { scope: "ambios.proposals.read", description: "Read structured proposals.", readOnly: true },
  { scope: "ambios.policy.read", description: "Read policy evaluations.", readOnly: true },
  {
    scope: "ambios.approvals.request",
    description: "Request an exact human approval; this does not approve an action.",
    readOnly: false,
  },
  { scope: "ambios.approvals.read", description: "Read approval status.", readOnly: true },
  { scope: "ambios.actions.read", description: "Read governed action status.", readOnly: true },
  {
    scope: "ambios.verification.read",
    description: "Read independent verification results.",
    readOnly: true,
  },
] as const;

export const MCP_SCOPES = MCP_SCOPE_DEFINITIONS.map(({ scope }) => scope) as [string, ...string[]];
export const MCP_DEFAULT_SCOPES = [
  "ambios.workspace.read",
  "ambios.incidents.read",
  "ambios.systems.read",
  "ambios.proposals.create",
  "ambios.approvals.read",
  "ambios.verification.read",
  "ambios.audit.read",
] as const;

export type McpScope = (typeof MCP_SCOPE_DEFINITIONS)[number]["scope"];
export type McpRegistryEnvironment = Record<string, unknown>;

export function mcpConfiguration(env: McpRegistryEnvironment = {}) {
  const values = env as Record<string, unknown>;
  const origins = serviceOriginsFromEnv({
    NODE_ENV:
      typeof values.NODE_ENV === "string"
        ? values.NODE_ENV
        : values.ENVIRONMENT === "production"
          ? "production"
          : undefined,
    NEXT_PUBLIC_APP_URL:
      typeof values.NEXT_PUBLIC_APP_URL === "string" ? values.NEXT_PUBLIC_APP_URL : undefined,
    AMBIOS_WORKER_URL:
      typeof values.AMBIOS_WORKER_URL === "string" ? values.AMBIOS_WORKER_URL : undefined,
    AMBIOS_CONNECTOR_URL:
      typeof values.AMBIOS_CONNECTOR_URL === "string" ? values.AMBIOS_CONNECTOR_URL : undefined,
    MCP_RESOURCE_URL:
      typeof values.MCP_RESOURCE_URL === "string" ? values.MCP_RESOURCE_URL : undefined,
    MCP_AUTHORIZATION_SERVER_URL:
      typeof values.MCP_AUTHORIZATION_SERVER_URL === "string"
        ? values.MCP_AUTHORIZATION_SERVER_URL
        : undefined,
    NANGO_WEBHOOK_URL:
      typeof values.NANGO_WEBHOOK_URL === "string" ? values.NANGO_WEBHOOK_URL : undefined,
  });
  const resource = origins.mcpResourceOrigin;
  const issuer = origins.oauthIssuerOrigin.replace(/\/$/, "");
  return {
    resource,
    issuer,
    mcpEndpoint: resource,
    authorizationEndpoint: `${issuer}/authorize`,
    tokenEndpoint: `${issuer}/token`,
    registrationEndpoint: `${issuer}/register`,
    authorizationMetadataEndpoint: `${issuer}/.well-known/oauth-authorization-server`,
    protectedResourceMetadataEndpoint: `${issuer}/.well-known/oauth-protected-resource`,
    scopes: MCP_SCOPES,
    defaultScopes: MCP_DEFAULT_SCOPES,
    supportedGrantTypes: ["authorization_code", "refresh_token"] as const,
    supportedResponseTypes: ["code"] as const,
    supportedCodeChallengeMethods: ["S256"] as const,
  };
}

function comparableResource(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    if (url.protocol === "https:" && url.port === "443") url.port = "";
    if (url.protocol === "http:" && url.port === "80") url.port = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function validateMcpResource(
  requestResource: string | null | undefined,
  env: McpRegistryEnvironment = {},
) {
  if (!requestResource) return { ok: false as const, code: "invalid_request" as const };
  const expected = mcpConfiguration(env).resource;
  const actualComparable = comparableResource(requestResource);
  const expectedComparable = comparableResource(expected);
  if (actualComparable && expectedComparable && actualComparable === expectedComparable)
    return { ok: true as const, value: expected };
  return { ok: false as const, code: "invalid_target" as const };
}

export function validateMcpScopes(value: string | null | undefined) {
  const requested = [...new Set((value ?? "").split(/\s+/).filter(Boolean))];
  if (!requested.length) return { ok: false as const, code: "invalid_scope" as const };
  if (requested.some((scope) => !MCP_SCOPES.includes(scope)))
    return { ok: false as const, code: "invalid_scope" as const };
  const ordered = MCP_SCOPES.filter((scope) => requested.includes(scope));
  return {
    ok: true as const,
    value: ordered.join(" "),
    scopes: ordered,
    descriptions: MCP_SCOPE_DEFINITIONS.filter(({ scope }) => ordered.includes(scope)),
  };
}

export function hasMcpScope(scopeValue: string, required: string) {
  return new Set(scopeValue.split(/\s+/).filter(Boolean)).has(required);
}
