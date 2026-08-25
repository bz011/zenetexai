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
  answer_obviousness: 15,
  pmi_decision_depth: 85,
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
      "answer_obviousness",
      "pmi_decision_depth",
      "option_parallelism",
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

describe("assessment-critical dimensions (Sprint 8.2 - AIQ000003 calibration incident)", () => {
  // AIQ000003 scored 88.56/100 despite human review finding the distractors
  // too weak and the correct answer too obvious - the pipeline never
  // measured either. These tests reproduce both failure modes and confirm
  // the rebalanced weights + critical gate now catch them.

  it("1. hard-fails a question with one strong correct answer and three obviously weak distractors (low distractor_quality)", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: { ...goodCritique, distractor_quality: 30 },
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(hasHardFailure(scores)).toBe(true);
    expect(scores.hard_failures.some((f) => f.includes("distractor_quality"))).toBe(true);
  });

  it("2. penalizes option_parallelism when the correct answer combines multiple actions ('X and Y') while every distractor names only one action", () => {
    // Mirrors AIQ000003's actual pattern: "Negotiate with the supplier to
    // resume production and explore alternative suppliers." vs single-action distractors.
    const aiq000003StyleOptions: RawGeneratedOption[] = [
      { option_key: "A", option_text_en: "Escalate the issue to the project sponsor.", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
      {
        option_key: "B",
        option_text_en: "Negotiate with the supplier to resume production and explore alternative suppliers.",
        option_text_ar: "",
        is_correct: true,
        feedback_en: "",
        feedback_ar: "",
      },
      { option_key: "C", option_text_en: "Wait for the strike to end.", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
      { option_key: "D", option_text_en: "Cancel the affected work package.", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
    ];
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: aiq000003StyleOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(scores.option_parallelism).toBeLessThan(70);
  });

  it("3. scores four plausible, parallel (comparable length/structure, single-action) options better than the combined-action case", () => {
    const parallelOptions: RawGeneratedOption[] = [
      { option_key: "A", option_text_en: "Escalate the supply disruption to the project sponsor.", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
      { option_key: "B", option_text_en: "Negotiate revised delivery terms with the current supplier.", option_text_ar: "", is_correct: true, feedback_en: "", feedback_ar: "" },
      { option_key: "C", option_text_en: "Postpone the affected work package until supply resumes.", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
      { option_key: "D", option_text_en: "Reassign the procurement task to another team member.", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
    ];
    const combinedActionOptions: RawGeneratedOption[] = [
      { option_key: "A", option_text_en: "Escalate the issue to the project sponsor.", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
      {
        option_key: "B",
        option_text_en: "Negotiate with the supplier to resume production and explore alternative suppliers.",
        option_text_ar: "",
        is_correct: true,
        feedback_en: "",
        feedback_ar: "",
      },
      { option_key: "C", option_text_en: "Wait for the strike to end.", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
      { option_key: "D", option_text_en: "Cancel the affected work package.", option_text_ar: "", is_correct: false, feedback_en: "", feedback_ar: "" },
    ];

    const parallelScores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: parallelOptions,
      explanationExtras: goodExplanationExtras,
    });
    const combinedActionScores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: combinedActionOptions,
      explanationExtras: goodExplanationExtras,
    });

    expect(parallelScores.option_parallelism).toBeGreaterThan(combinedActionScores.option_parallelism);
    expect(parallelScores.option_parallelism).toBeGreaterThanOrEqual(90);
  });

  it("4. good grammar/translation/metadata cannot compensate for poor assessment quality (weak distractors + obvious answer + shallow reasoning)", () => {
    const weakAssessmentButPolished = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: {
        ...goodCritique,
        grammar_quality: 98,
        distractor_quality: 35,
        answer_obviousness: 80,
        pmi_decision_depth: 25,
      },
      translationReview: { translation_quality: 99, issues_found: [] },
      metadataReview: { metadata_consistency: 99, mismatches: [] },
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    const genuinelyGood = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });

    // The weighted "overall" is diagnostic only once hard_failures is
    // non-empty (generatePipeline.ts gates on hasHardFailure, not on the
    // number) - so the real claim under test is that excellent secondary
    // dimensions (grammar/translation/metadata, all ~98-99) cannot rescue
    // hasHardFailure=true, and still leave the score meaningfully below a
    // genuinely good draft, not that "overall" collapses to some arbitrary
    // absolute floor.
    expect(hasHardFailure(weakAssessmentButPolished)).toBe(true);
    expect(weakAssessmentButPolished.overall).toBeLessThan(genuinelyGood.overall);
    expect(genuinelyGood.overall - weakAssessmentButPolished.overall).toBeGreaterThan(10);
  });

  it("5. a question requiring genuine PMI reasoning (high pmi_decision_depth) scores better than an otherwise-identical common-sense-only question", () => {
    const commonSenseOnly = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: { ...goodCritique, pmi_decision_depth: 25 },
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    const genuinePmiReasoning = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: { ...goodCritique, pmi_decision_depth: 90 },
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });

    expect(genuinePmiReasoning.overall).toBeGreaterThan(commonSenseOnly.overall);
  });

  it("hard-fails when answer_obviousness exceeds its ceiling (correct answer stands out without requiring PMP knowledge)", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: { ...goodCritique, answer_obviousness: 75 },
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(hasHardFailure(scores)).toBe(true);
    expect(scores.hard_failures.some((f) => f.includes("answer_obviousness"))).toBe(true);
  });

  it("hard-fails when pmi_decision_depth drops below the floor (answerable with common sense alone)", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: { ...goodCritique, pmi_decision_depth: 20 },
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(hasHardFailure(scores)).toBe(true);
    expect(scores.hard_failures.some((f) => f.includes("pmi_decision_depth"))).toBe(true);
  });

  it("scores option_parallelism as neutral (100) when there are fewer than 2 options (matching/drag_and_drop)", () => {
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
    expect(scores.option_parallelism).toBe(100);
  });
});

