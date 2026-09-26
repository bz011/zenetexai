import { supabaseAdmin } from "../question-bank/supabaseAdminClient";
import { buildQuestionPayload } from "../question-bank/buildPayload";
import type { AdaptedDraft } from "./draftAdapter";

export interface InsertAcceptedDraftOptions {
  /** "<provider>:<model>" - written to questions.generated_by. */
  generatedBy: string;
  /** The independently-computed overall quality score (0-100) - written to questions.quality_score. */
  qualityScore: number;
}

/**
 * Inserts an accepted draft via the EXISTING Sprint 4 import_question_bundle
 * RPC - the SAME insertion path workbook imports use. This file does not
 * define any new way to write into questions/question_options/etc; it only
 * builds the same JSON payload buildPayload.ts already produces and calls
 * the same RPC. No second, parallel insertion path exists.
 *
 * The Sprint 8 Factory metadata (knowledge_area, primary_tag, quality_score,
 * ai_confidence, generated_by, explanation_structured) is NOT part of
 * import_question_bundle's payload shape (that RPC is shared with plain
 * workbook imports, which have none of this data) - it's written via one
 * plain follow-up UPDATE after the bundle insert succeeds, scoped to the
 * question_id the RPC just allocated.
 */
export async function insertAcceptedDraft(adapted: AdaptedDraft, options: InsertAcceptedDraftOptions): Promise<{ success: boolean; error?: string }> {
  const question = adapted.workbook.questions[0];
  if (!question) {
    return { success: false, error: "Adapted draft has no question row" };
  }

  const payload = buildQuestionPayload(question, {
    options: adapted.workbook.options,
    matchingPairs: adapted.workbook.matchingPairs,
    hotspots: adapted.workbook.hotspots,
    dragDrop: adapted.workbook.dragDrop,
    images: adapted.workbook.images,
  });

  const { data, error } = await supabaseAdmin.rpc("import_question_bundle", { payload });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; question_id: string; error?: string };
  if (!result?.success) {
    return { success: false, error: result?.error ?? "Unknown RPC failure" };
  }

  // Image/hotspot briefs, when present, are appended to notes for the human
  // reviewer to act on - no schema change needed for this pending-asset case.
  const briefNote = adapted.imageBrief
    ? `[IMAGE BRIEF NEEDED: ${adapted.imageBrief}]`
    : adapted.hotspotBrief
      ? `[HOTSPOT BRIEF NEEDED: image=${adapted.hotspotBrief.imageDescription}; target=${adapted.hotspotBrief.targetDescription}]`
      : null;

  const { data: current } = await supabaseAdmin.from("questions").select("notes").eq("question_id", question.question_id).single();
  const existingNotes = (current as { notes: string | null } | null)?.notes ?? "";

  const { error: metadataError } = await supabaseAdmin
    .from("questions")
    .update({
      notes: briefNote ? (existingNotes ? `${existingNotes} | ${briefNote}` : briefNote) : existingNotes,
      knowledge_area: adapted.factoryMetadata.knowledgeArea,
      process_group: adapted.factoryMetadata.processGroup,
      primary_tag: adapted.factoryMetadata.primaryTag,
      estimated_time_seconds: adapted.factoryMetadata.estimatedTimeSeconds,
      bloom_level: adapted.factoryMetadata.bloomLevel,
      ai_confidence: adapted.factoryMetadata.confidence,
      quality_score: options.qualityScore,
      generated_by: options.generatedBy,
      explanation_structured: adapted.factoryMetadata.explanationStructured,
    })
    .eq("question_id", question.question_id);

  if (metadataError) {
    // The question itself was already inserted successfully - a failure
    // here is a real but non-fatal problem (missing Factory metadata, not
    // a missing question). Surfaced as an error string, not a thrown
    // exception, so the caller can decide whether to treat it as fatal.
    return { success: false, error: `Question inserted but Factory metadata failed to save: ${metadataError.message}` };
  }

  return { success: true };
}
