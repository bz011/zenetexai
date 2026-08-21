import { supabaseAdmin } from "../../question-bank/supabaseAdminClient";
import type { LLMProvider } from "../llm/types";

export interface SemanticMatch {
  questionId: string;
  similarity: number; // cosine similarity, 0-1 (1 = identical)
}

/** Generates an embedding and stores it via the RPC (never a raw client-side vector insert - see migration 008). */
export async function embedAndStore(
  provider: LLMProvider,
  questionId: string,
  text: string
): Promise<{ promptTokens: number }> {
  const result = await provider.generateEmbedding(text);
  const { data, error } = await supabaseAdmin.rpc("store_question_embedding", {
    p_question_id: questionId,
    p_provider: provider.name,
    p_model: result.model,
    // Pass the raw number[] - NOT JSON.stringify(result.embedding). The RPC
    // client already JSON-encodes the whole params object once; stringifying
    // the array here first double-encodes it, so Postgres receives a JSONB
    // STRING containing array-looking text (jsonb_typeof = 'string') instead
    // of a genuine JSONB array - jsonb_array_elements_text() then fails with
    // "cannot extract elements from a scalar". Confirmed empirically: this
    // silently zeroed out question_embeddings entirely (0 rows for 494
    // approved questions) since the function's EXCEPTION WHEN OTHERS handler
    // returns {success:false} in the response BODY rather than a transport-
    // level error, and this call site never checked that body.
    p_embedding: result.embedding,
  });
  if (error) {
    throw new Error(`Failed to store embedding for ${questionId}: ${error.message}`);
  }
  const body = data as { success: boolean; error?: string } | null;
  if (!body?.success) {
    throw new Error(`Failed to store embedding for ${questionId}: ${body?.error ?? "unknown error"}`);
  }
  return { promptTokens: result.usage.promptTokens };
}

/** Nearest neighbors in the approved bank, via the find_similar_questions RPC. */
export async function findNearestApprovedQuestions(
  provider: LLMProvider,
  text: string,
  matchCount = 5,
  excludeQuestionId?: string
): Promise<{ matches: SemanticMatch[]; promptTokens: number }> {
  const result = await provider.generateEmbedding(text);

  const { data, error } = await supabaseAdmin.rpc("find_similar_questions", {
    // Raw number[], not JSON.stringify(...) - see embedAndStore's comment above.
    p_embedding: result.embedding,
    p_match_count: matchCount,
    p_exclude_question_id: excludeQuestionId ?? null,
  });

  if (error) {
    throw new Error(`Semantic similarity lookup failed: ${error.message}`);
  }

  const matches = ((data ?? []) as { question_id: string; similarity: number }[]).map((r) => ({
    questionId: r.question_id,
    similarity: r.similarity,
  }));

  return { matches, promptTokens: result.usage.promptTokens };
}
