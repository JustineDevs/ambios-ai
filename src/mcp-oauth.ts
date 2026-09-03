import {
  hasMcpScope,
  type MCP_SCOPES,
  mcpConfiguration,
  validateMcpResource,
  validateMcpScopes,
} from "../packages/shared/mcp-resource-registry.js";
import type { HonoBindings } from "./hono-app";

export {
  MCP_SCOPES,
  mcpConfiguration,
  validateMcpResource,
  validateMcpScopes,
} from "../packages/shared/mcp-resource-registry.js";

export function mcpResource(env?: { ENVIRONMENT?: string; MCP_RESOURCE_URL?: string }) {
  return mcpConfiguration({
    NODE_ENV: env?.ENVIRONMENT === "production" ? "production" : "development",
    MCP_RESOURCE_URL: env?.MCP_RESOURCE_URL,
  }).resource;
}

export const MCP_RESOURCE = mcpResource({ ENVIRONMENT: "production" });
const AUTH_REQUEST_TTL_SECONDS = 600;
const AUTH_CODE_TTL_SECONDS = 60;
const ACCESS_TOKEN_TTL_SECONDS = 900;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export type McpClient = {
  clientId: string;
  clientName: string;
  redirectUris: string[];
};

export function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

export async function digest(value: string) {
  const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function pkceMatches(verifier: string, challenge: string) {
  return (
    base64Url(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))),
    ) === challenge
  );
}

export function oauthError(
  error: string,
  description: string,
  redirectUri?: string,
  state?: string,
) {
  if (!redirectUri)
    return Response.json({ error, error_description: description }, { status: 400 });
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  return Response.redirect(url.toString(), 302);
}

export function canonicalResource(value: string | null, expected = MCP_RESOURCE) {
  return validateMcpResource(value, { NODE_ENV: "production", MCP_RESOURCE_URL: expected }).ok
    ? expected
    : null;
}

export function parseScope(value: string | null) {
  const result = validateMcpScopes(value);
  return result.ok ? result.value : null;
}

export function hasScope(scopeValue: string, required: (typeof MCP_SCOPES)[number]) {
  return hasMcpScope(scopeValue, required);
}

export function isSafeRedirectUri(value: string, allowLocalhost = false) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      (allowLocalhost && url.protocol === "http:" && url.hostname === "localhost")
    );
  } catch {
    return false;
  }
}

export function issuer(env: HonoBindings) {
  return mcpConfiguration(env).issuer;
}

export async function findMcpToken(
  db: D1Database | undefined,
  rawToken: string | null,
  expectedIssuer: string,
  expectedResource = MCP_RESOURCE,
) {
  if (!db || !rawToken) return null;
  const tokenHash = await digest(rawToken);
  return db
    .prepare(
      "SELECT client_id AS clientId, user_id AS userId, organization_id AS organizationId, resource, scope, issuer, audience, expires_at AS expiresAt FROM mcp_access_tokens WHERE token_hash = ? AND issuer = ? AND audience = ? AND revoked_at IS NULL AND datetime(expires_at) > datetime('now') LIMIT 1",
    )
    .bind(tokenHash, expectedIssuer, expectedResource)
    .first<{
      clientId: string;
      userId: string;
      organizationId: string | null;
      resource: string;
      scope: string;
      issuer: string;
      audience: string;
      expiresAt: string;
    }>();
}

export function bearerToken(request: Request) {
  const value = request.headers.get("Authorization");
  return value?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}

export function tokenResponse(accessToken: string, refreshToken: string, scope: string) {
  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
    scope,
  };
}

export const tokenTtls = {
  AUTH_REQUEST_TTL_SECONDS,
  AUTH_CODE_TTL_SECONDS,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
};
