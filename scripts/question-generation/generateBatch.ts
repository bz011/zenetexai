#!/usr/bin/env node
/**
 * Batch generation CLI - the only place a multi-question generation batch
 * actually runs. Deliberately CLI-driven rather than executed inline from
 * a Next.js Server Action: a 100-question batch can take many minutes,
 * far past typical serverless function timeouts. The admin UI creates and
 * configures a batch (status='draft') and can view its progress/results,
 * but an operator (or a scheduled job in a real deployment) runs this
 * script to actually execute it.
 *
 * Usage:
 *   npm run generate:questions -- --batch-id <uuid>
 *   npm run generate:questions -- --config path/to/config.json
 *
 * Config file shape:
 *   {
 *     "certificationCode": "PMP",
 *     "createdBy": "admin@example.com",
 *     "dryRun": false,
 *     "slices": [
 *       { "interactionType": "standard", "answerType": "single", "domain": "Process", "count": 3 }
 *     ]
 *   }
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabaseAdmin } from "../question-bank/supabaseAdminClient";
import { getLLMProvider } from "./llm";
import { generateOneQuestion } from "./generatePipeline";
import { estimateCostUsd } from "./costEstimator";
import type { GenerationTargetSlice, BatchConfig, BatchRow } from "./types";

const MAX_BATCH_SIZE = 100;
const CONCURRENCY_LIMIT = 3;

function parseArgs(): { batchId?: string; configPath?: string } {
  const args = process.argv.slice(2);
  const result: { batchId?: string; configPath?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch-id") result.batchId = args[++i];
    if (args[i] === "--config") result.configPath = args[++i];
  }
  return result;
}

async function createBatchFromConfig(config: BatchConfig): Promise<string> {
  if (config.requestedCount > MAX_BATCH_SIZE) {
    throw new Error(`requestedCount (${config.requestedCount}) exceeds the hard maximum of ${MAX_BATCH_SIZE}.`);
  }

  const { data: cert, error: certError } = await supabaseAdmin
    .from("certifications")
    .select("id")
    .eq("code", config.certificationCode.toUpperCase())
    .single();

  if (certError || !cert) {
    throw new Error(`Unknown certification code: ${config.certificationCode}`);
  }

  const provider = getLLMProvider();

  const { data: batch, error } = await supabaseAdmin
    .from("generation_batches")
    .insert({
      certification_id: (cert as { id: string }).id,
      requested_count: config.requestedCount,
      requested_distribution: { slices: config.slices },
      target_domains: [...new Set(config.slices.map((s) => s.domain).filter(Boolean))],
      target_approaches: [...new Set(config.slices.map((s) => s.approach).filter(Boolean))],
      target_difficulties: [...new Set(config.slices.map((s) => s.difficulty).filter(Boolean))],
      target_interaction_types: [...new Set(config.slices.map((s) => s.interactionType))],
      target_answer_types: [...new Set(config.slices.map((s) => s.answerType))],
      llm_provider: provider.name,
      llm_model: provider.defaultModel,
      status: "draft",
      created_by: config.createdBy,
    })
    .select("id")
    .single();

  if (error || !batch) {
    throw new Error(`Failed to create batch: ${error?.message}`);
  }

  return (batch as { id: string }).id;
}

async function fetchStyleExamples(certificationId: string, slice: GenerationTargetSlice): Promise<string[]> {
  let query = supabaseAdmin
    .from("questions")
    .select("question_text_en")
    .eq("certification_id", certificationId)
    .eq("status", "approved")
    .limit(2);
  if (slice.domain) query = query.eq("domain", slice.domain);
  const { data } = await query;
  return ((data ?? []) as { question_text_en: string }[]).map((r) => r.question_text_en);
}

async function isCancelled(batchId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from("generation_batches").select("status").eq("id", batchId).single();
  return (data as { status: string } | null)?.status === "cancelled";
}

/** Pure decision table for the batch's terminal status - kept separate from runBatch so it's unit-testable without mocking Supabase. */
export function computeFinalBatchStatus(input: {
  isDryRun: boolean;
  isCancelled: boolean;
  hadFailure: boolean;
  passedCount: number;
}): "completed" | "cancelled" | "partially_completed" | "failed" {
  if (input.isDryRun) return "completed";
  if (input.isCancelled) return "cancelled";
  if (input.hadFailure && input.passedCount > 0) return "partially_completed";
  if (input.hadFailure) return "failed";
  return "completed";
}

/** Simple concurrency-limited task runner - no external queue dependency needed at this scale. */
async function runWithConcurrencyLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const current = nextIndex++;
      results[current] = await tasks[current]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

