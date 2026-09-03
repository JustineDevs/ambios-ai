import type { OperationId } from "../packages/shared/operations";

export type CapabilityStatus = "available" | "roadmap" | "metadata-only" | "locked";
export type CapabilityRisk = "low" | "medium" | "high";
export type CapabilityApproval = "none" | "human";
// Chrome is the host/browser runtime, not a credentialed provider. Keep it out
// of this registry so the UI never presents a misleading auth flow for it.
export type Provider =
  | "openai"
  | "cloudflare"
  | "vercel"
  | "netlify"
  | "shopify"
  | "github"
  | "notion"
  | "snyk"
  | "socket"
  | "render";
export type ProviderAction = {
  toolName: string;
  description: string;
  scopes: readonly string[];
  risk: CapabilityRisk;
  approval: CapabilityApproval;
  rollback: string | null;
  operationId: OperationId;
};
export type ProviderCapability = {
  provider: Provider;
  label: string;
  credentialMode: "nango" | "runtime";
  status: CapabilityStatus;
  permissions: readonly string[];
  features: readonly ProviderAction[];
};
const action = (
  toolName: string,
  description: string,
  scopes: readonly string[],
  risk: CapabilityRisk,
  approval: CapabilityApproval,
  operationId: OperationId,
  rollback: string | null = null,
): ProviderAction => ({ toolName, description, scopes, risk, approval, operationId, rollback });
const security = {
  snyk: [
    action(
      "snyk.get_vulnerabilities",
      "Read Snyk vulnerability issues for the configured organization.",
      ["project:read"],
      "low",
      "none",
      "getSnykVulnerabilities",
    ),
    action(
      "snyk.scan_project",
      "Request a Snyk project scan through the connected security account.",
      ["project:read", "dependency:read"],
      "low",
      "none",
      "runSnykScan",
    ),
    action(
      "snyk.suggest_fix",
      "Return a reviewable Snyk remediation suggestion without applying changes.",
      ["project:read", "dependency:read"],
      "medium",
      "none",
      "getSnykFix",
    ),
  ],
  socket: [
    action(
      "socket.analyze_package",
      "Read Socket.dev package supply-chain risk analysis.",
      ["analyze:read"],
      "low",
      "none",
      "analyzeSocketPackage",
    ),
    action(
      "socket.get_supply_chain_report",
      "Read a Socket.dev supply-chain report.",
      ["report:read"],
      "low",
      "none",
      "getSocketReport",
    ),
    action(
      "socket.detect_malware",
      "Read Socket.dev malware analysis for a package.",
      ["malware:read"],
      "low",
      "none",
      "detectSocketMalware",
    ),
  ],
  github: [
    action(
      "github.dependabot.list_alerts",
      "Read Dependabot vulnerability alerts.",
      ["security_events:read"],
      "low",
      "none",
      "getGithubSecurity",
    ),
    action(
      "github.code-scanning.list_alerts",
      "Read code-scanning alerts.",
      ["security_events:read"],
      "low",
      "none",
      "getGithubSecurity",
    ),
    action(
      "github.secret-scanning.list_alerts",
      "Read secret-scanning alerts.",
      ["security_events:read"],
      "low",
      "none",
      "getGithubSecurity",
    ),
  ],
} satisfies Record<string, readonly ProviderAction[]>;
const capability = (
  provider: Provider,
  label: string,
  status: CapabilityStatus,
  features: readonly ProviderAction[] = [],
  credentialMode: "nango" | "runtime" = "nango",
): ProviderCapability => ({ provider, label, status, credentialMode, features, permissions: [] });
export const PROVIDER_CAPABILITIES = [
  capability("openai", "OpenAI", "available", [], "runtime"),
  capability("notion", "Notion", "available"),
  capability("cloudflare", "Cloudflare", "available"),
  capability("github", "GitHub", "available", security.github),
  capability("vercel", "Vercel", "available"),
  capability("netlify", "Netlify", "available"),
  capability("shopify", "Shopify", "available"),
  capability("snyk", "Snyk", "metadata-only", security.snyk),
  capability("socket", "Socket.dev", "metadata-only", security.socket),
  // Render stays visible to the domain model, but cannot be advertised or
  // registered as executable until its adapter and verified auth contract exist.
  capability("render", "Render", "locked", [], "runtime"),
] as const satisfies readonly ProviderCapability[];
export const NANGO_CONNECTOR_CAPABILITIES = PROVIDER_CAPABILITIES.filter(
  (item) => item.credentialMode === "nango" && !["locked", "roadmap"].includes(item.status),
);
