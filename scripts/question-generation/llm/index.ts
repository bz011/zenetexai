import { OpenAIProvider } from "./openaiProvider";
import { AnthropicProvider } from "./anthropicProvider";
import type { LLMProvider } from "./types";

export type { LLMProvider, LLMUsage, StructuredGenerationParams, StructuredGenerationResult, EmbeddingResult } from "./types";
export { LLMProviderError } from "./types";

/**
 * Provider factory. Selects via LLM_PROVIDER env var (defaults to "openai").
 * Anthropic (Sprint 8, Phase 11) is a real second implementation, added
 * purely to prove the abstraction holds - the rest of the generation
 * pipeline required zero changes to support it. Note AnthropicProvider
 * cannot serve generateEmbedding calls (see its class header comment); a
 * production deployment mixing providers per-capability would need a small
 * dispatcher, not implemented here. Adding Gemini/Azure OpenAI later follows
 * the same shape: one new class implementing LLMProvider, one new case here.
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
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("Missing ANTHROPIC_API_KEY (checked zenetexai/.env.local)");
      }
      return new AnthropicProvider(apiKey);
    }
    default:
      throw new Error(
        `Unknown LLM_PROVIDER "${providerName}". Only "openai" and "anthropic" are implemented. ` +
          `Add a new provider class implementing LLMProvider and register it here.`
      );
  }
}
