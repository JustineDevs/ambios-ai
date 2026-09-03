import { initializeAIModel } from "@ambios-ai/shared/utils/ai-model-init";
import { backendGet } from "@/lib/ambios/d1";
import { nangoProxyFetch } from "@/lib/nango/server";

export async function initializeUserAIModel(userId: string, modelOverride?: string) {
  void userId;
  // backendGet already unwraps the worker's `{ data: ... }` response envelope.
  const result = await backendGet<{
    integrations?: Array<{
      providerId: string;
      connectionId: string | null;
      connectionStatus: string;
    }>;
    data?: {
      integrations?: Array<{
        providerId: string;
        connectionId: string | null;
        connectionStatus: string;
      }>;
    };
  } | null>("listIntegrations");
  const integrations = result?.integrations ?? result?.data?.integrations ?? [];
  const integration = integrations.find(
    (item) => item.providerId === "openai" && item.connectionStatus === "connected",
  );
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
