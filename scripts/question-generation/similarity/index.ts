import { jaccardSimilarity, optionSetSimilarity, tagSetSimilarity } from "./lexicalSimilarity";
import { embedAndStore, findNearestApprovedQuestions } from "./semanticSimilarity";
import type { LLMProvider } from "../llm/types";
import type { SimilarityMatch } from "../types";

/**
 * Configurable thresholds. Documented here, not buried in logic, so they
 * can be audited/tuned - same transparency precedent as the Sprint 3.5
 * validator's health-score formula. Thresholds are heuristic, not a
 * guarantee of originality - human review is the real backstop.
 *
 * option_set/tag_set (Sprint 8, Phase 6) use a higher hard-reject bar than
 * lexical stem-text similarity: two questions can legitimately share a
 * couple of tags or one plausible-sounding distractor without being
 * duplicates, so only a near-total overlap should ever hard-reject.
 */
export const SIMILARITY_THRESHOLDS = {
  lexicalHardReject: 0.5,
  lexicalWarning: 0.3,
  semanticHardReject: 0.92,
  semanticWarning: 0.85,
  /**
   * Sprint 8.3 addition (pilot pattern-collapse incident): the pilot's
   * AIQ000015 measured 81.1%/80.8%/80.0% semantic similarity against three
   * different questions - all below semanticWarning, so all classified
   * "none" and completely ignored, leaving similarity_safety at 100. This
   * value reuses the EXISTING optionSetHardReject number (0.75) rather than
   * picking a new one - the two aren't conceptually identical, but both
   * already mark "no longer a coincidental overlap" in this file, so
   * reusing it keeps the threshold grounded in an already-reviewed number
   * instead of an arbitrary new one. Below this: no signal at all (still
   * "none"). Between this and semanticWarning: a graduated penalty in
   * qualityGate.ts's computeSimilaritySafety, continuous with the warning
   * tier's own score (no cliff at the boundary) - see that function.
   */
  semanticElevated: 0.75,
  optionSetHardReject: 0.75,
  optionSetWarning: 0.5,
  tagSetHardReject: 0.85,
  tagSetWarning: 0.6,
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
  /** Phase 6 additions - option-set and tag-set duplicate signals, compared against the same source questions as the lexical check. */
  draftOptionTexts: string[];
  draftTags: string[];
}

interface SourceQuestionData {
  text: string;
  optionTexts: string[];
  tags: string[];
}

async function fetchSourceQuestionData(questionIds: string[]): Promise<Map<string, SourceQuestionData>> {
  if (questionIds.length === 0) return new Map();
  const { supabaseAdmin } = await import("../../question-bank/supabaseAdminClient");

  const [{ data: questionRows }, { data: optionRows }] = await Promise.all([
    supabaseAdmin.from("questions").select("question_id, question_text_en, tags").in("question_id", questionIds),
    supabaseAdmin.from("question_options").select("question_id, option_text_en").in("question_id", questionIds),
  ]);

  const optionsByQuestion = new Map<string, string[]>();
  for (const row of (optionRows ?? []) as { question_id: string; option_text_en: string }[]) {
    const existing = optionsByQuestion.get(row.question_id) ?? [];
    existing.push(row.option_text_en);
    optionsByQuestion.set(row.question_id, existing);
  }

  const map = new Map<string, SourceQuestionData>();
  for (const row of (questionRows ?? []) as { question_id: string; question_text_en: string; tags: string[] | null }[]) {
    map.set(row.question_id, {
      text: row.question_text_en,
      optionTexts: optionsByQuestion.get(row.question_id) ?? [],
      tags: row.tags ?? [],
    });
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
): Promise<{ matches: SimilarityMatch[]; promptTokens: number; semanticComparisonHadCandidates: boolean }> {
  const matches: SimilarityMatch[] = [];
  let promptTokens = 0;

  // 1. Lexical, option-set, and tag-set against source questions (all
  // cheap, no API call - Phase 6 added option_set/tag_set alongside the
  // original lexical stem-text check).
  const sourceData = await fetchSourceQuestionData(input.sourceQuestionIds);
  for (const [questionId, source] of sourceData) {
    const lexicalScore = jaccardSimilarity(input.draftText, source.text);
    matches.push({
      comparisonType: "lexical",
      matchedQuestionId: questionId,
      similarityScore: lexicalScore,
      thresholdResult: classify(lexicalScore, SIMILARITY_THRESHOLDS.lexicalHardReject, SIMILARITY_THRESHOLDS.lexicalWarning),
    });

    if (input.draftOptionTexts.length > 0 && source.optionTexts.length > 0) {
      const optionScore = optionSetSimilarity(input.draftOptionTexts, source.optionTexts);
      matches.push({
        comparisonType: "option_set",
        matchedQuestionId: questionId,
        similarityScore: optionScore,
        thresholdResult: classify(optionScore, SIMILARITY_THRESHOLDS.optionSetHardReject, SIMILARITY_THRESHOLDS.optionSetWarning),
      });
    }

    if (input.draftTags.length > 0 && source.tags.length > 0) {
      const tagScore = tagSetSimilarity(input.draftTags, source.tags);
      matches.push({
        comparisonType: "tag_set",
        matchedQuestionId: questionId,
        similarityScore: tagScore,
        thresholdResult: classify(tagScore, SIMILARITY_THRESHOLDS.tagSetHardReject, SIMILARITY_THRESHOLDS.tagSetWarning),
      });
    }
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

  // 3. Semantic against nearest approved-bank neighbors (one embedding call).
  // find_similar_questions is a top-K nearest-neighbor query, not a
  // threshold filter (see migration 008) - it returns up to 5 rows
  // regardless of how similar they are, EXCEPT when question_embeddings
  // has fewer than 5 rows to compare against (including zero). That means
  // semanticMatches.length === 0 unambiguously means "no embedded content
  // existed to compare against yet", not "checked and found nothing
  // similar" - the two must not look the same to a reviewer (see
  // computeQualityScores' semanticComparisonHadCandidates flag).
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

  return { matches, promptTokens, semanticComparisonHadCandidates: semanticMatches.length > 0 };
}

export { embedAndStore };