describe("diversity dimensions (Sprint 8.3 - pilot pattern-collapse incident)", () => {
  // AIQ000015 measured 81.1%/80.8%/80.0% semantic similarity against three
  // different questions, all below the 0.85 warning bar (classified
  // "none"), leaving similarity_safety at 100 and scenario_originality
  // (19-26) barely denting an ~84 overall. These tests reproduce that shape
  // and confirm the graduated scoring + reweighting now catches it.

  function semanticMatch(score: number, matchedQuestionId: string, thresholdResult: SimilarityMatch["thresholdResult"] = "none"): SimilarityMatch {
    return { comparisonType: "semantic", matchedQuestionId, similarityScore: score, thresholdResult };
  }

  it("6. high semantic similarity (elevated zone, below the warning bar) reduces similarity_safety instead of leaving it at 100", () => {
    const clean = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    const elevatedSimilarity = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [semanticMatch(0.811, "AIQ000010")],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(elevatedSimilarity.similarity_safety).toBeLessThan(100);
    expect(elevatedSimilarity.similarity_safety).toBeLessThan(clean.similarity_safety);
    expect(elevatedSimilarity.flags.some((f) => f.includes("elevated range"))).toBe(true);
  });

  it("does not auto-declare ~80% semantic similarity a duplicate - no hard failure from the elevated zone alone", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [semanticMatch(0.8, "AIQ000003")],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(hasHardFailure(scores)).toBe(false);
  });

  it("reproduces AIQ000015 exactly: three separate ~80% semantic matches apply an additional multi-match penalty beyond any single match", () => {
    const singleMatch = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [semanticMatch(0.811, "AIQ000010")],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    const threeMatches = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [semanticMatch(0.811, "AIQ000010"), semanticMatch(0.8076, "AIQ000013"), semanticMatch(0.8005, "AIQ000003")],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(threeMatches.similarity_safety).toBeLessThan(singleMatch.similarity_safety);
    expect(threeMatches.flags.some((f) => f.includes("simultaneously elevated"))).toBe(true);
  });

  it("7. missing semantic comparison (no embedded candidates existed yet) cannot silently produce similarity_safety=100 with no signal at all", () => {
    const noCandidates = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
      semanticComparisonHadCandidates: false,
    });
    expect(noCandidates.similarity_safety).toBe(100); // the number is still honest (nothing similar WAS found)...
    expect(noCandidates.flags.some((f) => f.includes("had no existing embedded questions"))).toBe(true); // ...but it's never silent
  });

  it("checked-and-clean (candidates existed, none were similar) does NOT raise the same flag as never-checked", () => {
    const checkedClean = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [semanticMatch(0.1, "AIQ000001")],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
      semanticComparisonHadCandidates: true,
    });
    expect(checkedClean.flags.some((f) => f.includes("had no existing embedded questions"))).toBe(false);
  });

  it("scenario_originality direction is higher=more original, matching AIQ000015's real numbers (originality ~19 from a ~0.81 max similarity)", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [semanticMatch(0.811, "AIQ000010")],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(scores.scenario_originality).toBeCloseTo(19, 0);
  });

  it("8. low scenario_originality cannot silently coexist with an excellent overall score without a strong warning flag", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [semanticMatch(0.81, "AIQ000010")],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(scores.scenario_originality).toBeLessThan(25);
    expect(scores.flags.some((f) => f.includes("scenario_originality critically low"))).toBe(true);
  });

  it("low scenario_originality alone (no similarity warning/hard-reject) still measurably reduces overall given its increased weight", () => {
    const original = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    const nearDuplicate = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [semanticMatch(0.81, "AIQ000010")],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(original.overall - nearDuplicate.overall).toBeGreaterThan(3);
  });

  it("9. Predictive (or any) metadata requires evidence - metadata_consistency below the shared hard-fail floor rejects the draft", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: { metadata_consistency: 25, mismatches: ["approach: no Predictive-specific evidence in the scenario"] },
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(hasHardFailure(scores)).toBe(true);
    expect(scores.hard_failures.some((f) => f.includes("metadata_consistency"))).toBe(true);
  });

  it("a moderate metadata_consistency dip (e.g. 60, the pilot's actual observed range) does not hard-fail but is flagged and materially reduces overall", () => {
    const scores = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: { metadata_consistency: 60, mismatches: ["approach"] },
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    const genuinelyGood = computeQualityScores({
      validatorIssues: [],
      interactionType: "standard",
      critique: goodCritique,
      translationReview: goodTranslation,
      metadataReview: goodMetadata,
      similarityMatches: [],
      options: goodOptions,
      explanationExtras: goodExplanationExtras,
    });
    expect(hasHardFailure(scores)).toBe(false);
    expect(scores.flags.some((f) => f.includes("metadata_consistency below 70"))).toBe(true);
    expect(scores.overall).toBeLessThan(genuinelyGood.overall);
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
