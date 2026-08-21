import { describe, it, expect } from "vitest";
import {
  computeQualityScores,
  hasHardFailure,
  pipelineFailureQualityScores,
  type CritiqueResult,
  type TranslationReviewResult,
  type MetadataReviewResult,
} from "./qualityGate";
import type { ValidationIssue } from "../question-bank/types";
import type { SimilarityMatch, RawGeneratedOption, RawExplanationExtras } from "./types";

const goodCritique: CritiqueResult = {
  pmp_alignment: 90,
  answer_defensibility: 85,
  distractor_quality: 80,
  ambiguity_risk: 10,
  scenario_realism: 88,
  grammar_quality: 92,
  reasoning: "Solid",
  reviewer_recommendations: [],
};
const goodTranslation: TranslationReviewResult = { translation_quality: 95, issues_found: [] };
const goodMetadata: MetadataReviewResult = { metadata_consistency: 95, mismatches: [] };

const goodOptions: RawGeneratedOption[] = [
  { option_key: "A", option_text_en: "Escalate the risk immediately", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
  { option_key: "B", option_text_en: "Update the risk register first", option_text_ar: "", is_correct: true, feedback_en: "", feedback_ar: "" },
  { option_key: "C", option_text_en: "Ignore the new risk for now", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
  { option_key: "D", option_text_en: "Consult the project sponsor", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
];

const goodExplanationExtras: RawExplanationExtras = {
  key_concept_en: "Risk register maintenance", key_concept_ar: "صيانة سجل المخاطر",
  exam_tip_en: "Always update records before escalating anything.", exam_tip_ar: "قم دائماً بتحديث السجلات قبل أي تصعيد.",
  common_trap_en: "Assuming escalation is always the first correct step.", common_trap_ar: "افتراض أن التصعيد هو دائماً الخطوة الأولى الصحيحة.",
  related_concepts_en: ["Risk identification", "Issue log"], related_concepts_ar: ["تحديد المخاطر", "سجل المشكلات"],
};

describe("computeQualityScores", () => {
  it("produces no hard failures for a clean standard-question draft with no validator errors", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
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
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
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
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
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
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
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
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
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
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
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
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    const ambiguous = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: { ...goodCritique, ambiguity_risk: 40 },
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
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
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
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
      "scenario_realism",
      "grammar_quality",
      "option_balance",
      "explanation_quality",
      "overall",
    ] as const) {
      expect(typeof scores[key]).toBe("number");
    }
    expect(Array.isArray(scores.flags)).toBe(true);
    expect(Array.isArray(scores.hard_failures)).toBe(true);
    expect(Array.isArray(scores.reviewer_recommendations)).toBe(true);
  });

  it("penalizes option_balance when the correct answer is conspicuously longer than the distractors", () => {
    const unbalancedOptions: RawGeneratedOption[] = [
      { option_key: "A", option_text_en: "No", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
      { option_key: "B", option_text_en: "Yes", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
      { option_key: "C", option_text_en: "Maybe", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
      {
        option_key: "D",
        option_text_en:
          "Update the risk register immediately, notify the sponsor, convene the change control board, and reassess the entire risk management plan for downstream impacts",
        option_text_ar: "",
        is_correct: true,
        feedback_en: "",
        feedback_ar: "",
      },
    ];
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: unbalancedOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(scores.option_balance).toBeLessThan(60);
    expect(scores.flags.some((f) => f.includes("option_balance"))).toBe(true);
  });

  it("scores option_balance as neutral (100) when there are fewer than 2 options (matching/drag_and_drop)", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "matching",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: [],
      explanationExtras: goodExplanationExtras,
    });
    expect(scores.option_balance).toBe(100);
  });

  it("scores explanation_quality low when the structured teaching content is empty", () => {
    const emptyExtras: RawExplanationExtras = {
      key_concept_en: "", key_concept_ar: "",
      exam_tip_en: "", exam_tip_ar: "",
      common_trap_en: "", common_trap_ar: "",
      related_concepts_en: [], related_concepts_ar: [],
    };
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: emptyExtras,
    });
    expect(scores.explanation_quality).toBe(0);
    expect(scores.flags.some((f) => f.includes("explanation_quality"))).toBe(true);
  });

  it("scores explanation_quality high when all structured teaching content is substantive", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(scores.explanation_quality).toBe(100);
  });
});

describe("pipelineFailureQualityScores", () => {
  it("returns a sentinel with every numeric dimension at 0 and the real reason in hard_failures", () => {
    const scores = pipelineFailureQualityScores("[pattern_extraction] No approved source questions found for slice");
    expect(scores.overall).toBe(0);
    expect(scores.schema_validity).toBe(0);
    expect(scores.pmp_alignment).toBe(0);
    expect(scores.hard_failures).toEqual(["[pattern_extraction] No approved source questions found for slice"]);
  });

  it("always reports a hard failure, so hasHardFailure never misses a pipeline-failure sentinel", () => {
    const scores = pipelineFailureQualityScores("[question_generation] some error");
    expect(hasHardFailure(scores)).toBe(true);
  });

  it("produces no flags or reviewer recommendations - nothing was actually scored", () => {
    const scores = pipelineFailureQualityScores("[similarity_check] embedding call failed");
    expect(scores.flags).toEqual([]);
    expect(scores.reviewer_recommendations).toEqual([]);
  });
});
