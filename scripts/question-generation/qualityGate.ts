import type { ValidationIssue } from "../question-bank/types";
import type { QualityScores, SimilarityMatch, RawGeneratedOption, RawExplanationExtras } from "./types";

/**
 * Weighted overall score. Documented and code-constant, not a black box -
 * same transparency precedent as the Sprint 3.5 validator's health score.
 * `ambiguity_risk` and `answer_obviousness` are the two components where
 * LOWER is better; they contribute via derived "clarity"/"answer_subtlety"
 * terms (100 - the raw score).
 *
 * Sprint 8.2 rebalance (post-AIQ000003 calibration incident - see
 * qualityGate.test.ts's "assessment-critical dimensions" describe block for
 * the regression tests this incident produced): AIQ000003 scored 88.56/100
 * despite human review finding the distractors too weak and the correct
 * answer too obvious - the pipeline never explicitly measured either of
 * those things, and the 13-dimension weighting let strong grammar/
 * translation/metadata/formatting scores paper over weak assessment
 * quality. Two new LLM-scored dimensions were added (answer_obviousness,
 * pmi_decision_depth, folded into the existing critique call - no extra API
 * cost) and one new deterministic dimension (option_parallelism). Weight
 * was reallocated FROM secondary/formatting dimensions (schema_validity,
 * translation_quality, metadata_consistency, clarity, grammar_quality,
 * scenario_originality, similarity_safety, option_balance,
 * explanation_quality) TO the five "assessment-critical" dimensions this
 * incident showed matter most: pmp_alignment, answer_defensibility,
 * distractor_quality, answer_obviousness, pmi_decision_depth. Those five
 * alone now carry 61% of the total weight (up from pmp_alignment +
 * answer_defensibility + distractor_quality = 41% before), and are also the
 * ones subject to CRITICAL_GATE_FLOOR below - a serious weakness in any one
 * of them hard-rejects the draft regardless of how high the weighted
 * average would otherwise land.
 */
