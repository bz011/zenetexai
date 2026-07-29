import type { ValidationIssue } from "../question-bank/types";
import type { QualityScores, SimilarityMatch, RawGeneratedOption, RawExplanationExtras } from "./types";

/**
 * Weighted overall score. Documented and code-constant, not a black box -
 * same transparency precedent as the Sprint 3.5 validator's health score.
 * `ambiguity_risk` is the one component where LOWER is better; it
 * contributes via a derived "clarity" term (100 - ambiguity_risk).
 *
 * Sprint 8 (Phase 7) adds four dimensions: scenario_realism/grammar_quality
 * (LLM-scored, folded into the existing critique call - no extra API cost)
 * and option_balance/explanation_quality (deterministic, code-computed -
 * same category as schema_validity/scenario_originality below). Existing
 * weights were reduced proportionally to make room; nothing was removed.
 */
const WEIGHTS = {
  schema_validity: 0.15,
  pmp_alignment: 0.16,
  answer_defensibility: 0.13,
  distractor_quality: 0.12,
  scenario_originality: 0.08,
  similarity_safety: 0.08,
  translation_quality: 0.06,
  metadata_consistency: 0.04,
  clarity: 0.03,
  scenario_realism: 0.05,
  grammar_quality: 0.04,
  option_balance: 0.03,
  explanation_quality: 0.03,
};

/**
 * Validator error codes that are EXPECTED and non-blocking for AI-generated
 * graphic_based/hotspot drafts specifically, because Sprint 5 deliberately
 * never generates images or hotspot coordinates - a human must attach them
 * during review before approval. These same codes remain full hard
 * failures for every other source (workbook imports, or AI drafts of any
 * other interaction_type) - this is a narrow, documented exception to the
 * shared validator's acceptance policy, not a second validator.
 */
const EXPECTED_INCOMPLETE_CODES = new Set(["GRAPHIC_MISSING_IMAGE", "HOTSPOT_MISSING_RECORD"]);

const HARD_FAIL_SCORE_FLOOR = 40;

export interface CritiqueResult {
  pmp_alignment: number;
  answer_defensibility: number;
  distractor_quality: number;
  ambiguity_risk: number;
  scenario_realism: number;
  grammar_quality: number;
  reasoning: string;
  reviewer_recommendations: string[];
}

export interface TranslationReviewResult {
  translation_quality: number;
  issues_found: string[];
}

export interface MetadataReviewResult {
  metadata_consistency: number;
  mismatches: string[];
}

export interface ComputeQualityScoresInput {
  validatorIssues: ValidationIssue[];
  interactionType: string;
  critique: CritiqueResult;
  translationReview: TranslationReviewResult;
  metadataReview: MetadataReviewResult;
  similarityMatches: SimilarityMatch[];
  /** Standard/graphic_based options only - empty for matching/drag_and_drop (option_balance doesn't apply, scored neutral). */
  options: RawGeneratedOption[];
  explanationExtras: RawExplanationExtras;
}

/**
 * Penalizes the classic MCQ "tell": a correct answer written conspicuously
 * longer (or shorter) than the distractors, which lets test-takers guess
 * without knowing the content. Deterministic, not LLM-scored - this is a
 * measurable property of the text itself. Scored 100 (neutral) when there
 * are fewer than 2 options to compare (matching/drag_and_drop).
 */
