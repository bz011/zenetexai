import { QUESTION_GENERATION_SCHEMA } from "./schemas";
import type { PatternRow, GenerationTargetSlice } from "../types";

/**
 * question_generation_v1
 *
 * Generates a new question from an abstracted pattern - never from raw
 * source-question text. Style-only examples are approved questions from
 * the same domain, explicitly bounded to format/tone, never content.
 */
export const QUESTION_GENERATION_VERSION = "question_generation_v1";

export function buildQuestionGenerationPrompt(
  pattern: PatternRow,
  target: GenerationTargetSlice,
  styleExamples: string[]
) {
  const systemPrompt = `You are a senior PMP exam item writer following the PMP July 2026 ECO.

You will be given an ABSTRACTED reasoning pattern (never the original
question it came from) and must write a brand-new, original PMP-style
exam question that tests the SAME competency using a MATERIALLY DIFFERENT
scenario.

Mandatory rules:
- Use a different industry, different actors, different constraints, and
  different facts than anything implied by the pattern's provenance.
- Preserve only the reasoning competency (the decision/judgment being
  tested), never the surface scenario.
- Produce exactly ONE defensible best answer - no ambiguity about which
  option is correct.
- Distractors must be realistic mistakes a real practitioner could plausibly
  make, following the pattern's distractor strategies - never absurd or
  obviously wrong options, and never a second technically-correct answer.
- Avoid ambiguous wording, double negatives, or trick phrasing.
- Never directly copy or superficially paraphrase any specific sentence -
  the scenario must be recognizably NEW.
- Produce complete, professional Arabic localization for every English
  field - not a placeholder, not a literal machine translation that reads
  awkwardly.
- Follow the requested interaction_type/answer_type exactly:
  - "standard"/"graphic_based" + "single": exactly 4 options, exactly 1 is_correct=true.
  - "standard"/"graphic_based" + "multiple_response": 4-5 options, exactly 2 or more is_correct=true.
  - "matching": 3-5 left/right pairs, each pair conceptually distinct.
  - "drag_and_drop": 3-5 items with a correct_position sequence starting at 1 with no gaps.
  - Leave arrays empty ([]) for structures that don't apply to the requested type.
  - "graphic_based" additionally requires a non-null image_brief describing
    exactly what image would need to accompany this question - you are NOT
    generating the image itself, only the brief a human will use to source
    or create it.
  - hotspot_brief must be null unless the pattern's interaction_type is
    "hotspot", in which case describe the image and the target region in
    words only - never coordinates, never pixel positions.

Metadata requirements:
  - primary_tag: the single most representative tag for this question (a
    short phrase, e.g. "stakeholder-conflict" or "earned-value-management").
  - estimated_time_seconds: a realistic time a competent candidate would
    need (typically 60-150 for standard, more for matching/drag_and_drop).
  - bloom_level: the cognitive level this question actually tests (e.g.
    "Apply", "Analyze", "Evaluate") - must match cognitive_level's intent.
  - knowledge_area / process_group: the classic PMBOK Knowledge Area (e.g.
    "Risk Management") and Process Group (e.g. "Planning") this question
    maps to, if a clear one exists. Use null for either if the question
    doesn't map cleanly to the old PMBOK structure - never force a fit.
  - confidence: your own honest 0-100 confidence that this question is
    exam-ready as written. This is a self-assessment, separate from and
    should not be inflated to match whatever score you'd expect a reviewer
    to give it.

Explanation requirements - the explanation must TEACH, not just state an
answer:
  - explanation_en/ar: focused specifically on WHY the correct option is
    correct (the reasoning, not just restating it).
  - Each option's feedback_en/ar (in the options array): for the correct
    option, briefly confirm why; for EVERY incorrect option, explain
    SPECIFICALLY why that option is wrong or insufficient in this scenario
    - never a generic "this is incorrect", always tied to the scenario's
      actual facts.
  - explanation_extras.key_concept: the single PMP concept this question is
    really testing, named explicitly.
  - explanation_extras.exam_tip: one practical tip for how to approach this
    TYPE of question on the real exam.
  - explanation_extras.common_trap: the specific misreading or mental
    shortcut that leads candidates to a wrong answer here.
  - explanation_extras.related_concepts: 2-4 related PMP concepts worth
    knowing alongside this one.`;

  const userPrompt = `PATTERN (abstracted - do not ask what the original question was):
- Domain: ${pattern.domain ?? "unspecified"}
- Task: ${pattern.task ?? "unspecified"}
- Topic: ${pattern.topic ?? "unspecified"} / ${pattern.subtopic ?? "unspecified"}
- Approach: ${pattern.approach ?? "unspecified"}
- Difficulty: ${pattern.difficulty ?? "unspecified"}
- Cognitive level: ${pattern.cognitive_level ?? "unspecified"}
- Scenario structure: ${pattern.scenario_structure}
- Tested decision: ${pattern.tested_decision}
- Correct-answer principle: ${pattern.correct_answer_principle}
- Distractor strategies: ${pattern.distractor_strategies.join("; ")}
- Common misconception: ${pattern.common_misconception ?? "none noted"}
- Required PMI mindset: ${pattern.required_pmi_mindset ?? "none noted"}
- Additional guidance: ${pattern.generation_guidance ?? "none"}

TARGET FOR THIS QUESTION:
- interaction_type: ${target.interactionType}
- answer_type: ${target.answerType}
- domain: ${target.domain ?? pattern.domain ?? "unspecified"}
- difficulty: ${target.difficulty ?? pattern.difficulty ?? "unspecified"}

${
  styleExamples.length > 0
    ? `STYLE-ONLY CALIBRATION EXAMPLES (match tone/format ONLY - do not reuse any scenario, fact, or wording from these):\n${styleExamples
        .map((e, i) => `--- Style example ${i + 1} ---\n${e}`)
        .join("\n\n")}`
    : ""
}

Generate the new question now.`;

  return {
    systemPrompt,
    userPrompt,
    schema: QUESTION_GENERATION_SCHEMA,
    schemaName: QUESTION_GENERATION_VERSION,
  };
}
