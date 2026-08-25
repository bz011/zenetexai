// ============================================================================
// Shared types for the AI Question Generation pipeline (Sprint 5)
// ============================================================================

export type SupportedInteractionType =
  | "standard"
  | "graphic_based"
  | "matching"
  | "drag_and_drop";
// hotspot is deliberately excluded from SupportedInteractionType - Sprint 5
// generates hotspot question TEXT/concept but never coordinates (see
// RawHotspotBrief below); it never reaches the normal per-type generator.

export interface GenerationTargetSlice {
  domain?: string;
  task?: string;
  topic?: string;
  subtopic?: string;
  approach?: string;
  difficulty?: string;
  interactionType: SupportedInteractionType | "hotspot";
  answerType: "single" | "multiple_response";
  count: number;
}

export interface BatchConfig {
  certificationCode: string;
  requestedCount: number;
  slices: GenerationTargetSlice[];
  selectedPatternIds?: string[];
  createdBy: string;
  dryRun?: boolean;
}

// ---------------------------------------------------------------------------
// DB row shapes (mirror migration 008 columns)
// ---------------------------------------------------------------------------

export interface PatternRow {
  id: string;
  certification_id: string;
  eco_version: string | null;
  domain: string | null;
  task: string | null;
  topic: string | null;
  subtopic: string | null;
  approach: string | null;
  difficulty: string | null;
  cognitive_level: string | null;
  interaction_type: string;
  answer_type: string;
  scenario_structure: string;
  tested_decision: string;
  correct_answer_principle: string;
  distractor_strategies: string[];
  common_misconception: string | null;
  required_pmi_mindset: string | null;
  generation_guidance: string | null;
  source_question_ids: string[];
  status: "active" | "archived";
  times_used: number;
  questions_generated: number;
  questions_approved: number;
  questions_rejected: number;
  avg_quality_score: number | null;
  created_by: string | null;
}

export interface BatchRow {
  id: string;
  certification_id: string;
  requested_count: number;
  requested_distribution: Record<string, unknown>;
  llm_provider: string;
  llm_model: string;
  status: "draft" | "running" | "partially_completed" | "completed" | "failed" | "cancelled";
  generated_count: number;
  passed_count: number;
  rejected_count: number;
  approved_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  error_message: string | null;
  created_by: string;
  started_at: string | null;
  completed_at: string | null;
}

// ---------------------------------------------------------------------------
// LLM raw output shape - what the generation prompt must produce
// ---------------------------------------------------------------------------

export interface RawGeneratedOption {
  option_key: string;
  option_text_en: string;
  option_text_ar: string;
  is_correct: boolean;
  feedback_en: string;
  feedback_ar: string;
}

export interface RawGeneratedMatchingPair {
  left_text_en: string;
  left_text_ar: string;
  right_text_en: string;
  right_text_ar: string;
}

export interface RawGeneratedDragDropItem {
  item_text_en: string;
  item_text_ar: string;
  category: string;
  correct_position: number;
}

export interface RawHotspotBrief {
  image_description: string;
  target_description: string;
}

/**
 * Structured teaching content beyond "why the correct answer is correct"
 * (explanation_en/ar below) and "why each wrong option is wrong" (each
 * option's own feedback_en/ar) - see questions.explanation_structured
 * (migration 014). Every field is bilingual and required (never optional -
 * a question without an exam tip or a named key concept isn't teaching
 * enough to ship).
 */
export interface RawExplanationExtras {
  key_concept_en: string;
  key_concept_ar: string;
  exam_tip_en: string;
  exam_tip_ar: string;
  common_trap_en: string;
  common_trap_ar: string;
  related_concepts_en: string[];
  related_concepts_ar: string[];
}

