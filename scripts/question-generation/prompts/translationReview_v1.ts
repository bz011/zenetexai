import { TRANSLATION_REVIEW_SCHEMA } from "./schemas";
import type { RawGeneratedQuestion } from "../types";

/** translation_review_v1 - scores the Arabic localization independently of the English content. */
export const TRANSLATION_REVIEW_VERSION = "translation_review_v1";

export function buildTranslationReviewPrompt(draft: RawGeneratedQuestion) {
  const systemPrompt = `You are a professional English-to-Arabic translator and PMP subject-matter
reviewer. You will see an English/Arabic PMP question pair. Score the
Arabic translation on a 0-100 scale for:
- Fluency (does it read as professionally-authored Arabic, not a literal
  machine translation?)
- Accuracy (does it preserve the exact meaning, including technical PMI
  terminology, with no meaning drift from the English?)
- Completeness (is anything missing or truncated?)

Report a single translation_quality score and a list of specific issues
found (empty array if none).`;

  const userPrompt = `English question: ${draft.question_text_en}
Arabic question: ${draft.question_text_ar}

English explanation: ${draft.explanation_en}
Arabic explanation: ${draft.explanation_ar}

English options: ${draft.options.map((o) => o.option_text_en).join(" | ")}
Arabic options: ${draft.options.map((o) => o.option_text_ar).join(" | ")}

Score the translation now.`;

  return {
    systemPrompt,
    userPrompt,
    schema: TRANSLATION_REVIEW_SCHEMA,
    schemaName: TRANSLATION_REVIEW_VERSION,
  };
}
