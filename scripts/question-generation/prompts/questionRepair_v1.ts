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
hotspot coordinates.

Distractors must each represent a SPECIFIC common PMP mistake (acting
before assessing, escalating too early, unilateral decisions, ignoring
stakeholder collaboration, confusing risk responses, treating symptoms
instead of root cause, reactive instead of proactive) - never obviously
passive, irrelevant, or eliminable by common sense alone. The correct
answer must NOT be identifiable by being longer, combining multiple actions
while distractors name only one, or sounding more professional than the
distractors - all options must be comparable in length, specificity, and
structure. In regulated domains (pharmaceutical, banking, healthcare,
government, etc.), the correct answer must respect real-world constraints
(qualification, regulatory, quality, procurement) that would materially
affect the decision.`;

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
