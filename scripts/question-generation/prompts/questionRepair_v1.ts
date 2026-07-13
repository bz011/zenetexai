import { QUESTION_REPAIR_SCHEMA } from "./schemas";
import type { RawGeneratedQuestion, PatternRow } from "../types";

/**
 * question_repair_v1
 *
 * Used by the admin "Request repair" action: takes the CURRENT draft plus
 * specific reviewer feedback and produces a revised draft. Used by
 * "Regenerate" too, with empty feedback (a fresh attempt from the same
 * pattern rather than a targeted fix).
 */
export const QUESTION_REPAIR_VERSION = "question_repair_v1";

export function buildRepairPrompt(
  currentDraft: RawGeneratedQuestion,
  pattern: PatternRow,
  reviewerFeedback: string | null
) {
  const systemPrompt = `You are revising a PMP exam question draft that a human reviewer flagged
issues with (or, if no specific feedback is given, producing a fresh
alternative attempt from the same underlying pattern). Follow the same
rules as original generation: materially different scenario from the
pattern's source, one defensible correct answer, realistic distractors,
no ambiguity, complete professional Arabic localization, and never invent
hotspot coordinates.`;

  const userPrompt = `PATTERN this question is based on:
- Scenario structure: ${pattern.scenario_structure}
- Tested decision: ${pattern.tested_decision}
- Correct-answer principle: ${pattern.correct_answer_principle}
- Distractor strategies: ${pattern.distractor_strategies.join("; ")}

CURRENT DRAFT (needs revision):
${JSON.stringify(currentDraft, null, 2)}

${reviewerFeedback ? `REVIEWER FEEDBACK TO ADDRESS:\n${reviewerFeedback}` : "No specific feedback given - produce a fresh alternative attempt from the same pattern."}

Produce the revised question now.`;

  return {
    systemPrompt,
    userPrompt,
    schema: QUESTION_REPAIR_SCHEMA,
    schemaName: QUESTION_REPAIR_VERSION,
  };
}
