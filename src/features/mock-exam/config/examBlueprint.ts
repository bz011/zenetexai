/**
 * Versioned PMP Mock Exam blueprints (Sprint 9).
 *
 * ONE file, as required - every domain/approach/difficulty/interaction-type
 * percentage, every duration/break number, lives here and nowhere else. Do
 * not scatter exam-blueprint percentages into services/components; import
 * from here.
 *
 * WHY TWO VERSIONS EXIST (do not delete PMP_EXAM_BLUEPRINT_2021): PMI
 * launched a materially different PMP Examination Content Outline on
 * 2026-07-09 (PMBOK 8th Edition-aligned) - domain weighting changed from
 * People 42% / Process 50% / Business Environment 8% to People 33% /
 * Process 41% / Business Environment 26%, and the approach mix shifted from
 * ~50/50 Predictive-vs-Adaptive to ~40/60. The pre-existing
 * DOMAIN_TARGETS/APPROACH_TARGETS/DIFFICULTY_TARGETS constants in
 * coverageIntelligenceService.ts (Sprint 8) encode the OLD (2021) ECO -
 * accurate for what they are, but silently reusing them for a NEW Mock Exam
 * blueprint would have encoded a superseded exam spec as if it were
 * current. PMP_EXAM_BLUEPRINT_2021 is kept, not deleted, so a historical
 * attempt's blueprint_snapshot always resolves against a real, inspectable
 * policy - see mock_exam_attempts.blueprint_version (migration 016).
 * getActiveBlueprint() returns PMP_EXAM_BLUEPRINT_2026 for all new attempts.
 *
 * SOURCING, verified via web search 2026-08 (PMI's own site blocks direct
 * fetch; cross-confirmed across 6+ independent sources including one
 * explicitly PMI-sourced - see Sprint 9's architecture report for the full
 * citation list):
 *   - domainWeights: OFFICIAL PMI ECO figures for both versions.
 *   - approachWeights: PMI publishes only the Predictive-vs-combined-
 *     Adaptive split (50/50 for 2021, ~40/60 for 2026); the internal
 *     Agile-vs-Hybrid split within "Adaptive" is NOT PMI-published - this
 *     file splits it evenly as an explicit ZentexAI assumption.
 *   - difficultyWeights: PMI has never published a difficulty distribution
 *     for any ECO version. Explicitly a ZentexAI simulation policy,
 *     identical across both blueprint versions since it isn't tied to the
 *     ECO at all - inventory-adjusted against the current ~494-question
 *     approved bank (see this file's own comments below for why Expert is
 *     targeted near-zero).
 *   - interactionTypeWeights / answerTypeWeights: bank-inventory-driven
 *     ZentexAI policy, not ECO-tied. "matching" is 0% because the approved
 *     bank currently contains ZERO matching-type questions - update this
 *     the day that changes, not before.
 *   - duration/breaks: PMI-published for both versions (2021: 230 min;
 *     2026: 240 min - this matches the Sprint 9 brief's stated 240 minutes
 *     exactly). Both: 3 sections of 60 questions, two 10-minute breaks
 *     after Q60 and Q120.
 *   - scoredQuestionCount: the 2026 ECO mixes 10 unscored pretest questions
 *     into the 180 (indistinguishable to the candidate) - 170 actually
 *     count. This platform has NO infrastructure to mark a question as
 *     "unscored pretest" (no such column/flag exists anywhere in the
 *     schema), so ZentexAI Mock Exams score all 180 selected questions
 *     regardless of blueprint version. scoredQuestionCount is recorded here
 *     as informational/documentary only - it does not change how
 *     examGradingService.ts computes a score. This is a deliberate,
 *     documented simplification, not a silent omission.
 */

export type PmpDomain = "People" | "Process" | "Business Environment";
export type PmpApproach = "Predictive" | "Agile" | "Hybrid" | "Mixed";
export type PmpDifficulty = "Easy" | "Moderate" | "Difficult" | "Expert";
export type PmpInteractionType = "standard" | "graphic_based" | "drag_and_drop" | "hotspot" | "matching";
export type PmpAnswerType = "single" | "multiple_response";

