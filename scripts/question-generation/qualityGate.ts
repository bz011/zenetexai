import type { ValidationIssue } from "../question-bank/types";
import type { QualityScores, SimilarityMatch } from "./types";

/**
 * Weighted overall score. Documented and code-constant, not a black box -
 * same transparency precedent as the Sprint 3.5 validator's health score.
 * `ambiguity_risk` is the one component where LOWER is better; it
 * contributes via a derived "clarity" term (100 - ambiguity_risk).
 */
const WEIGHTS = {
  schema_validity: 0.18,
  pmp_alignment: 0.18,
  answer_defensibility: 0.14,
  distractor_quality: 0.14,
  scenario_originality: 0.1,
  similarity_safety: 0.1,
  translation_quality: 0.08,
  metadata_consistency: 0.05,
  clarity: 0.03,
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
