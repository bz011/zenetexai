import { PATTERN_EXTRACTION_SCHEMA } from "./schemas";

/**
 * pattern_extraction_v1
 *
 * Abstracts the reasoning/structure out of 1-3 source questions WITHOUT
 * reproducing their wording. The output becomes a question_patterns row;
 * it must never contain copyable text from the inputs.
 */
export const PATTERN_EXTRACTION_VERSION = "pattern_extraction_v1";

export function buildPatternExtractionPrompt(sourceQuestionTexts: string[]) {
  const systemPrompt = `You are a PMP exam content analyst. You will be shown one or more existing
PMP exam questions. Your task is to ABSTRACT the underlying reasoning
pattern they share - NOT to summarize or paraphrase their wording.

Strict rules:
- Never copy or closely paraphrase any sentence from the source questions.
- Describe the SCENARIO STRUCTURE in general terms (e.g. "a project manager
  discovers a quality gap during an unplanned inspection mid-execution"),
  not the specific facts, names, or industry used in the source.
- Describe the DECISION being tested, the PRINCIPLE behind the correct
  answer, the DISTRACTOR STRATEGIES used (as short labels, e.g. "addresses
  symptom not root cause"), the COMMON MISCONCEPTION being tested against,
  and the PMI MINDSET required (e.g. "servant leadership", "value-driven
  delivery").
- Output must be usable to generate a NEW question with different actors,
  industry, and facts while testing the exact same competency.`;

  const userPrompt = `Source question(s) to abstract (for internal analysis only - do not quote
or closely paraphrase any of this in your output):

${sourceQuestionTexts.map((t, i) => `--- Source ${i + 1} ---\n${t}`).join("\n\n")}

Produce the abstracted pattern now.`;

  return {
    systemPrompt,
    userPrompt,
    schema: PATTERN_EXTRACTION_SCHEMA,
    schemaName: PATTERN_EXTRACTION_VERSION,
  };
}
