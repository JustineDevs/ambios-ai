import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createVertex } from "@ai-sdk/google-vertex";
import { createVertexAnthropic } from "@ai-sdk/google-vertex/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * Initializes the AI model provider.
 *
 * Two modes:
 * 1. Vercel AI Gateway: If AI_GATEWAY_API_KEY is set, routes through a unified gateway that handles
 *    provider abstraction. Just returns the provider model string (e.g. "anthropic/claude-sonnet-4-5").
 *    The gateway handles auth and routing to the actual provider.
 *
 * 2. Provider adapters: Initializes the selected SDK provider with a server-held credential.
 *    External account credentials must never be passed from the browser.
 *
 * @param options - Configuration options
 * @param options.providerEnvVar - Environment variable name for the provider (default: 'LLM_PROVIDER')
 * @param options.defaultModel - Default model if not specified in env (default: 'gpt-4.1')
 * @param options.modelOverride - If set, use this model instead of env var (useful for dedicated endpoints)
 * @returns AI model instance that can be used with Vercel AI SDK functions
 */
export function initializeAIModel(options?: {
  providerEnvVar?: string;
  providerOverride?: string;
  defaultModel?: string;
  modelOverride?: string;
  apiKey?: string;
  openaiFetch?: any;
  gatewayModel?: string;
}): any {
  const providerEnvVar = options?.providerEnvVar || "LLM_PROVIDER";
  const defaultModel = options?.defaultModel || "gpt-4.1";
  const modelOverride = options?.modelOverride;
  const hasExplicitProvider = Boolean(options?.providerOverride || options?.openaiFetch);
  if (
    !hasExplicitProvider &&
    ((process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_MODEL) || options?.gatewayModel)
  ) {
    return modelOverride || options?.gatewayModel || process.env.AI_GATEWAY_MODEL;
  }

  let provider: any;
  let modelId: string;
  const providerType = (options?.providerOverride || process.env[providerEnvVar])?.toLowerCase();

  switch (providerType) {
    case "anthropic": {
      const anthropicOptions: any = {
        apiKey: options?.apiKey || process.env.ANTHROPIC_API_KEY || "server-runtime-managed",
        headers: { "anthropic-beta": "context-1m-2025-08-07" },
      };
      if (process.env.ANTHROPIC_BASE_URL) {
        anthropicOptions.baseURL = process.env.ANTHROPIC_BASE_URL;
      }
      provider = createAnthropic(anthropicOptions);
      modelId = modelOverride || process.env.ANTHROPIC_MODEL || defaultModel;
      break;
    }
    case "openai": {
      const openaiOptions: any = {
        apiKey: options?.apiKey || process.env.OPENAI_API_KEY || "server-runtime-managed",
      };
      if (options?.openaiFetch) openaiOptions.fetch = options.openaiFetch;
      if (process.env.OPENAI_BASE_URL) {
        openaiOptions.baseURL = process.env.OPENAI_BASE_URL;
      }
      provider = createOpenAI(openaiOptions);
      modelId = modelOverride || process.env.OPENAI_MODEL || defaultModel;
      break;
    }
    case "gemini": {
      const geminiOptions: any = {
        apiKey: options?.apiKey || process.env.GEMINI_API_KEY || "server-runtime-managed",
      };
      if (process.env.GEMINI_BASE_URL) {
        geminiOptions.baseURL = process.env.GEMINI_BASE_URL;
      }
      provider = createGoogleGenerativeAI(geminiOptions);
      modelId = modelOverride || process.env.GEMINI_MODEL || defaultModel;
      break;
    }
    case "azure": {
      const azureOptions: any = {
        apiKey: options?.apiKey || process.env.AZURE_API_KEY || "server-runtime-managed",
      };
      if (!process.env.AZURE_RESOURCE_NAME && !process.env.AZURE_BASE_URL) {
        throw new Error("Either AZURE_RESOURCE_NAME or AZURE_BASE_URL needs to be set");
      }
      if (process.env.AZURE_RESOURCE_NAME) {
        azureOptions.resourceName = process.env.AZURE_RESOURCE_NAME;
      }
      if (process.env.AZURE_BASE_URL) {
        azureOptions.baseURL = process.env.AZURE_BASE_URL;
      }
      if (process.env.AZURE_API_VERSION) {
        azureOptions.apiVersion = process.env.AZURE_API_VERSION;
      }
      if (process.env.AZURE_USE_DEPLOYMENT_BASED_URLS !== undefined) {
        azureOptions.useDeploymentBasedUrls =
          process.env.AZURE_USE_DEPLOYMENT_BASED_URLS === "true";
      }
      provider = createAzure(azureOptions);
      modelId = modelOverride || process.env.AZURE_MODEL || defaultModel;
      break;
    }
    case "bedrock": {
      const bedrockOptions: any = {};
      if (process.env.AWS_BASE_URL) {
        bedrockOptions.baseURL = process.env.AWS_BASE_URL;
      }
      provider = createAmazonBedrock(bedrockOptions);
      modelId = modelOverride || process.env.BEDROCK_MODEL || defaultModel;
      break;
    }
    case "vertex": {
      modelId = modelOverride || process.env.VERTEX_MODEL || defaultModel;
      const isAnthropicModel = modelId.startsWith("claude");
      if (isAnthropicModel) {
        const anthropicVertexOptions: any = {};
        if (process.env.VERTEX_PROJECT) {
          anthropicVertexOptions.project = process.env.VERTEX_PROJECT;
        }
        if (process.env.VERTEX_LOCATION) {
          anthropicVertexOptions.location = process.env.VERTEX_LOCATION;
        }
        provider = createVertexAnthropic(anthropicVertexOptions);
      } else {
        const vertexOptions: any = {
          apiKey: options?.apiKey || process.env.VERTEX_API_KEY || "server-runtime-managed",
        };
        if (process.env.VERTEX_PROJECT) {
          vertexOptions.project = process.env.VERTEX_PROJECT;
        }
        if (process.env.VERTEX_LOCATION) {
          vertexOptions.location = process.env.VERTEX_LOCATION;
        }
        provider = createVertex(vertexOptions);
      }
      break;
    }
    default:
      throw new Error(
        `Invalid provider: ${providerType}. Must be one of: anthropic, openai, gemini, azure, bedrock, vertex`,
      );
  }

  return provider(modelId);
}
