import { initializeAIModel } from "@ambios-ai/shared/utils/ai-model-init";
import { getD1, getOrganizationForUser } from "@/lib/ambios/d1";
import { nangoProxyFetch } from "@/lib/nango/server";

export async function initializeUserAIModel(userId: string, modelOverride?: string) {
  const organization = await getOrganizationForUser(userId);
  if (!organization) throw new Error("Organization membership required");
  const integration = await getD1()
    .then((db) =>
      db
        .prepare(
          "SELECT connection_id AS connectionId FROM integrations WHERE organization_id = ? AND provider = 'openai' AND status = 'connected' ORDER BY created_at DESC LIMIT 1",
        )
        .bind(organization.id)
        .first<{ connectionId: string | null }>(),
    )
    .catch(() => null);
  if (!integration?.connectionId) throw new Error("OpenAI is not connected for this workspace");

  return initializeAIModel({
    providerOverride: "openai",
    modelOverride,
    openaiFetch: await nangoProxyFetch({
      providerConfigKey: "openai",
      connectionId: integration.connectionId,
    }),
  });
}
