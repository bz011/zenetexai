import { describe, it, expect } from "vitest";
import { computeQualityScores, hasHardFailure, type CritiqueResult, type TranslationReviewResult, type MetadataReviewResult } from "./qualityGate";
import type { ValidationIssue } from "../question-bank/types";
import type { SimilarityMatch } from "./types";

const goodCritique: CritiqueResult = {
  pmp_alignment: 90,
  answer_defensibility: 85,
  distractor_quality: 80,
  ambiguity_risk: 10,
  reasoning: "Solid",
  reviewer_recommendations: [],
};
const goodTranslation: TranslationReviewResult = { translation_quality: 95, issues_found: [] };
const goodMetadata: MetadataReviewResult = { metadata_consistency: 95, mismatches: [] };

describe("computeQualityScores", () => {
  it("produces no hard failures for a clean standard-question draft with no validator errors", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
    });
    expect(scores.hard_failures).toEqual([]);
    expect(hasHardFailure(scores)).toBe(false);
    expect(scores.overall).toBeGreaterThan(80);
  });

  it("does not treat GRAPHIC_MISSING_IMAGE as a hard failure for graphic_based drafts", () => {
    const issues: ValidationIssue[] = [{ severity: "error", code: "GRAPHIC_MISSING_IMAGE", message: "no image yet", sheet: "questions" }];
    const scores = computeQualityScores({
      validatorIssues: issues,
      interactionType: "graphic_based",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
    });
    expect(scores.schema_validity).toBe(100);
    expect(scores.hard_failures).toEqual([]);
  });

  it("still treats GRAPHIC_MISSING_IMAGE as a hard failure for a standard (non-pending-asset) question", () => {
    const issues: ValidationIssue[] = [{ severity: "error", code: "GRAPHIC_MISSING_IMAGE", message: "no image", sheet: "questions" }];
    const scores = computeQualityScores({
      validatorIssues: issues,
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
    });
    expect(hasHardFailure(scores)).toBe(true);
  });

  it("hard-rejects when a similarity match exceeds the hard_reject threshold", () => {
    const matches: SimilarityMatch[] = [{ comparisonType: "semantic", matchedQuestionId: "Q0001", similarityScore: 0.97, thresholdResult: "hard_reject" }];
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: matches,
    });
    expect(scores.similarity_safety).toBe(0);
    expect(hasHardFailure(scores)).toBe(true);
  });

  it("flags but does not hard-fail a warning-range similarity match", () => {
    const matches: SimilarityMatch[] = [{ comparisonType: "lexical", matchedQuestionId: "Q0002", similarityScore: 0.62, thresholdResult: "warning" }];
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: matches,
    });
    expect(scores.similarity_safety).toBe(70);
    expect(hasHardFailure(scores)).toBe(false);
    expect(scores.flags.some((f) => f.includes("warning range"))).toBe(true);
  });

  it("hard-fails when answer_defensibility or pmp_alignment drop below the floor", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: { ...goodCritique, answer_defensibility: 20 },
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
    });
    expect(hasHardFailure(scores)).toBe(true);
    expect(scores.hard_failures[0]).toContain("answer_defensibility");
  });

  it("inverts ambiguity_risk into a clarity contribution rather than penalizing it directly like the other components", () => {
    const clear = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: { ...goodCritique, ambiguity_risk: 0 },
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
    });
    const ambiguous = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: { ...goodCritique, ambiguity_risk: 40 },
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
    });
    expect(clear.overall).toBeGreaterThan(ambiguous.overall);
    expect(ambiguous.flags.some((f) => f.includes("ambiguity_risk"))).toBe(true);
  });

  it("never produces a single unexplained score - every component plus flags/hard_failures/recommendations are present", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
    });
    for (const key of [
      "schema_validity",
      "pmp_alignment",
      "answer_defensibility",
      "distractor_quality",
      "scenario_originality",
      "similarity_safety",
      "translation_quality",
      "metadata_consistency",
      "ambiguity_risk",
      "overall",
    ] as const) {
      expect(typeof scores[key]).toBe("number");
    }
    expect(Array.isArray(scores.flags)).toBe(true);
    expect(Array.isArray(scores.hard_failures)).toBe(true);
    expect(Array.isArray(scores.reviewer_recommendations)).toBe(true);
  });
});
