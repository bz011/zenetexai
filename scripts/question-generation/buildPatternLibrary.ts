#!/usr/bin/env node
/**
 * Pattern Library builder (Sprint 8, Phase 2).
 *
 * Proactively analyzes the APPROVED question bank and seeds the pattern
 * library across every real (domain, approach, difficulty, interaction_type,
 * answer_type) combination present in it - as opposed to patternService.ts's
 * findOrCreatePattern, which only ever extracts a pattern lazily, one slice
 * at a time, in reaction to a generation request. This script never
 * generates questions; it only builds/reports on patterns.
 *
 * Usage:
 *   npm run build:patterns -- --cert PMP
 *   npm run build:patterns -- --cert PMP --dry-run   (report gaps, no LLM calls, no writes)
 *   npm run build:patterns -- --cert PMP --min-sources 2  (skip combos with fewer approved examples)
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabaseAdmin } from "../question-bank/supabaseAdminClient";
import {
  findExistingPattern,
  fetchSourceQuestionsForSlice,
  extractAndInsertPattern,
} from "./patternService";
import type { GenerationTargetSlice } from "./types";

interface ParsedArgs {
  certCode: string;
  dryRun: boolean;
  minSources: number;
  createdBy: string;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = { certCode: "PMP", dryRun: false, minSources: 1, createdBy: "pattern-library-builder" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cert") result.certCode = String(args[++i]).toUpperCase();
    if (args[i] === "--dry-run") result.dryRun = true;
    if (args[i] === "--min-sources") result.minSources = Number(args[++i]) || 1;
    if (args[i] === "--created-by") result.createdBy = String(args[++i]);
  }
  return result;
}

export interface ApprovedQuestionRow {
  question_id: string;
  question_text_en: string;
  domain: string | null;
  approach: string | null;
  difficulty: string | null;
  interaction_type: string;
  answer_type: string;
}

export interface Combo {
  slice: GenerationTargetSlice;
  key: string;
  sourceCount: number;
}

export function comboKey(slice: GenerationTargetSlice): string {
  return [slice.domain ?? "-", slice.approach ?? "-", slice.difficulty ?? "-", slice.interactionType, slice.answerType].join("|");
}

/** Groups the approved bank into every real combination actually present - never invents combinations that don't exist in the data. */
export function discoverCombos(rows: ApprovedQuestionRow[]): Combo[] {
  const counts = new Map<string, Combo>();
  for (const row of rows) {
    const slice: GenerationTargetSlice = {
      domain: row.domain ?? undefined,
      approach: row.approach ?? undefined,
      difficulty: row.difficulty ?? undefined,
      interactionType: row.interaction_type as GenerationTargetSlice["interactionType"],
      answerType: row.answer_type as GenerationTargetSlice["answerType"],
      count: 1,
    };
    const key = comboKey(slice);
    const existing = counts.get(key);
    if (existing) {
      existing.sourceCount++;
    } else {
      counts.set(key, { slice, key, sourceCount: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.sourceCount - a.sourceCount);
}

async function main() {
  const { certCode, dryRun, minSources, createdBy } = parseArgs();

  const { data: cert, error: certError } = await supabaseAdmin.from("certifications").select("id, code").eq("code", certCode).single();
  if (certError || !cert) {
    console.error(`Unknown certification code: ${certCode}`);
    process.exit(1);
  }
  const certificationId = (cert as { id: string }).id;

  const { data: approvedRows, error: rowsError } = await supabaseAdmin
    .from("questions")
    .select("question_id, question_text_en, domain, approach, difficulty, interaction_type, answer_type")
    .eq("certification_id", certificationId)
    .eq("status", "approved");

  if (rowsError) {
    console.error(`Failed to load approved questions: ${rowsError.message}`);
    process.exit(1);
  }

  const combos = discoverCombos((approvedRows ?? []) as ApprovedQuestionRow[]);

  console.log(`Analyzed ${approvedRows?.length ?? 0} approved ${certCode} questions across ${combos.length} distinct combination(s).${dryRun ? " [DRY RUN]" : ""}`);
  console.log("");

  let alreadyCovered = 0;
  let created = 0;
  let skippedTooFewSources = 0;
  let failed = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  for (const combo of combos) {
    const label = `domain=${combo.slice.domain ?? "any"} approach=${combo.slice.approach ?? "any"} difficulty=${combo.slice.difficulty ?? "any"} type=${combo.slice.interactionType}/${combo.slice.answerType}`;

    const existing = await findExistingPattern(certificationId, combo.slice);
    if (existing) {
      alreadyCovered++;
      console.log(`  [covered]  ${label} (${combo.sourceCount} approved source${combo.sourceCount === 1 ? "" : "s"})`);
      continue;
    }

    if (combo.sourceCount < minSources) {
      skippedTooFewSources++;
      console.log(`  [skipped]  ${label} - only ${combo.sourceCount} approved source(s), below --min-sources ${minSources}`);
      continue;
    }

    if (dryRun) {
      console.log(`  [would extract]  ${label} (${combo.sourceCount} approved source${combo.sourceCount === 1 ? "" : "s"})`);
      continue;
    }

    try {
      const sourceQuestions = await fetchSourceQuestionsForSlice(certificationId, combo.slice, 3);
      const { promptTokens, completionTokens } = await extractAndInsertPattern(certificationId, combo.slice, sourceQuestions, createdBy);
      totalPromptTokens += promptTokens;
      totalCompletionTokens += completionTokens;
      created++;
      console.log(`  [created]  ${label}`);
    } catch (err) {
      failed++;
      console.error(`  [failed]   ${label} - ${(err as Error).message}`);
    }
  }

  console.log("");
  console.log("=== Pattern Library build summary ===");
  console.log(`Combinations found:     ${combos.length}`);
  console.log(`Already covered:        ${alreadyCovered}`);
  console.log(`${dryRun ? "Would extract" : "Newly created"}:${dryRun ? "" : "         "}${dryRun ? `          ${combos.length - alreadyCovered - skippedTooFewSources}` : `${created}`}`);
  console.log(`Skipped (too few src):  ${skippedTooFewSources}`);
  if (!dryRun) {
    console.log(`Failed:                 ${failed}`);
    console.log(`Tokens used:            ${totalPromptTokens} prompt / ${totalCompletionTokens} completion`);
  }
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (isDirectRun) {
  main().catch((err) => {
    console.error("PATTERN LIBRARY BUILD FAILED TO RUN:", err);
    process.exit(1);
  });
}