export type WeightSource = "official-pmi" | "zentexai-approximation" | "zentexai-policy";

export interface ExamBreak {
  /** 1-indexed: this break occurs immediately after this many questions have been completed. */
  afterQuestion: number;
  durationSeconds: number;
}

export interface ExamSection {
  sectionNumber: number;
  questionCount: number;
}

export interface ExamBlueprint {
  version: string;
  status: "current" | "superseded";
  effectiveDate: string;
  supersededDate: string | null;
  ecoSource: string;

  totalQuestions: number;
  /** Documentary only - see header comment. Does not change grading. */
  scoredQuestionCount: number;
  durationSeconds: number;
  sections: ExamSection[];
  breaks: ExamBreak[];

  domainWeights: Record<PmpDomain, number>;
  domainWeightsSource: WeightSource;

  /** Mixed is intentionally absent as a target - it's a ZentexAI/bank-only bucket with no PMI equivalent, usable as fallback filler only (see blueprintEngine.ts). */
  approachWeights: Record<Exclude<PmpApproach, "Mixed">, number>;
  approachWeightsSource: WeightSource;

  difficultyWeights: Record<PmpDifficulty, number>;
  difficultyWeightsSource: WeightSource;

  interactionTypeWeights: Record<PmpInteractionType, number>;
  interactionTypeWeightsSource: WeightSource;

  answerTypeWeights: Record<PmpAnswerType, number>;
  answerTypeWeightsSource: WeightSource;

  notes: string[];
}

/**
 * Difficulty policy shared by both blueprint versions - PMI does not
 * publish a difficulty distribution for any ECO, so this is never tied to
 * a specific version. Expert is targeted at 1% (effectively "opportunistic,
 * never required") because the approved bank currently contains exactly 1
 * Expert-difficulty question total - targeting anything higher would
 * guarantee the inventory fallback engine fires on every single exam.
 * Revisit upward once the bank has meaningfully more Expert content.
 */
const SHARED_DIFFICULTY_WEIGHTS: Record<PmpDifficulty, number> = {
  Easy: 10,
  Moderate: 55,
  Difficult: 34,
  Expert: 1,
};

/**
 * Interaction-type and answer-type policy shared by both blueprint versions
 * - bank-inventory-driven, not ECO-tied. "matching" is 0% (zero exist);
 * drag_and_drop/hotspot are token percentages the fallback engine will cap
 * hard against real inventory (4 and 1 respectively, at time of writing)
 * regardless of what's requested here.
 */
const SHARED_INTERACTION_TYPE_WEIGHTS: Record<PmpInteractionType, number> = {
  standard: 87,
  graphic_based: 10,
  drag_and_drop: 2,
  hotspot: 1,
  matching: 0,
};

const SHARED_ANSWER_TYPE_WEIGHTS: Record<PmpAnswerType, number> = {
  single: 92,
  multiple_response: 8,
};

