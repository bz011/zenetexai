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
  const { error } = await supabaseAdmin.rpc("store_question_embedding", {
    p_question_id: questionId,
    p_provider: provider.name,
    p_model: result.model,
    p_embedding: JSON.stringify(result.embedding),
  });
  if (error) {
    throw new Error(`Failed to store embedding for ${questionId}: ${error.message}`);
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
    p_embedding: JSON.stringify(result.embedding),
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
