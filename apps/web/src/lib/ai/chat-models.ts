export type ChatModelDefinition = {
  id: string;
  name: string;
  provider: "openai";
  description: string;
  category: "flagship" | "fast" | "legacy";
};

/**
 * Models exposed by the chat selector.
 *
 * Keep this list limited to models that the current chat transport can route:
 * /api/agent/chat uses the user's connected OpenAI account through Nango.
 * Provider integrations can be added here only when their server-side
 * authentication and model factory are implemented as well.
 */
export const CHAT_MODEL_DEFINITIONS = [
  {
    id: "gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "openai",
    description: "Fast, cost-efficient execution for high-volume work",
    category: "fast",
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "openai",
    description: "Best balance of reasoning quality, speed, and cost",
    category: "flagship",
  },
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    description: "Deep reasoning for complex incidents and architecture",
    category: "flagship",
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    description: "Reliable general-purpose operations assistant",
    category: "legacy",
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 mini",
    provider: "openai",
    description: "Low-latency responses for everyday tasks",
    category: "legacy",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Multimodal reasoning and analysis",
    category: "legacy",
  },
  {
    id: "o4-mini",
    name: "o4-mini",
    provider: "openai",
    description: "Focused reasoning for complex decisions",
    category: "legacy",
  },
] as const satisfies readonly ChatModelDefinition[];

export const DEFAULT_CHAT_MODEL_ID = CHAT_MODEL_DEFINITIONS[0].id;

export function isSupportedChatModel(model: string): boolean {
  return CHAT_MODEL_DEFINITIONS.some((definition) => definition.id === model);
}
