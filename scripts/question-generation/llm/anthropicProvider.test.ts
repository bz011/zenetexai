import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicProvider } from "./anthropicProvider";
import { LLMProviderError } from "./types";

describe("AnthropicProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws LLMProviderError immediately if constructed without an API key", () => {
    expect(() => new AnthropicProvider("")).toThrow(LLMProviderError);
  });

  it("parses a tool_use block into structured data and surfaces usage/model", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: "tool_use", name: "test_schema", input: { hello: "world" } }],
          usage: { input_tokens: 120, output_tokens: 45 },
        }),
      })
    );

    const provider = new AnthropicProvider("test-key");
    const result = await provider.generateStructured<{ hello: string }>({
      systemPrompt: "sys",
      userPrompt: "user",
      schema: {},
      schemaName: "test_schema",
    });

    expect(result.data).toEqual({ hello: "world" });
    expect(result.usage).toEqual({ promptTokens: 120, completionTokens: 45 });
    expect(result.model).toBe("claude-sonnet-5");
  });

  it("sends the schema as a forced tool call so the model can't skip structured output", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "tool_use", name: "test_schema", input: {} }], usage: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new AnthropicProvider("test-key");
    await provider.generateStructured({ systemPrompt: "sys", userPrompt: "user", schema: { type: "object" }, schemaName: "test_schema" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.tool_choice).toEqual({ type: "tool", name: "test_schema" });
    expect(body.tools[0].input_schema).toEqual({ type: "object" });
  });

  it("wraps a non-ok HTTP response in a clear LLMProviderError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "invalid api key" })
    );
    const provider = new AnthropicProvider("test-key");
    await expect(
      provider.generateStructured({ systemPrompt: "sys", userPrompt: "user", schema: {}, schemaName: "test_schema" })
    ).rejects.toThrow(LLMProviderError);
  });

  it("throws a clear error when no tool_use block is present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: "text" }], usage: {} }) })
    );
    const provider = new AnthropicProvider("test-key");
    await expect(
      provider.generateStructured({ systemPrompt: "sys", userPrompt: "user", schema: {}, schemaName: "test_schema" })
    ).rejects.toThrow(/tool_use/);
  });

  it("throws a clear, explicit error for generateEmbedding since Anthropic has no embeddings API", async () => {
    const provider = new AnthropicProvider("test-key");
    await expect(provider.generateEmbedding("some text")).rejects.toThrow(LLMProviderError);
    await expect(provider.generateEmbedding("some text")).rejects.toThrow(/no embeddings API/);
  });
});
