import OpenAI from "openai";
import { withRetry } from "./retry";
import type {
  LLMProvider,
  StructuredGenerationParams,
  StructuredGenerationResult,
  EmbeddingResult,
} from "./types";
import { LLMProviderError } from "./types";

/**
 * OpenAI implementation of the LLM Service Layer. The only file that
 * imports the `openai` SDK - nothing else in this project should.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  readonly defaultModel = "gpt-4o-2024-08-06";
  readonly defaultEmbeddingModel = "text-embedding-3-small";

  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new LLMProviderError("Missing OpenAI API key", "openai");
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateStructured<T>(params: StructuredGenerationParams): Promise<StructuredGenerationResult<T>> {
    const model = params.model ?? this.defaultModel;

    try {
      const response = await withRetry(() =>
        this.client.chat.completions.create({
          model,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 2000,
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: params.schemaName,
              strict: true,
              schema: params.schema,
            },
          },
        })
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new LLMProviderError("OpenAI returned an empty response", "openai");
      }

      let parsed: T;
      try {
        parsed = JSON.parse(content) as T;
      } catch (parseErr) {
        throw new LLMProviderError(`Failed to parse OpenAI JSON response: ${(parseErr as Error).message}`, "openai", parseErr);
      }

      return {
        data: parsed,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
        },
        model,
      };
    } catch (err) {
      if (err instanceof LLMProviderError) throw err;
      throw new LLMProviderError(`OpenAI structured generation failed: ${(err as Error).message}`, "openai", err);
    }
  }

  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    const embeddingModel = model ?? this.defaultEmbeddingModel;

    try {
      const response = await withRetry(() =>
        this.client.embeddings.create({
          model: embeddingModel,
          input: text,
        })
      );

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new LLMProviderError("OpenAI returned no embedding data", "openai");
      }

      return {
        embedding,
        model: embeddingModel,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: 0,
        },
      };
    } catch (err) {
      if (err instanceof LLMProviderError) throw err;
      throw new LLMProviderError(`OpenAI embedding generation failed: ${(err as Error).message}`, "openai", err);
    }
  }
}
