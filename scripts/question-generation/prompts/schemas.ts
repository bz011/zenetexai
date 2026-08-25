/**
 * JSON Schemas passed to the LLM Service Layer's generateStructured() call.
 * Written for OpenAI's strict structured-output mode, which requires every
 * property to be listed in `required` (optional fields must be modeled as
 * nullable types, not actually optional) - hence the `["string","null"]`
 * unions and empty-array defaults described in each prompt template rather
 * than truly optional JSON keys.
 *
 * NOTE: this has not been run against a live OpenAI account in this
 * environment (no API key, no network access here). The shapes are
 * modeled carefully against OpenAI's documented strict-mode rules, but
 * flag this file for a real smoke test before trusting it in production.
 */

export const PATTERN_EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    scenario_structure: { type: "string" },
    tested_decision: { type: "string" },
    correct_answer_principle: { type: "string" },
    distractor_strategies: { type: "array", items: { type: "string" } },
    common_misconception: { type: ["string", "null"] },
    required_pmi_mindset: { type: ["string", "null"] },
    generation_guidance: { type: ["string", "null"] },
  },
  required: [
    "scenario_structure",
    "tested_decision",
    "correct_answer_principle",
    "distractor_strategies",
    "common_misconception",
    "required_pmi_mindset",
    "generation_guidance",
  ],
} as const;

const OPTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    option_key: { type: "string" },
    option_text_en: { type: "string" },
    option_text_ar: { type: "string" },
    is_correct: { type: "boolean" },
    feedback_en: { type: "string" },
    feedback_ar: { type: "string" },
  },
  required: ["option_key", "option_text_en", "option_text_ar", "is_correct", "feedback_en", "feedback_ar"],
};

const MATCHING_PAIR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    left_text_en: { type: "string" },
    left_text_ar: { type: "string" },
    right_text_en: { type: "string" },
    right_text_ar: { type: "string" },
  },
  required: ["left_text_en", "left_text_ar", "right_text_en", "right_text_ar"],
};

const DRAG_DROP_ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    item_text_en: { type: "string" },
    item_text_ar: { type: "string" },
    category: { type: "string" },
    correct_position: { type: "integer" },
  },
  required: ["item_text_en", "item_text_ar", "category", "correct_position"],
};

const HOTSPOT_BRIEF_SCHEMA = {
  type: ["object", "null"],
  additionalProperties: false,
  properties: {
    image_description: { type: "string" },
    target_description: { type: "string" },
  },
  required: ["image_description", "target_description"],
};

/**
 * Structured teaching content (Sprint 8 Phase 5) - beyond a single flat
 * explanation string. key_concept/exam_tip/common_trap/related_concepts,
 * each bilingual. Maps to questions.explanation_structured (migration 014).
 */
const EXPLANATION_EXTRAS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    key_concept_en: { type: "string" },
    key_concept_ar: { type: "string" },
    exam_tip_en: { type: "string" },
    exam_tip_ar: { type: "string" },
    common_trap_en: { type: "string" },
    common_trap_ar: { type: "string" },
    related_concepts_en: { type: "array", items: { type: "string" } },
    related_concepts_ar: { type: "array", items: { type: "string" } },
  },
  required: [
    "key_concept_en", "key_concept_ar",
    "exam_tip_en", "exam_tip_ar",
    "common_trap_en", "common_trap_ar",
    "related_concepts_en", "related_concepts_ar",
  ],
};

export const QUESTION_GENERATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    question_text_en: { type: "string" },
    question_text_ar: { type: "string" },
    explanation_en: { type: "string" },
    explanation_ar: { type: "string" },
    domain: { type: "string" },
    task: { type: "string" },
    topic: { type: "string" },
    subtopic: { type: "string" },
    approach: { type: "string" },
    difficulty: { type: "string" },
    cognitive_level: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    options: { type: "array", items: OPTION_SCHEMA },
    matching_pairs: { type: "array", items: MATCHING_PAIR_SCHEMA },
    drag_and_drop_items: { type: "array", items: DRAG_DROP_ITEM_SCHEMA },
    hotspot_brief: HOTSPOT_BRIEF_SCHEMA,
    image_brief: { type: ["string", "null"] },
    knowledge_area: { type: ["string", "null"] },
    process_group: { type: ["string", "null"] },
    primary_tag: { type: "string" },
    estimated_time_seconds: { type: "integer" },
    bloom_level: { type: "string" },
    confidence: { type: "number" },
    explanation_extras: EXPLANATION_EXTRAS_SCHEMA,
  },
  required: [
    "question_text_en",
    "question_text_ar",
    "explanation_en",
    "explanation_ar",
    "domain",
    "task",
    "topic",
    "subtopic",
    "approach",
    "difficulty",
    "cognitive_level",
    "tags",
    "options",
    "matching_pairs",
    "drag_and_drop_items",
    "hotspot_brief",
    "image_brief",
    "knowledge_area",
    "process_group",
    "primary_tag",
    "estimated_time_seconds",
    "bloom_level",
    "confidence",
    "explanation_extras",
  ],
} as const;

export const CRITIQUE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    pmp_alignment: { type: "number" },
    answer_defensibility: { type: "number" },
    distractor_quality: { type: "number" },
    ambiguity_risk: { type: "number" },
    scenario_realism: { type: "number" },
    grammar_quality: { type: "number" },
    answer_obviousness: { type: "number" },
    pmi_decision_depth: { type: "number" },
    reasoning: { type: "string" },
    reviewer_recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "pmp_alignment", "answer_defensibility", "distractor_quality", "ambiguity_risk",
    "scenario_realism", "grammar_quality", "answer_obviousness", "pmi_decision_depth",
    "reasoning", "reviewer_recommendations",
  ],
} as const;

export const TRANSLATION_REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    translation_quality: { type: "number" },
    issues_found: { type: "array", items: { type: "string" } },
  },
  required: ["translation_quality", "issues_found"],
} as const;

export const METADATA_CONSISTENCY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    metadata_consistency: { type: "number" },
    mismatches: { type: "array", items: { type: "string" } },
  },
  required: ["metadata_consistency", "mismatches"],
} as const;

export const QUESTION_REPAIR_SCHEMA = QUESTION_GENERATION_SCHEMA;
