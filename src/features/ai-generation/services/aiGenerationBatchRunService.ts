"use server";

/**
 * Runs a previously-created (status: draft) generation batch directly from
 * the Admin UI, synchronously, within this Server Action's request. Reuses
 * runBatch from the CLI script (scripts/question-generation/
 * generateBatch.ts) rather than re-implementing batch execution, so the UI
 * and CLI paths can never drift apart - there is exactly one place a batch
 * actually runs.
 *
 * maxDuration for this action lives on the page that invokes it
 * (batches/[batchId]/page.tsx) - a "use server" file may only export async
 * functions, so it can't be set here directly.
 *
 * MAX_UI_RUN_COUNT exists because a serverless function that gets killed by
 * a hard duration timeout mid-batch leaves the generation_batches row stuck
 * in status='running' forever (runBatch's final status update never runs -
 * the platform just terminates the request). Small pilot-sized batches
 * comfortably finish well inside typical serverless limits; anything larger
 * should run via `npm run generate:questions -- --batch-id <id>` from an
 * operator's machine, which has no such time limit. This does not forbid
 * creating a larger batch (the create form still allows up to 100 for CLI
 * use) - it only refuses to run one this way that's likely to get killed
 * mid-flight.
 */

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { runBatch } from "@scripts/question-generation/generateBatch";
import { MAX_UI_RUN_COUNT } from "./aiGenerationBatchRunConstants";

const MANAGE_ROLES = ["admin", "instructor"] as const;

export async function runGenerationBatchNow(batchId: string): Promise<{ success: boolean; error?: string }> {
  await requireRole([...MANAGE_ROLES]);

  const { data: batch, error: fetchError } = await supabaseAdmin
    .from("generation_batches")
    .select("status, requested_count")
    .eq("id", batchId)
    .single();

  if (fetchError || !batch) {
    return { success: false, error: "Batch not found." };
  }

  const { status, requested_count } = batch as { status: string; requested_count: number };

  if (status !== "draft") {
    return { success: false, error: `Batch is already "${status}" - it can only be run once, from draft.` };
  }

  if (requested_count > MAX_UI_RUN_COUNT) {
    return {
      success: false,
      error: `This batch requests ${requested_count} questions, above the ${MAX_UI_RUN_COUNT}-question limit for running from the Admin UI (larger batches risk a serverless timeout mid-run). Run it via: npm run generate:questions -- --batch-id ${batchId}`,
    };
  }

  try {
    await runBatch(batchId);
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  revalidatePath(`/admin/ai-generation/batches/${batchId}`);
  revalidatePath("/admin/ai-generation");
  return { success: true };
}
