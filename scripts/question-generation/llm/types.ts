/**
 * Provider-independent LLM Service Layer.
 *
 * Deliberately minimal: a provider only has to implement TWO methods
 * (generateStructured, generateEmbedding). The six required capabilities
 * (structured text generation, question generation, pattern extraction,
 * critique/review, translation/localization, embeddings) are built ON TOP
 * of these two primitives at the pipeline layer, using distinct prompts +
 * JSON schemas per operation - so adding a second provider (Anthropic)
 * later means implementing 2 methods, not 6, and the generation pipeline
 * itself never needs to change.
 *
 * Never import a provider SDK (openai, anthropic, etc.) outside this
 * directory. Never call a provider from a React component - this is
 * server-only, offline pipeline code.
 */

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface StructuredGenerationParams {
  systemPrompt: string;
  userPrompt: string;
  /** JSON Schema the response must conform to. */
  schema: Record<string, unknown>;
  schemaName: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StructuredGenerationResult<T> {
  data: T;
  usage: LLMUsage;
  model: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: LLMUsage;
}

export interface LLMProvider {
  readonly name: string;
  readonly defaultModel: string;
  readonly defaultEmbeddingModel: string;

  generateStructured<T>(params: StructuredGenerationParams): Promise<StructuredGenerationResult<T>>;
  generateEmbedding(text: string, model?: string): Promise<EmbeddingResult>;
}

export class LLMProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LLMProviderError";
  }
}
