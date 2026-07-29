import { CRITIQUE_SCHEMA } from "./schemas";
import type { RawGeneratedQuestion } from "../types";

/**
 * question_critique_v1
 *
 * A separate call, acting as an independent PMI-methodology reviewer. Sees
 * ONLY the generated draft - never the source pattern or source questions -
 * so its scoring isn't biased by having "written" the question itself.
 */
export const QUESTION_CRITIQUE_VERSION = "question_critique_v1";

export function buildCritiquePrompt(draft: RawGeneratedQuestion) {
  const systemPrompt = `You are an independent PMI methodology reviewer auditing a candidate PMP
exam question for a certification question bank. You did not write this
question. Score it honestly on a 0-100 scale for each dimension:

- pmp_alignment: does the tested decision and correct-answer principle
  genuinely reflect PMI/PMBOK methodology and the PMP July 2026 ECO?
- answer_defensibility: is there exactly one clearly correct, well-justified
  answer with no legitimate case for a different option?
- distractor_quality: are the wrong options realistic mistakes a
  practitioner could plausibly make, rather than obviously wrong or
  accidentally also defensible?
- ambiguity_risk: how ambiguous or confusingly worded is the question
  (0 = perfectly clear, 100 = highly ambiguous)? Note this scale is
  INVERTED relative to the others - higher is worse here.
- scenario_realism: would this scenario plausibly happen to a real project
  professional, with believable actors/constraints/facts - not generic or
  contrived filler around the "real" question?
- grammar_quality: is the English prose itself (question, options,
  explanation) grammatically correct, professionally worded, and free of
  awkward phrasing - independent of whether the PMP content is correct?

Be a harsh, skeptical reviewer. Do not inflate scores to be polite.`;

  const userPrompt = `Question (English): ${draft.question_text_en}
Options: ${JSON.stringify(draft.options)}
Matching pairs: ${JSON.stringify(draft.matching_pairs)}
Drag-and-drop items: ${JSON.stringify(draft.drag_and_drop_items)}
Explanation: ${draft.explanation_en}
Domain/Task/Topic: ${draft.domain} / ${draft.task} / ${draft.topic}

Score this question now.`;

  return {
    systemPrompt,
    userPrompt,
    schema: CRITIQUE_SCHEMA,
    schemaName: QUESTION_CRITIQUE_VERSION,
  };
}