export interface RawGeneratedQuestion {
  question_text_en: string;
  question_text_ar: string;
  explanation_en: string;
  explanation_ar: string;
  domain: string;
  task: string;
  topic: string;
  subtopic: string;
  approach: string;
  difficulty: string;
  cognitive_level: string;
  tags: string[];
  options: RawGeneratedOption[];
  matching_pairs: RawGeneratedMatchingPair[];
  drag_and_drop_items: RawGeneratedDragDropItem[];
  hotspot_brief: RawHotspotBrief | null;
  image_brief: string | null;
  // Phase 4/5 additions (Sprint 8) - richer metadata + structured teaching content.
  knowledge_area: string | null;
  process_group: string | null;
  primary_tag: string;
  estimated_time_seconds: number;
  bloom_level: string;
  /** Self-reported model confidence (0-100) - distinct from the independently computed quality_score. */
  confidence: number;
  explanation_extras: RawExplanationExtras;
}

// ---------------------------------------------------------------------------
// Quality scoring
// ---------------------------------------------------------------------------

export interface QualityScores {
  schema_validity: number;
  pmp_alignment: number;
  answer_defensibility: number;
  distractor_quality: number;
  scenario_originality: number;
  similarity_safety: number;
  translation_quality: number;
  metadata_consistency: number;
  /** Inverted vs every other component: 0 = unambiguous (good), 100 = highly ambiguous (bad). */
  ambiguity_risk: number;
  /** LLM-scored (Sprint 8): would this scenario plausibly happen to a real practitioner? */
  scenario_realism: number;
  /** LLM-scored (Sprint 8): is the English prose itself grammatically clean? */
  grammar_quality: number;
  /** Deterministic (Sprint 8): option-length balance - penalizes a correct answer that's conspicuously longer/shorter than distractors. */
  option_balance: number;
  /** Deterministic (Sprint 8): completeness of the structured teaching content (key concept/exam tip/common trap/related concepts). */
  explanation_quality: number;
  /**
   * LLM-scored (Sprint 8.2, post-AIQ000003 calibration incident). Inverted
   * like ambiguity_risk: 0 = the correct answer blends in with the
   * distractors, 100 = it obviously stands out (length, tone, or combining
   * multiple actions while distractors name only one).
   */
  answer_obviousness: number;
  /** LLM-scored (Sprint 8.2): does answering correctly require genuine PMI-style judgment (e.g. Assess->Analyze->Collaborate->Act), or is it solvable with common sense alone? Higher = more genuine PMI reasoning required. */
  pmi_decision_depth: number;
  /** Deterministic (Sprint 8.2): word-count parity across options plus a check that the correct answer doesn't stitch together more actions (and/or conjunctions) than the distractors - a structural complement to option_balance's character-length check. */
  option_parallelism: number;
  overall: number;
  flags: string[];
  hard_failures: string[];
  reviewer_recommendations: string[];
}

export interface SimilarityMatch {
  comparisonType: "lexical" | "semantic" | "option_set" | "tag_set";
  matchedQuestionId?: string;
  matchedBatchQuestionId?: string;
  similarityScore: number;
  thresholdResult: "hard_reject" | "warning" | "none";
}

/**
 * Where a failed attempt died, for audit logging (Sprint 8.1 incident
 * follow-up - see generation_batch_questions.failure_stage, migration 015).
 * `null` on an accepted outcome. Every branch of generateOneQuestion that
 * can fail is tagged with exactly one of these - nothing should ever throw
 * out of generateOneQuestion uncategorized (the "unexpected_error" case
 * exists as a last-resort catch-all, not a normal outcome).
 */
export type PipelineFailureStage =
  | "pattern_extraction"
  | "question_generation"
  | "critique_review"
  | "similarity_check"
  | "quality_gate"
  | "database_insertion"
  | "unexpected_error";

export interface GenerationOutcome {
  accepted: boolean;
  questionId?: string;
  /** null when the attempt failed before a pattern was ever resolved (e.g. pattern_extraction itself failed). */
  patternId: string | null;
  rejectionReason?: string;
  failureStage?: PipelineFailureStage;
  qualityScores: QualityScores;
  similarityMatches: SimilarityMatch[];
  promptTokens: number;
  completionTokens: number;
}