export async function runBatch(batchId: string): Promise<void> {
  const { data: batchData, error: batchError } = await supabaseAdmin.from("generation_batches").select("*").eq("id", batchId).single();
  if (batchError || !batchData) {
    throw new Error(`Batch not found: ${batchId}`);
  }
  const batch = batchData as BatchRow & { requested_distribution: { slices: GenerationTargetSlice[] } };

  const { data: certData } = await supabaseAdmin.from("certifications").select("code").eq("id", batch.certification_id).single();
  const certificationCode = (certData as { code: string } | null)?.code ?? "PMP";

  await supabaseAdmin.from("generation_batches").update({ status: "running", started_at: new Date().toISOString() }).eq("id", batchId);

  const slices = batch.requested_distribution.slices;
  const isDryRun = process.env.DRY_RUN === "true";

  let generatedCount = 0;
  let passedCount = 0;
  let rejectedCount = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let hadFailure = false;
  const sameBatchDraftTexts: { batchQuestionId: string; text: string }[] = [];

  console.log(`Batch ${batchId}: ${slices.reduce((sum, s) => sum + s.count, 0)} questions across ${slices.length} slice(s)${isDryRun ? " [DRY RUN]" : ""}`);

  for (const slice of slices) {
    if (await isCancelled(batchId)) {
      console.log("Batch cancelled - stopping before next slice.");
      break;
    }

    const styleExamples = await fetchStyleExamples(batch.certification_id, slice);

    const tasks = Array.from({ length: slice.count }, () => async () => {
      if (isDryRun) {
        console.log(`[DRY RUN] Would generate: ${JSON.stringify(slice)}`);
        return;
      }

      try {
        const outcome = await generateOneQuestion({
          certificationId: batch.certification_id,
          certificationCode,
          slice,
          batchId,
          createdBy: batch.created_by,
          styleExampleTexts: styleExamples,
          sameBatchDraftTexts,
        });

        generatedCount++;
        promptTokens += outcome.promptTokens;
        completionTokens += outcome.completionTokens;

        if (outcome.accepted) {
          passedCount++;
          console.log(`  ACCEPTED ${outcome.questionId} (overall score ${outcome.qualityScores.overall})`);
        } else {
          rejectedCount++;
          console.log(`  REJECTED: ${outcome.rejectionReason}`);
        }
      } catch (err) {
        // One failed generation must never stop the batch.
        hadFailure = true;
        rejectedCount++;
        generatedCount++;
        console.error(`  FAILED: ${(err as Error).message}`);
      }
    });

    await runWithConcurrencyLimit(tasks, CONCURRENCY_LIMIT);

    // Persist progress after every slice so the admin UI's batch-detail
    // page reflects real progress even if a later slice fails outright.
    await supabaseAdmin
      .from("generation_batches")
      .update({
        generated_count: generatedCount,
        passed_count: passedCount,
        rejected_count: rejectedCount,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        estimated_cost_usd: estimateCostUsd(batch.llm_model, promptTokens, completionTokens),
      })
      .eq("id", batchId);
  }

  const finalStatus = computeFinalBatchStatus({
    isDryRun,
    isCancelled: await isCancelled(batchId),
    hadFailure,
    passedCount,
  });

  await supabaseAdmin
    .from("generation_batches")
    .update({ status: finalStatus, completed_at: new Date().toISOString() })
    .eq("id", batchId);

  console.log(`\n=== Batch ${batchId} ${finalStatus} ===`);
  console.log(`Generated: ${generatedCount} | Passed: ${passedCount} | Rejected: ${rejectedCount}`);
  console.log(`Tokens: ${promptTokens} prompt / ${completionTokens} completion`);
}

async function main() {
  const { batchId, configPath } = parseArgs();

  if (batchId) {
    await runBatch(batchId);
    return;
  }

  if (configPath) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as BatchConfig;
    config.requestedCount = config.slices.reduce((sum, s) => sum + s.count, 0);
    if (config.dryRun) process.env.DRY_RUN = "true";
    const newBatchId = await createBatchFromConfig(config);
    console.log(`Created batch ${newBatchId}`);
    await runBatch(newBatchId);
    return;
  }

  console.error("Usage: npm run generate:questions -- --batch-id <uuid> | --config <path.json>");
  process.exit(1);
}

// Only auto-run when this file is the CLI entry point (`tsx generateBatch.ts`),
// never when it's imported by a test or another module - otherwise importing
// this file for its pure computeFinalBatchStatus() export would also trigger
// a real batch run / process.exit(1).
const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (isDirectRun) {
  main().catch((err) => {
    console.error("BATCH GENERATION FAILED TO RUN:", err);
    process.exit(1);
  });
}
