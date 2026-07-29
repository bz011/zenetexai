"use server";

/**
 * Admin-only Server Actions for the AI Question Generation system.
 * Every action calls requireRole(['admin','instructor']) first, then uses
 * the service-role client for the actual write, since migration 008 grants
 * zero authenticated write policies on any generation_* table (same
 * "app-level check + service-role write, RLS as backstop" pattern used
 * throughout this project).
 *
 * Multi-question batch EXECUTION is deliberately not triggered from here -
 * see generateBatch.ts's header comment for why. This file only creates/
 * configures/cancels batches and handles single-question review actions.
 */

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MANAGE_ROLES = ["admin", "instructor"] as const;
const MAX_BATCH_SIZE = 100;

export async function createGenerationBatch(formData: FormData): Promise<{ success: boolean; batchId?: string; error?: string }> {
  const { user } = await requireRole([...MANAGE_ROLES]);

  const certificationCode = String(formData.get("certification_code") ?? "PMP").toUpperCase();
  const domain = String(formData.get("domain") ?? "") || null;
  const approach = String(formData.get("approach") ?? "") || null;
  const difficulty = String(formData.get("difficulty") ?? "") || null;
  const interactionType = String(formData.get("interaction_type") ?? "standard");
  const answerType = String(formData.get("answer_type") ?? "single");
  const count = Number(formData.get("count") ?? 5);

  if (!Number.isFinite(count) || count < 1 || count > MAX_BATCH_SIZE) {
    return { success: false, error: `count must be between 1 and ${MAX_BATCH_SIZE}` };
  }

  const { data: cert, error: certError } = await supabaseAdmin
    .from("certifications")
    .select("id")
    .eq("code", certificationCode)
    .single();

  if (certError || !cert) {
    return { success: false, error: `Unknown certification code: ${certificationCode}` };
  }

  const slice = { interactionType, answerType, domain, approach, difficulty, count };

  const { data: batch, error } = await supabaseAdmin
    .from("generation_batches")
    .insert({
      certification_id: (cert as { id: string }).id,
      requested_count: count,
      requested_distribution: { slices: [slice] },
      target_domains: domain ? [domain] : [],
      target_approaches: approach ? [approach] : [],
      target_difficulties: difficulty ? [difficulty] : [],
      target_interaction_types: [interactionType],
      target_answer_types: [answerType],
      llm_provider: "openai",
      llm_model: "gpt-4o-2024-08-06",
      status: "draft",
      created_by: user.email ?? user.id,
    })
    .select("id")
    .single();

  if (error || !batch) {
    return { success: false, error: error?.message ?? "Failed to create batch" };
  }

  revalidatePath("/admin/ai-generation");
  return { success: true, batchId: (batch as { id: string }).id };
}

