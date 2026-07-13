import { jaccardSimilarity } from "./lexicalSimilarity";
import { embedAndStore, findNearestApprovedQuestions } from "./semanticSimilarity";
import type { LLMProvider } from "../llm/types";
import type { SimilarityMatch } from "../types";

/**
 * Configurable thresholds. Documented here, not buried in logic, so they
 * can be audited/tuned - same transparency precedent as the Sprint 3.5
 * validator's health-score formula. Thresholds are heuristic, not a
 * guarantee of originality - human review is the real backstop.
 */
export const SIMILARITY_THRESHOLDS = {
  lexicalHardReject: 0.5,
  lexicalWarning: 0.3,
  semanticHardReject: 0.92,
  semanticWarning: 0.85,
};

function classify(score: number, hardReject: number, warning: number): "hard_reject" | "warning" | "none" {
  if (score >= hardReject) return "hard_reject";
  if (score >= warning) return "warning";
  return "none";
}

export interface SimilarityCheckInput {
  draftText: string;
  draftBatchQuestionId?: string; // set once the generation_batch_questions row exists, for same-batch comparisons
  sourceQuestionIds: string[]; // the pattern's source_question_ids
  sameBatchDraftTexts: { batchQuestionId: string; text: string }[]; // other drafts already generated in this run
}

async function fetchQuestionTexts(questionIds: string[]): Promise<Map<string, string>> {
  if (questionIds.length === 0) return new Map();
  const { supabaseAdmin } = await import("../../question-bank/supabaseAdminClient");
  const { data } = await supabaseAdmin.from("questions").select("question_id, question_text_en").in("question_id", questionIds);
  const map = new Map<string, string>();
  for (const row of (data ?? []) as { question_id: string; question_text_en: string }[]) {
    map.set(row.question_id, row.question_text_en);
  }
  return map;
}

/**
 * Runs both similarity layers against: the pattern's source questions,
 * nearest neighbors in the approved bank (semantic only - too expensive to
 * lexically diff against the whole bank), and other drafts already
 * produced in the current batch.
 */
export async function runSimilarityChecks(
  provider: LLMProvider,
  input: SimilarityCheckInput
): Promise<{ matches: SimilarityMatch[]; promptTokens: number }> {
  const matches: SimilarityMatch[] = [];
  let promptTokens = 0;

  // 1. Lexical against source questions (cheap, no API call)
  const sourceTexts = await fetchQuestionTexts(input.sourceQuestionIds);
  for (const [questionId, text] of sourceTexts) {
    const score = jaccardSimilarity(input.draftText, text);
    matches.push({
      comparisonType: "lexical",
      matchedQuestionId: questionId,
      similarityScore: score,
      thresholdResult: classify(score, SIMILARITY_THRESHOLDS.lexicalHardReject, SIMILARITY_THRESHOLDS.lexicalWarning),
    });
  }

  // 2. Lexical against same-batch drafts (cheap, no API call)
  for (const other of input.sameBatchDraftTexts) {
    const score = jaccardSimilarity(input.draftText, other.text);
    matches.push({
      comparisonType: "lexical",
      matchedBatchQuestionId: other.batchQuestionId,
      similarityScore: score,
      thresholdResult: classify(score, SIMILARITY_THRESHOLDS.lexicalHardReject, SIMILARITY_THRESHOLDS.lexicalWarning),
    });
  }

  // 3. Semantic against nearest approved-bank neighbors (one embedding call)
  const { matches: semanticMatches, promptTokens: embedTokens } = await findNearestApprovedQuestions(
    provider,
    input.draftText,
    5
  );
  promptTokens += embedTokens;
  for (const m of semanticMatches) {
    matches.push({
      comparisonType: "semantic",
      matchedQuestionId: m.questionId,
      similarityScore: m.similarity,
      thresholdResult: classify(m.similarity, SIMILARITY_THRESHOLDS.semanticHardReject, SIMILARITY_THRESHOLDS.semanticWarning),
    });
  }

  return { matches, promptTokens };
}

export { embedAndStore };
