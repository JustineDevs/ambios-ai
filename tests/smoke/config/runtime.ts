import { type OperationId, operationPath } from "../../../packages/shared/operations.ts";
import { serviceOriginsFromEnv } from "../../../packages/shared/service-origins.ts";

export type SmokeEnvironment = "development" | "test" | "preview" | "staging" | "production";

export type SmokeConfig = {
  environment: SmokeEnvironment;
  origins: ReturnType<typeof serviceOriginsFromEnv>;
  demoEmail?: string;
  demoPassword?: string;
  demoWorkspace?: string;
  demoOrganization?: string;
  providerTestMode: string;
  providerSandboxReference?: string;
  artifacts: string;
  reports: string;
  runId: string;
  hasDemoCredentials: boolean;
};

const validEnvironments = new Set<SmokeEnvironment>([
  "development",
  "test",
  "preview",
  "staging",
  "production",
]);

export function smokeConfig(env: Record<string, string | undefined> = process.env): SmokeConfig {
  const environment = (env.TEST_ENVIRONMENT ??
    (env.NODE_ENV === "production" ? "production" : "development")) as SmokeEnvironment;
  if (!validEnvironments.has(environment))
    throw new Error(`TEST_ENVIRONMENT is invalid: ${environment}`);
  const origins = serviceOriginsFromEnv({
    ...env,
    NODE_ENV:
      environment === "production" || environment === "staging" || environment === "preview"
        ? "production"
        : "test",
    NEXT_PUBLIC_APP_URL: env.FRONTEND_ORIGIN ?? env.NEXT_PUBLIC_APP_URL,
    AMBIOS_WORKER_URL: env.CORE_API_ORIGIN ?? env.AMBIOS_WORKER_URL,
    AMBIOS_CONNECTOR_URL: env.CONNECTOR_API_ORIGIN ?? env.AMBIOS_CONNECTOR_URL,
    MCP_RESOURCE_URL: env.MCP_RESOURCE_URL,
    MCP_AUTHORIZATION_SERVER_URL: env.OAUTH_ISSUER_URL ?? env.MCP_AUTHORIZATION_SERVER_URL,
  });
  const urls = [
    origins.frontendOrigin,
    origins.coreApiOrigin,
    origins.connectorApiOrigin,
    origins.mcpResourceOrigin,
    origins.oauthIssuerOrigin,
  ];
  if (environment !== "development" && environment !== "test") {
    const requiredOrigins = [
      "FRONTEND_ORIGIN",
      "CORE_API_ORIGIN",
      "CONNECTOR_API_ORIGIN",
      "MCP_RESOURCE_URL",
      "OAUTH_ISSUER_URL",
    ] as const;
    const missingOrigins = requiredOrigins.filter((name) => !env[name]);
    if (missingOrigins.length)
      throw new Error(`Missing deployed smoke origins: ${missingOrigins.join(", ")}`);
    for (const value of urls)
      if (!value.startsWith("https://"))
        throw new Error(`HTTPS is required for ${environment}: ${value}`);
    if (urls.some((value) => /localhost|127\.0\.0\.1|4136|pages\.dev|vite/i.test(value)))
      throw new Error(
        "A local, Pages, Vite, or deprecated port origin is configured for a deployed smoke target",
      );
  }
  const runId = env.TEST_RUN_ID ?? `smoke-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  return {
    environment,
    origins,
    demoEmail: env.DEMO_USER_EMAIL,
    demoPassword: env.DEMO_USER_PASSWORD,
    demoWorkspace: env.DEMO_WORKSPACE_REFERENCE,
    demoOrganization: env.DEMO_ORGANIZATION_REFERENCE,
    providerTestMode: env.DEMO_PROVIDER_TEST_MODE ?? "none",
    providerSandboxReference: env.DEMO_PROVIDER_SANDBOX_REFERENCE,
    artifacts: env.TEST_ARTIFACT_DIRECTORY ?? "artifacts/smoke",
    reports: env.TEST_REPORT_DIRECTORY ?? "reports/smoke",
    runId,
    hasDemoCredentials: Boolean(env.DEMO_USER_EMAIL && env.DEMO_USER_PASSWORD),
  };
}

export function smokeUrl(
  config: SmokeConfig,
  operationId: OperationId,
  params: Record<string, string> = {},
  service: "frontend" | "core" | "connector" | "oauth" = "core",
) {
  const origin =
    service === "frontend"
      ? config.origins.frontendOrigin
      : service === "connector"
        ? config.origins.connectorApiOrigin
        : service === "oauth"
          ? config.origins.oauthIssuerOrigin
          : config.origins.coreApiOrigin;
  return `${origin}${operationPath(operationId, params)}`;
}

export function operationRoute(operationId: OperationId, params: Record<string, string> = {}) {
  return operationPath(operationId, params);
}
