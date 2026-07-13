import { describe, it, expect, vi } from "vitest";

const createCompletion = vi.fn();
const createEmbedding = vi.fn();

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: (...args: unknown[]) => createCompletion(...args) } };
    embeddings = { create: (...args: unknown[]) => createEmbedding(...args) };
  },
}));

const { OpenAIProvider } = await import("./openaiProvider");
const { LLMProviderError } = await import("./types");

describe("OpenAIProvider", () => {
  it("throws LLMProviderError immediately if constructed without an API key", () => {
    expect(() => new OpenAIProvider("")).toThrow(LLMProviderError);
  });

  it("parses a well-formed JSON structured response and surfaces usage/model", async () => {
    createCompletion.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ hello: "world" }) } }],
      usage: { prompt_tokens: 120, completion_tokens: 45 },
    });
    const provider = new OpenAIProvider("test-key");
    const result = await provider.generateStructured<{ hello: string }>({
      systemPrompt: "sys",
      userPrompt: "user",
      schema: {},
      schemaName: "test_schema",
    });
    expect(result.data).toEqual({ hello: "world" });
    expect(result.usage).toEqual({ promptTokens: 120, completionTokens: 45 });
    expect(result.model).toBe("gpt-4o-2024-08-06");
  });

  it("wraps a malformed JSON response in a clear LLMProviderError instead of throwing a raw SyntaxError", async () => {
    createCompletion.mockResolvedValueOnce({
      choices: [{ message: { content: "{not valid json" } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });
    const provider = new OpenAIProvider("test-key");
    await expect(
      provider.generateStructured({ systemPrompt: "sys", userPrompt: "user", schema: {}, schemaName: "test_schema" })
    ).rejects.toThrow(LLMProviderError);
  });

  it("throws a clear error when OpenAI returns an empty message content", async () => {
    createCompletion.mockResolvedValueOnce({ choices: [{ message: {} }], usage: {} });
    const provider = new OpenAIProvider("test-key");
    await expect(
      provider.generateStructured({ systemPrompt: "sys", userPrompt: "user", schema: {}, schemaName: "test_schema" })
    ).rejects.toThrow(/empty response/);
  });

  it("returns embedding vectors and defaults to text-embedding-3-small", async () => {
    createEmbedding.mockResolvedValueOnce({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
      usage: { prompt_tokens: 8 },
    });
    const provider = new OpenAIProvider("test-key");
    const result = await provider.generateEmbedding("some question text");
    expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(result.model).toBe("text-embedding-3-small");
  });
});