export const PMP_EXAM_BLUEPRINT_2021: ExamBlueprint = {
  version: "zentexai-pmp-eco-2021",
  status: "superseded",
  effectiveDate: "2021-01-02",
  supersededDate: "2026-07-09",
  ecoSource: "PMI PMP Examination Content Outline, effective January 2021",

  totalQuestions: 180,
  scoredQuestionCount: 180,
  durationSeconds: 230 * 60,
  sections: [
    { sectionNumber: 1, questionCount: 60 },
    { sectionNumber: 2, questionCount: 60 },
    { sectionNumber: 3, questionCount: 60 },
  ],
  breaks: [
    { afterQuestion: 60, durationSeconds: 10 * 60 },
    { afterQuestion: 120, durationSeconds: 10 * 60 },
  ],

  domainWeights: { People: 42, Process: 50, "Business Environment": 8 },
  domainWeightsSource: "official-pmi",

  approachWeights: { Predictive: 50, Agile: 25, Hybrid: 25 },
  approachWeightsSource: "zentexai-approximation",

  difficultyWeights: SHARED_DIFFICULTY_WEIGHTS,
  difficultyWeightsSource: "zentexai-policy",

  interactionTypeWeights: SHARED_INTERACTION_TYPE_WEIGHTS,
  interactionTypeWeightsSource: "zentexai-policy",

  answerTypeWeights: SHARED_ANSWER_TYPE_WEIGHTS,
  answerTypeWeightsSource: "zentexai-policy",

  notes: [
    "Superseded by zentexai-pmp-eco-2026 on 2026-07-09. Kept for historical/audit reference - never used as the default for new attempts.",
    "approachWeights is a ZentexAI interpretation of commonly-cited PMI guidance (~half Predictive, ~half Agile+Hybrid combined) - PMI never published an exact per-approach percentage for this ECO.",
    "difficultyWeights/interactionTypeWeights/answerTypeWeights are ZentexAI simulation policy, not PMI data - PMI publishes neither.",
  ],
};

export const PMP_EXAM_BLUEPRINT_2026: ExamBlueprint = {
  version: "zentexai-pmp-eco-2026",
  status: "current",
  effectiveDate: "2026-07-09",
  supersededDate: null,
  ecoSource: "PMI PMP Examination Content Outline, effective July 9, 2026 (PMBOK 8th Edition-aligned)",

  totalQuestions: 180,
  scoredQuestionCount: 170,
  durationSeconds: 240 * 60,
  sections: [
    { sectionNumber: 1, questionCount: 60 },
    { sectionNumber: 2, questionCount: 60 },
    { sectionNumber: 3, questionCount: 60 },
  ],
  breaks: [
    { afterQuestion: 60, durationSeconds: 10 * 60 },
    { afterQuestion: 120, durationSeconds: 10 * 60 },
  ],

  domainWeights: { People: 33, Process: 41, "Business Environment": 26 },
  domainWeightsSource: "official-pmi",

  approachWeights: { Predictive: 40, Agile: 30, Hybrid: 30 },
  approachWeightsSource: "zentexai-approximation",

  difficultyWeights: SHARED_DIFFICULTY_WEIGHTS,
  difficultyWeightsSource: "zentexai-policy",

  interactionTypeWeights: SHARED_INTERACTION_TYPE_WEIGHTS,
  interactionTypeWeightsSource: "zentexai-policy",

  answerTypeWeights: SHARED_ANSWER_TYPE_WEIGHTS,
  answerTypeWeightsSource: "zentexai-policy",

  notes: [
    "domainWeights changed materially from the 2021 ECO: People 42%->33%, Process 50%->41%, Business Environment 8%->26% - do not assume the 2021 figures still apply.",
    "approachWeights: PMI publishes Predictive ~40% vs combined Agile+Hybrid ('Adaptive') ~60% - the 30/30 internal Agile/Hybrid split is a ZentexAI assumption, not independently PMI-published.",
    "scoredQuestionCount (170) is documentary only - see this file's header comment. ZentexAI scores all 180 selected questions; there is no unscored-pretest-item infrastructure in this schema.",
    "difficultyWeights/interactionTypeWeights/answerTypeWeights are ZentexAI simulation policy, not PMI data - identical to the 2021 blueprint since neither is tied to the ECO.",
  ],
};

export const ALL_EXAM_BLUEPRINTS: ExamBlueprint[] = [PMP_EXAM_BLUEPRINT_2021, PMP_EXAM_BLUEPRINT_2026];

/** The blueprint used for every new Mock Exam attempt. */
export function getActiveBlueprint(): ExamBlueprint {
  return PMP_EXAM_BLUEPRINT_2026;
}

export function getBlueprintByVersion(version: string): ExamBlueprint | null {
  return ALL_EXAM_BLUEPRINTS.find((b) => b.version === version) ?? null;
}
