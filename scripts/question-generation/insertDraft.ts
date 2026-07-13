import { supabaseAdmin } from "../question-bank/supabaseAdminClient";
import { buildQuestionPayload } from "../question-bank/buildPayload";
import type { AdaptedDraft } from "./draftAdapter";

/**
 * Inserts an accepted draft via the EXISTING Sprint 4 import_question_bundle
 * RPC - the SAME insertion path workbook imports use. This file does not
 * define any new way to write into questions/question_options/etc; it only
 * builds the same JSON payload buildPayload.ts already produces and calls
 * the same RPC. No second, parallel insertion path exists.
 */
export async function insertAcceptedDraft(adapted: AdaptedDraft): Promise<{ success: boolean; error?: string }> {
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

  if (briefNote) {
    const { data: current } = await supabaseAdmin.from("questions").select("notes").eq("question_id", question.question_id).single();
    const existingNotes = (current as { notes: string | null } | null)?.notes ?? "";
    await supabaseAdmin
      .from("questions")
      .update({ notes: existingNotes ? `${existingNotes} | ${briefNote}` : briefNote })
      .eq("question_id", question.question_id);
  }

  return { success: true };
}
