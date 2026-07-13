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
  await requireRole([...MANAGE_ROLES]);

  const { data, error } = await supabaseAdmin.rpc("set_question_status", {
    p_question_id: questionId,
    p_new_status: newStatus,
    p_reviewer_note: reviewerNote ?? null,
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
  await requireRole([...MANAGE_ROLES]);

  const approved: string[] = [];
  const failed: { questionId: string; error: string }[] = [];

  for (const questionId of questionIds) {
    const { data, error } = await supabaseAdmin.rpc("set_question_status", {
      p_question_id: questionId,
      p_new_status: "approved",
      p_reviewer_note: "Bulk approved",
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
