import { PROVIDER_CAPABILITIES, type ProviderAction } from "./capabilities.ts";

export type VendorFeature = ProviderAction & {
  vendor: string;
  riskLevel: ProviderAction["risk"];
  approvalRequired: boolean;
  readOnly: boolean;
};
export const VENDOR_FEATURE_MAP: readonly VendorFeature[] = PROVIDER_CAPABILITIES.flatMap(
  (capability) =>
    capability.status === "available"
      ? capability.features.map((feature) => ({
          ...feature,
          vendor: capability.provider,
          riskLevel: feature.risk,
          approvalRequired: feature.approval === "human",
          readOnly: feature.approval === "none" && feature.rollback === null,
        }))
      : [],
);
export const VENDOR_FEATURES = Object.fromEntries(
  VENDOR_FEATURE_MAP.map((feature) => [feature.toolName, feature]),
) as Record<string, VendorFeature>;
