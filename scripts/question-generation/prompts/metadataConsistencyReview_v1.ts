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
specific mismatches found (empty array if none).

The approach check must be EVIDENCE-based, not absence-of-contradiction
based. A question tagged "Predictive" is NOT automatically consistent just
because it contains no Agile language - the scenario must contain genuine
Predictive-specific detail (a defined baseline/scope freeze, sequential
phases, formal change control, a schedule/WBS being followed) for the label
to be earned. The same standard applies to "Agile" (iterations/sprints,
backlog, self-organizing team, retrospective/stand-up, incremental
delivery) and "Hybrid" (evidence of both). A generic scenario that could
equally be Predictive, Agile, or Hybrid with no distinguishing detail is a
REAL mismatch, not a neutral case - score it low (below 50) and name
"approach" specifically in mismatches, explaining what evidence is missing.`;

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
