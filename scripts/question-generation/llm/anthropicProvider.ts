import { withRetry } from "./retry";
import type { LLMProvider, StructuredGenerationParams, StructuredGenerationResult, EmbeddingResult } from "./types";
import { LLMProviderError } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

interface AnthropicToolUseBlock {
  type: "tool_use";
  name: string;
  input: Record<string, unknown>;
}

interface AnthropicMessagesResponse {
  content: (AnthropicToolUseBlock | { type: string })[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

/**
 * Anthropic implementation of the LLM Service Layer (Sprint 8, Phase 11
 * demonstration provider). Exists to prove the provider abstraction built in
 * Sprint 5 actually holds: everything above `LLMProvider` (generation
 * pipeline, quality gate, duplicate detection, pattern extraction) is
 * unchanged by this file's existence.
 *
 * Uses the raw Messages API via fetch rather than the `@anthropic-ai/sdk`
 * package deliberately - this is a demonstration of the abstraction, not a
 * production rollout, so it adds zero new npm dependencies. A real
 * production switch to Anthropic should likely use the official SDK
 * instead; swapping the HTTP call for an SDK call here would not require
 * any change to this class's public shape.
 *
 * Structured output is obtained via forced tool-use (the Anthropic
 * equivalent of OpenAI's json_schema response format): a single tool named
 * after schemaName is defined with `params.schema` as its input_schema, and
 * tool_choice forces the model to call it - so `input` on the resulting
 * tool_use block already matches the schema without needing to parse a raw
 * JSON string out of prose.
 *
 * generateEmbedding is NOT supported - Anthropic does not offer an
 * embeddings API. A real multi-provider deployment would need a small
 * per-capability dispatcher (e.g. always use OpenAI for embeddings
 * regardless of which provider generates text) rather than assuming every
 * provider implements every capability; that dispatcher is out of scope
 * for this demonstration and is called out explicitly rather than faked.
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  readonly defaultModel = "claude-sonnet-5";
  readonly defaultEmbeddingModel = "";

  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new LLMProviderError("Missing Anthropic API key", "anthropic");
    }
    this.apiKey = apiKey;
  }

  async generateStructured<T>(params: StructuredGenerationParams): Promise<StructuredGenerationResult<T>> {
    const model = params.model ?? this.defaultModel;

    try {
      const data = await withRetry(() => this.callMessages(model, params));

      const toolUse = data.content.find((block): block is AnthropicToolUseBlock => block.type === "tool_use" && "input" in block);
      if (!toolUse) {
        throw new LLMProviderError("Anthropic did not return a tool_use block with structured output", "anthropic");
      }

      return {
        data: toolUse.input as T,
        usage: {
          promptTokens: data.usage?.input_tokens ?? 0,
          completionTokens: data.usage?.output_tokens ?? 0,
        },
        model,
      };
    } catch (err) {
      if (err instanceof LLMProviderError) throw err;
      throw new LLMProviderError(`Anthropic structured generation failed: ${(err as Error).message}`, "anthropic", err);
    }
  }

  async generateEmbedding(_text: string, _model?: string): Promise<EmbeddingResult> {
    throw new LLMProviderError(
      "Anthropic has no embeddings API - use a different provider for embedding generation (see class header comment).",
      "anthropic"
    );
  }

  private async callMessages(model: string, params: StructuredGenerationParams): Promise<AnthropicMessagesResponse> {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxTokens ?? 2000,
        temperature: params.temperature ?? 0.7,
        system: params.systemPrompt,
        messages: [{ role: "user", content: params.userPrompt }],
        tools: [
          {
            name: params.schemaName,
            description: `Structured output conforming to the ${params.schemaName} schema.`,
            input_schema: params.schema,
          },
        ],
        tool_choice: { type: "tool", name: params.schemaName },
      }),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      const err = new Error(`Anthropic API error ${res.status}: ${bodyText}`) as Error & { status: number };
      err.status = res.status;
      throw err;
    }

    return (await res.json()) as AnthropicMessagesResponse;
  }
}
