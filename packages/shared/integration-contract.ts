import { z } from "zod";

export const ConnectionStatusSchema = z.enum([
  "not_configured",
  "authorization_started",
  "authorization_pending",
  "connected",
  "reauthentication_required",
  "revoked",
  "disconnected",
  "error",
  "unsupported",
]);
/** How AmbiOS obtains access for a catalog entry. ChatGPT MCP is separate. */
export const IntegrationConnectionModeSchema = z.enum([
  "provider_oauth",
  "provider_api_key",
  "mcp_oauth",
]);
export const ConnectionHealthSchema = z.enum([
  "unknown",
  "checking",
  "healthy",
  "degraded",
  "unavailable",
  "failed",
]);
export const CapabilityStatusSchema = z.enum([
  "unverified",
  "read_only",
  "propose_only",
  "execute_with_approval",
  "limited",
  "unsupported",
]);
export const ResourceMappingStatusSchema = z.enum([
  "not_required",
  "unmapped",
  "partially_mapped",
  "mapped",
  "verification_required",
  "verified",
  "invalid",
]);
export const SyncStatusSchema = z.enum([
  "never_synced",
  "queued",
  "running",
  "succeeded",
  "failed",
  "not_supported",
]);

export const IntegrationConnectionSchema = z.object({
  connectionId: z.string().nullable(),
  organizationId: z.string(),
  workspaceId: z.string(),
  providerId: z.string(),
  providerDisplayName: z.string(),
  providerCategory: z.string(),
  connectionMode: IntegrationConnectionModeSchema,
  accountReferenceSafe: z.string().nullable(),
  connectionStatus: ConnectionStatusSchema,
  connectionHealth: ConnectionHealthSchema,
  capabilityStatus: CapabilityStatusSchema,
  capabilities: z.array(z.string()),
  resourceMappingStatus: ResourceMappingStatusSchema,
  mappedResourceCount: z.number().int().nonnegative(),
  lastConnectionCheckAt: z.string().nullable(),
  lastSuccessfulVerificationAt: z.string().nullable(),
  lastSyncAt: z.string().nullable(),
  lastSyncStatus: SyncStatusSchema,
  lastErrorCode: z.string().nullable(),
  lastErrorMessageSafe: z.string().nullable(),
  nextAction: z.string(),
  connectionCreatedAt: z.string().nullable(),
  connectionUpdatedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  version: z.number().int().nonnegative(),
  providerMetadataVersion: z.string(),
});
export type IntegrationConnection = z.infer<typeof IntegrationConnectionSchema>;

export const IntegrationListSchema = z.object({
  data: z.object({
    integrations: z.array(IntegrationConnectionSchema),
    nextCursor: z.string().nullable(),
  }),
});
export const IntegrationDetailSchema = z.object({ data: IntegrationConnectionSchema });

export function safeIntegrationConnection(
  input: Partial<IntegrationConnection> &
    Pick<
      IntegrationConnection,
      "providerId" | "providerDisplayName" | "organizationId" | "workspaceId"
    >,
): IntegrationConnection {
  return IntegrationConnectionSchema.parse({
    connectionId: null,
    providerCategory: "other",
    connectionMode: "provider_oauth",
    accountReferenceSafe: null,
    connectionStatus: "not_configured",
    connectionHealth: "unknown",
    capabilityStatus: "unverified",
    capabilities: [],
    resourceMappingStatus: "not_required",
    mappedResourceCount: 0,
    lastConnectionCheckAt: null,
    lastSuccessfulVerificationAt: null,
    lastSyncAt: null,
    lastSyncStatus: "never_synced",
    lastErrorCode: null,
    lastErrorMessageSafe: null,
    nextAction: "Connect to inspect available workspace resources",
    connectionCreatedAt: null,
    connectionUpdatedAt: null,
    revokedAt: null,
    createdBy: null,
    updatedBy: null,
    version: 1,
    providerMetadataVersion: "1",
    ...input,
  });
}
