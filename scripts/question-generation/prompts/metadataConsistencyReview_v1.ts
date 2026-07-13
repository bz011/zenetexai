import { METADATA_CONSISTENCY_SCHEMA } from "./schemas";
import type { RawGeneratedQuestion, GenerationTargetSlice } from "../types";

/**
 * metadata_consistency_review_v1
 *
 * Checks whether the generated content actually matches its own declared
 * metadata (e.g. tagged "Agile" but describing a waterfall change-control
 * board) - a mismatch here means the tagging is unreliable even if the
 * question itself is fine.
 */
export const METADATA_CONSISTENCY_REVIEW_VERSION = "metadata_consistency_review_v1";

export function buildMetadataConsistencyPrompt(draft: RawGeneratedQuestion, target: GenerationTargetSlice) {
  const systemPrompt = `You are auditing whether a PMP question's declared metadata (domain,
approach, difficulty, cognitive level) actually matches its content. Score
0-100 on how consistent the content is with its metadata, and list any
specific mismatches found (empty array if none). A question tagged
"Agile"/"Predictive"/etc. must actually reflect that approach in its
scenario and correct-answer reasoning, not just in its label.`;

  const userPrompt = `Declared metadata: domain=${draft.domain}, approach=${draft.approach},
difficulty=${draft.difficulty}, cognitive_level=${draft.cognitive_level},
task=${draft.task}, topic=${draft.topic}
Originally requested: approach=${target.approach ?? "unspecified"}, difficulty=${target.difficulty ?? "unspecified"}

Question: ${draft.question_text_en}
Explanation: ${draft.explanation_en}

Score metadata consistency now.`;

  return {
    systemPrompt,
    userPrompt,
    schema: METADATA_CONSISTENCY_SCHEMA,
    schemaName: METADATA_CONSISTENCY_REVIEW_VERSION,
  };
}