export async function cancelGenerationBatch(batchId: string): Promise<{ success: boolean; error?: string }> {
  await requireRole([...MANAGE_ROLES]);

  const { error } = await supabaseAdmin
    .from("generation_batches")
    .update({ status: "cancelled" })
    .eq("id", batchId)
    .in("status", ["draft", "running"]);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/ai-generation/batches/${batchId}`);
  return { success: true };
}

export async function setQuestionReviewStatus(
  questionId: string,
  newStatus: "approved" | "rejected" | "needs_review",
  reviewerNote?: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireRole([...MANAGE_ROLES]);

  const { data, error } = await supabaseAdmin.rpc("set_question_status", {
    p_question_id: questionId,
    p_new_status: newStatus,
    p_reviewer_note: reviewerNote ?? null,
    p_actor: user.email ?? user.id,
  });

  if (error) return { success: false, error: error.message };
  const result = data as { success: boolean; error?: string };
  if (!result?.success) return { success: false, error: result?.error };

  revalidatePath("/admin/ai-generation/review");
  revalidatePath(`/admin/ai-generation/review/${questionId}`);
  return { success: true };
}

/**
 * Bulk approve - every question_id here already reached the review queue,
 * meaning it already passed the automated quality gate (hard failures
 * never reach `questions` at all). This loop calls the same per-question
 * RPC one at a time, so one failure never blocks the rest of the selection.
 */
export async function bulkApproveQuestions(questionIds: string[]): Promise<{
  approved: string[];
  failed: { questionId: string; error: string }[];
}> {
  const { user } = await requireRole([...MANAGE_ROLES]);
  const actor = user.email ?? user.id;

  const approved: string[] = [];
  const failed: { questionId: string; error: string }[] = [];

  for (const questionId of questionIds) {
    const { data, error } = await supabaseAdmin.rpc("set_question_status", {
      p_question_id: questionId,
      p_new_status: "approved",
      p_reviewer_note: "Bulk approved",
      p_actor: actor,
    });

    if (error) {
      failed.push({ questionId, error: error.message });
      continue;
    }
    const result = data as { success: boolean; error?: string };
    if (!result?.success) {
      failed.push({ questionId, error: result?.error ?? "Unknown failure" });
      continue;
    }
    approved.push(questionId);
  }

  revalidatePath("/admin/ai-generation/review");
  return { approved, failed };
}

/** Leave a comment without changing review status - logged like every other reviewer action. */
export async function commentOnQuestion(questionId: string, comment: string): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireRole([...MANAGE_ROLES]);

  if (!comment.trim()) return { success: false, error: "Comment cannot be empty." };

  const { data, error } = await supabaseAdmin.rpc("log_question_review_action", {
    p_question_id: questionId,
    p_action: "commented",
    p_actor: user.email ?? user.id,
    p_comment: comment,
  });

  if (error) return { success: false, error: error.message };
  const result = data as { success: boolean; error?: string };
  if (!result?.success) return { success: false, error: result?.error };

  revalidatePath(`/admin/ai-generation/review/${questionId}`);
  return { success: true };
}

export interface QuestionEditInput {
  question_text_en: string;
  question_text_ar: string;
  explanation_en: string;
  explanation_ar: string;
  options?: { id: string; option_text_en: string; option_text_ar: string; feedback_en: string; feedback_ar: string }[];
}

/**
 * Edit a draft's content before approving. Reuses import_question_bundle
 * (the ONLY insertion/update path for question content, migration 007) via
 * buildQuestionPayload - this is NOT a second write path, just a second
 * caller of the existing one. Snapshots the pre-edit row into
 * question_versions first (record_question_version RPC), then logs the
 * edit action - matching every other reviewer action's audit trail.
 *
 * Scope: text fields only (question/explanation/option text+feedback).
 * Does not support editing option correctness, matching/drag-drop/hotspot
 * content, or metadata classification in this sprint - those still require
 * re-generation (Regenerate/Request repair) rather than direct editing.
 */
export async function editQuestionDraft(questionId: string, edits: QuestionEditInput): Promise<{ success: boolean; error?: string }> {
  const { user, supabase } = await requireRole([...MANAGE_ROLES]);
  const actor = user.email ?? user.id;

  const { data: current, error: fetchError } = await supabase
    .from("questions")
    .select("*, question_options(*)")
    .eq("question_id", questionId)
    .single();

  if (fetchError || !current) {
    return { success: false, error: "Question not found." };
  }

  const { error: versionError } = await supabaseAdmin.rpc("record_question_version", {
    p_question_id: questionId,
    p_snapshot: current,
    p_changed_by: actor,
    p_change_reason: "Pre-edit snapshot",
  });
  if (versionError) {
    return { success: false, error: `Failed to snapshot current version: ${versionError.message}` };
  }

  const { error: updateError } = await supabaseAdmin
    .from("questions")
    .update({
      question_text_en: edits.question_text_en,
      question_text_ar: edits.question_text_ar,
      explanation_en: edits.explanation_en,
      explanation_ar: edits.explanation_ar,
    })
    .eq("question_id", questionId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  if (edits.options && edits.options.length > 0) {
    for (const option of edits.options) {
      const { error: optionError } = await supabaseAdmin
        .from("question_options")
        .update({
          option_text_en: option.option_text_en,
          option_text_ar: option.option_text_ar,
          feedback_en: option.feedback_en,
          feedback_ar: option.feedback_ar,
        })
        .eq("id", option.id);
      if (optionError) {
        return { success: false, error: `Failed to update option: ${optionError.message}` };
      }
    }
  }

  await supabaseAdmin
    .from("questions")
    .update({ version: ((current as { version?: number }).version ?? 1) + 1 })
    .eq("question_id", questionId);

  await supabaseAdmin.rpc("log_question_review_action", {
    p_question_id: questionId,
    p_action: "edited",
    p_actor: actor,
    p_comment: "Edited question content before review.",
  });

  revalidatePath(`/admin/ai-generation/review/${questionId}`);
  return { success: true };
}
