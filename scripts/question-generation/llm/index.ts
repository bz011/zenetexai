import { OpenAIProvider } from "./openaiProvider";
import type { LLMProvider } from "./types";

export type { LLMProvider, LLMUsage, StructuredGenerationParams, StructuredGenerationResult, EmbeddingResult } from "./types";
export { LLMProviderError } from "./types";

/**
 * Provider factory. Selects via LLM_PROVIDER env var (defaults to "openai").
 * Adding Anthropic later means writing an AnthropicProvider implementing
 * the same LLMProvider interface and adding one case here - the rest of
 * the generation pipeline never changes.
 */
export function getLLMProvider(): LLMProvider {
  const providerName = (process.env.LLM_PROVIDER || "openai").toLowerCase();

  switch (providerName) {
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY (checked zenetexai/.env.local)");
      }
      return new OpenAIProvider(apiKey);
    }
    default:
      throw new Error(
        `Unknown LLM_PROVIDER "${providerName}". Only "openai" is implemented in Sprint 5. ` +
          `Add a new provider class implementing LLMProvider and register it here.`
      );
  }
}
