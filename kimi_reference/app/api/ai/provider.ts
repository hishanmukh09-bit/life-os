import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { listModels } from "../lib/ai-client";

/** Gateway provider — server-side only, credentials injected by the platform. */
export const kimiGw = createOpenAICompatible({
  name: "kimi-gw",
  baseURL: process.env.KIMI_AGENTGW_BASE_URL ?? "",
  apiKey: process.env.KIMI_AGENTGW_API_KEY ?? "",
  includeUsage: true,
  supportsStructuredOutputs: true,
});

let cachedModel: string | null = null;

export async function defaultModel(): Promise<string> {
  if (cachedModel) return cachedModel;
  const { defaultModelId } = await listModels();
  cachedModel = defaultModelId;
  return defaultModelId;
}