const WEIGHTS = {
  // Assessment-critical (61% combined) - also gated individually, see CRITICAL_GATE_FLOOR.
  pmp_alignment: 0.16,
  answer_defensibility: 0.13,
  distractor_quality: 0.14,
  answer_obviousness: 0.1,
  pmi_decision_depth: 0.08,
  // Supporting dimensions (39% combined) - real signal, but excellence here
  // must never compensate for a critical-dimension weakness (enforced by
  // the gate, not just the weighting).
  schema_validity: 0.08,
  scenario_realism: 0.06,
  scenario_originality: 0.05,
  similarity_safety: 0.05,
  translation_quality: 0.03,
  metadata_consistency: 0.03,
  grammar_quality: 0.02,
  option_balance: 0.02,
  option_parallelism: 0.02,
  explanation_quality: 0.02,
  clarity: 0.01,
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

/** Applies to every direct (higher-is-better) assessment-critical dimension: pmp_alignment, answer_defensibility, distractor_quality, pmi_decision_depth. */
const HARD_FAIL_SCORE_FLOOR = 40;
/**
 * answer_obviousness is inverted (higher is worse), so its gate is the
 * mirror of HARD_FAIL_SCORE_FLOOR rather than an independently-chosen
 * number: failing "below 40" on a direct scale is equivalent to failing
 * "above 60" on an inverted one (100 - 40 = 60). One constant, two readings,
 * so the two thresholds can never drift apart from each other by accident.
 */
const HARD_FAIL_OBVIOUSNESS_CEILING = 100 - HARD_FAIL_SCORE_FLOOR;

export interface CritiqueResult {
  pmp_alignment: number;
  answer_defensibility: number;
  distractor_quality: number;
  ambiguity_risk: number;
  scenario_realism: number;
  grammar_quality: number;
  /** Inverted like ambiguity_risk: 0 = correct answer blends in, 100 = it obviously stands out. */
  answer_obviousness: number;
  /** Higher = answering correctly requires genuine PMI-style judgment, not common sense alone. */
  pmi_decision_depth: number;
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
  /** Standard/graphic_based options only - empty for matching/drag_and_drop (option_balance/option_parallelism don't apply, scored neutral). */
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

/** Coordinating conjunctions joining separate actions/clauses - a correct answer built from "do X and also do Y" while every distractor names one action is a classic MCQ tell (this is exactly what happened in AIQ000003: "negotiate...and explore alternative suppliers"). */
function countActionConjunctions(text: string): number {
  return (text.match(/\b(and|or)\b/gi) ?? []).length;
}

/**
 * Structural complement to computeOptionBalance: where option_balance
 * measures raw character-length symmetry, option_parallelism measures (a)
 * word-count parity - a coarser, jargon-resistant proxy for comparable
 * specificity/depth - and (b) whether the correct answer combines
 * meaningfully more actions (via "and"/"or") than the distractors average,
 * independent of how long the resulting text happens to be. Scored 100
 * (neutral) when there are fewer than 2 options to compare.
 */
function computeOptionParallelism(options: RawGeneratedOption[]): number {
  if (options.length < 2) return 100;

  const wordCounts = options.map((o) => o.option_text_en.trim().split(/\s+/).filter(Boolean).length);
  const meanWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  let wordScore = 100;
  if (meanWords > 0) {
    const variance = wordCounts.reduce((sum, w) => sum + (w - meanWords) ** 2, 0) / wordCounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / meanWords;
    wordScore = Math.max(0, 100 - coefficientOfVariation * (100 / 0.6));
  }

  const correct = options.find((o) => o.is_correct);
  const incorrect = options.filter((o) => !o.is_correct);
  let conjunctionScore = 100;
  if (correct && incorrect.length > 0) {
    const correctConjunctions = countActionConjunctions(correct.option_text_en);
    const incorrectMeanConjunctions = incorrect.reduce((sum, o) => sum + countActionConjunctions(o.option_text_en), 0) / incorrect.length;
    if (correctConjunctions > incorrectMeanConjunctions + 1) {
      conjunctionScore = Math.max(0, 100 - (correctConjunctions - incorrectMeanConjunctions) * 30);
    }
  }

  return Math.round(wordScore * 0.6 + conjunctionScore * 0.4);
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
  const optionParallelism = computeOptionParallelism(input.options);
  const explanationQuality = computeExplanationQuality(input.explanationExtras);

  const flags: string[] = [...similarity.flags];
  const hardFailures: string[] = [...schema.hardFailures, ...similarity.hardFailures];

  // Critical gate: these five dimensions are what separates a genuinely
  // exam-worthy question from one that merely LOOKS polished (good grammar/
  // translation/metadata cannot compensate for a weak assessment - see
  // WEIGHTS' header comment for the incident this codifies). Any one of
  // them failing its floor is an independent hard failure, not just a
  // weighted-average drag.
  if (input.critique.answer_defensibility < HARD_FAIL_SCORE_FLOOR) {
    hardFailures.push(`answer_defensibility (${input.critique.answer_defensibility}) below minimum threshold (${HARD_FAIL_SCORE_FLOOR})`);
  }
  if (input.critique.pmp_alignment < HARD_FAIL_SCORE_FLOOR) {
    hardFailures.push(`pmp_alignment (${input.critique.pmp_alignment}) below minimum threshold (${HARD_FAIL_SCORE_FLOOR})`);
  }
  if (input.critique.distractor_quality < HARD_FAIL_SCORE_FLOOR) {
    hardFailures.push(`distractor_quality (${input.critique.distractor_quality}) below minimum threshold (${HARD_FAIL_SCORE_FLOOR}) - distractors are too weak/implausible`);
  }
  if (input.critique.pmi_decision_depth < HARD_FAIL_SCORE_FLOOR) {
    hardFailures.push(`pmi_decision_depth (${input.critique.pmi_decision_depth}) below minimum threshold (${HARD_FAIL_SCORE_FLOOR}) - answerable with common sense, not PMI-specific reasoning`);
  }
  if (input.critique.answer_obviousness > HARD_FAIL_OBVIOUSNESS_CEILING) {
    hardFailures.push(`answer_obviousness (${input.critique.answer_obviousness}) above maximum threshold (${HARD_FAIL_OBVIOUSNESS_CEILING}) - correct answer stands out without requiring PMP knowledge`);
  }

  if (input.critique.distractor_quality < 70) flags.push("distractor_quality below 70 - review distractors closely");
  if (input.critique.ambiguity_risk > 30) flags.push("ambiguity_risk above 30 - question wording may be unclear");
  if (input.translationReview.translation_quality < 70) flags.push("translation_quality below 70 - review Arabic content");
  if (input.metadataReview.metadata_consistency < 70) flags.push("metadata_consistency below 70 - declared metadata may not match content");
  if (input.critique.scenario_realism < 60) flags.push("scenario_realism below 60 - scenario or its constraints may feel contrived/unrealistic");
  if (input.critique.grammar_quality < 70) flags.push("grammar_quality below 70 - review English prose");
  if (optionBalance < 60) flags.push("option_balance below 60 - option lengths may telegraph the correct answer");
  if (optionParallelism < 60) flags.push("option_parallelism below 60 - options differ in structure/specificity in a way that may telegraph the correct answer");
  if (explanationQuality < 75) flags.push("explanation_quality below 75 - teaching content (key concept/exam tip/common trap) may be thin");
  if (input.critique.answer_obviousness > 45) flags.push("answer_obviousness above 45 - correct answer may stand out for non-PMP reasons");
  if (input.critique.pmi_decision_depth < 70) flags.push("pmi_decision_depth below 70 - question may not require genuine PMI-style reasoning");

  const clarity = 100 - input.critique.ambiguity_risk;
  const answerSubtlety = 100 - input.critique.answer_obviousness;

  const overall =
    input.critique.pmp_alignment * WEIGHTS.pmp_alignment +
    input.critique.answer_defensibility * WEIGHTS.answer_defensibility +
    input.critique.distractor_quality * WEIGHTS.distractor_quality +
    answerSubtlety * WEIGHTS.answer_obviousness +
    input.critique.pmi_decision_depth * WEIGHTS.pmi_decision_depth +
    schema.score * WEIGHTS.schema_validity +
    input.critique.scenario_realism * WEIGHTS.scenario_realism +
    scenarioOriginality * WEIGHTS.scenario_originality +
    similarity.score * WEIGHTS.similarity_safety +
    input.translationReview.translation_quality * WEIGHTS.translation_quality +
    input.metadataReview.metadata_consistency * WEIGHTS.metadata_consistency +
    input.critique.grammar_quality * WEIGHTS.grammar_quality +
    optionBalance * WEIGHTS.option_balance +
    optionParallelism * WEIGHTS.option_parallelism +
    explanationQuality * WEIGHTS.explanation_quality +
    clarity * WEIGHTS.clarity;

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
    answer_obviousness: input.critique.answer_obviousness,
    pmi_decision_depth: input.critique.pmi_decision_depth,
    option_parallelism: optionParallelism,
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

/**
 * Sentinel used when an attempt failed BEFORE quality scoring ever ran
 * (pattern extraction, generation, critique, or similarity checks all
 * throwing before a draft exists to score) - see PipelineFailureStage.
 * Every numeric field is 0 and hard_failures carries the real reason, so
 * this can never be mistaken for a real (if poor) score: nothing computed
 * these zeros from actual content, they mean "not scored, pipeline failed
 * first."
 */
export function pipelineFailureQualityScores(reason: string): QualityScores {
  return {
    schema_validity: 0,
    pmp_alignment: 0,
    answer_defensibility: 0,
    distractor_quality: 0,
    scenario_originality: 0,
    similarity_safety: 0,
    translation_quality: 0,
    metadata_consistency: 0,
    ambiguity_risk: 0,
    scenario_realism: 0,
    grammar_quality: 0,
    option_balance: 0,
    explanation_quality: 0,
    answer_obviousness: 0,
    pmi_decision_depth: 0,
    option_parallelism: 0,
    overall: 0,
    flags: [],
    hard_failures: [reason],
    reviewer_recommendations: [],
  };
}