function computeOptionBalance(options: RawGeneratedOption[]): number {
  if (options.length < 2) return 100;

  const lengths = options.map((o) => o.option_text_en.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 100;

  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const coefficientOfVariation = Math.sqrt(variance) / mean;
  // CoV of 0 (identical lengths) -> 100; CoV of 0.6+ (highly uneven) -> 0.
  const balanceScore = Math.max(0, 100 - coefficientOfVariation * (100 / 0.6));

  const correct = options.find((o) => o.is_correct);
  const incorrect = options.filter((o) => !o.is_correct);
  if (!correct || incorrect.length === 0) return Math.round(balanceScore);

  const incorrectMean = incorrect.reduce((sum, o) => sum + o.option_text_en.length, 0) / incorrect.length;
  const correctDeviationRatio = incorrectMean > 0 ? Math.abs(correct.option_text_en.length - incorrectMean) / incorrectMean : 0;
  // The correct answer being >50% longer/shorter than the distractor
  // average is a strong giveaway - penalize independently of overall variance.
  const correctAnswerPenalty = correctDeviationRatio > 0.5 ? Math.min(40, (correctDeviationRatio - 0.5) * 80) : 0;

  return Math.round(Math.max(0, balanceScore - correctAnswerPenalty));
}

/**
 * Deterministic completeness check on the structured teaching content
 * (Phase 5) - not "is this well-written" (no LLM call needed for that),
 * just "is every required teaching element actually present and
 * substantive enough to be useful", since an empty or one-word field
 * technically satisfies the schema but teaches nothing.
 */
function computeExplanationQuality(extras: RawExplanationExtras): number {
  const minWords = (text: string, n: number) => text.trim().split(/\s+/).filter(Boolean).length >= n;

  const checks = [
    minWords(extras.key_concept_en, 2),
    minWords(extras.exam_tip_en, 4),
    minWords(extras.common_trap_en, 4),
    extras.related_concepts_en.length >= 2,
    minWords(extras.key_concept_ar, 2),
    minWords(extras.exam_tip_ar, 4),
    minWords(extras.common_trap_ar, 4),
    extras.related_concepts_ar.length >= 2,
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

function computeSchemaValidity(issues: ValidationIssue[], interactionType: string): { score: number; hardFailures: string[] } {
  const isPendingAssetType = interactionType === "graphic_based" || interactionType === "hotspot";
  const blockingIssues = issues.filter(
    (i) => i.severity === "error" && !(isPendingAssetType && EXPECTED_INCOMPLETE_CODES.has(i.code))
  );

  if (blockingIssues.length === 0) {
    return { score: 100, hardFailures: [] };
  }

  const score = Math.max(0, 100 - blockingIssues.length * 25);
  return {
    score,
    hardFailures: blockingIssues.map((i) => `${i.code}: ${i.message}`),
  };
}

function computeSimilaritySafety(matches: SimilarityMatch[]): { score: number; hardFailures: string[]; flags: string[] } {
  const hardRejects = matches.filter((m) => m.thresholdResult === "hard_reject");
  const warnings = matches.filter((m) => m.thresholdResult === "warning");

  if (hardRejects.length > 0) {
    return {
      score: 0,
      hardFailures: hardRejects.map(
        (m) =>
          `${m.comparisonType} similarity ${(m.similarityScore * 100).toFixed(1)}% against ${
            m.matchedQuestionId ?? m.matchedBatchQuestionId
          } exceeds the hard-reject threshold`
      ),
      flags: [],
    };
  }

  const score = warnings.length > 0 ? 70 : 100;
  const flags = warnings.map(
    (m) =>
      `${m.comparisonType} similarity ${(m.similarityScore * 100).toFixed(1)}% against ${
        m.matchedQuestionId ?? m.matchedBatchQuestionId
      } is in the warning range - review closely`
  );
  return { score, hardFailures: [], flags };
}

function computeScenarioOriginality(matches: SimilarityMatch[]): number {
  const maxSimilarity = matches.reduce((max, m) => Math.max(max, m.similarityScore), 0);
  return Math.round((1 - maxSimilarity) * 100);
}

export function computeQualityScores(input: ComputeQualityScoresInput): QualityScores {
  const schema = computeSchemaValidity(input.validatorIssues, input.interactionType);
  const similarity = computeSimilaritySafety(input.similarityMatches);
  const scenarioOriginality = computeScenarioOriginality(input.similarityMatches);
  const optionBalance = computeOptionBalance(input.options);
  const explanationQuality = computeExplanationQuality(input.explanationExtras);

  const flags: string[] = [...similarity.flags];
  const hardFailures: string[] = [...schema.hardFailures, ...similarity.hardFailures];

  if (input.critique.answer_defensibility < HARD_FAIL_SCORE_FLOOR) {
    hardFailures.push(`answer_defensibility (${input.critique.answer_defensibility}) below minimum threshold (${HARD_FAIL_SCORE_FLOOR})`);
  }
  if (input.critique.pmp_alignment < HARD_FAIL_SCORE_FLOOR) {
    hardFailures.push(`pmp_alignment (${input.critique.pmp_alignment}) below minimum threshold (${HARD_FAIL_SCORE_FLOOR})`);
  }

  if (input.critique.distractor_quality < 70) flags.push("distractor_quality below 70 - review distractors closely");
  if (input.critique.ambiguity_risk > 30) flags.push("ambiguity_risk above 30 - question wording may be unclear");
  if (input.translationReview.translation_quality < 70) flags.push("translation_quality below 70 - review Arabic content");
  if (input.metadataReview.metadata_consistency < 70) flags.push("metadata_consistency below 70 - declared metadata may not match content");
  if (input.critique.scenario_realism < 60) flags.push("scenario_realism below 60 - scenario may feel contrived");
  if (input.critique.grammar_quality < 70) flags.push("grammar_quality below 70 - review English prose");
  if (optionBalance < 60) flags.push("option_balance below 60 - option lengths may telegraph the correct answer");
  if (explanationQuality < 75) flags.push("explanation_quality below 75 - teaching content (key concept/exam tip/common trap) may be thin");

  const clarity = 100 - input.critique.ambiguity_risk;

  const overall =
    schema.score * WEIGHTS.schema_validity +
    input.critique.pmp_alignment * WEIGHTS.pmp_alignment +
    input.critique.answer_defensibility * WEIGHTS.answer_defensibility +
    input.critique.distractor_quality * WEIGHTS.distractor_quality +
    scenarioOriginality * WEIGHTS.scenario_originality +
    similarity.score * WEIGHTS.similarity_safety +
    input.translationReview.translation_quality * WEIGHTS.translation_quality +
    input.metadataReview.metadata_consistency * WEIGHTS.metadata_consistency +
    clarity * WEIGHTS.clarity +
    input.critique.scenario_realism * WEIGHTS.scenario_realism +
    input.critique.grammar_quality * WEIGHTS.grammar_quality +
    optionBalance * WEIGHTS.option_balance +
    explanationQuality * WEIGHTS.explanation_quality;

  return {
    schema_validity: schema.score,
    pmp_alignment: input.critique.pmp_alignment,
    answer_defensibility: input.critique.answer_defensibility,
    distractor_quality: input.critique.distractor_quality,
    scenario_originality: scenarioOriginality,
    similarity_safety: similarity.score,
    translation_quality: input.translationReview.translation_quality,
    metadata_consistency: input.metadataReview.metadata_consistency,
    ambiguity_risk: input.critique.ambiguity_risk,
    scenario_realism: input.critique.scenario_realism,
    grammar_quality: input.critique.grammar_quality,
    option_balance: optionBalance,
    explanation_quality: explanationQuality,
    overall: Math.round(overall * 100) / 100,
    flags,
    hard_failures: hardFailures,
    reviewer_recommendations: [
      ...input.critique.reviewer_recommendations,
      ...input.translationReview.issues_found,
      ...input.metadataReview.mismatches,
    ],
  };
}

/** A draft with any hard_failures must never be inserted into the review queue. */
export function hasHardFailure(scores: QualityScores): boolean {
  return scores.hard_failures.length > 0;
}
