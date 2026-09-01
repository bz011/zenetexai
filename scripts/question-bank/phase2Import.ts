#!/usr/bin/env node
/**
 * Phase 2 import (Sprint: PMP Question Bank reconciliation).
 *
 * Imports every question that is genuinely clean (status=Approved, zero
 * validator errors after the approved deterministic normalizations in
 * normalize.ts) and not already in the database. Everything that still
 * requires owner-authored content (missing option text, missing question
 * text, missing images, ambiguous enum decisions) is left untouched and
 * explicitly reported - never fabricated, never guessed.
 *
 * The ONLY workbook-specific (not generally-applicable) fix in this file is
 * the two-question image-row synthesis for Q000206/Q000207, explicitly
 * approved for exactly these two IDs (see the Phase 2 owner instructions) -
 * both already have a verified, unambiguous local asset and a
 * question_images-shaped row is added in-memory (never written back to the
 * Excel file) only if no such row already exists.
 *
 * Usage: npx tsx scripts/question-bank/phase2Import.ts
 */

import fs from "node:fs";
import path from "node:path";
import { readWorkbook } from "./readWorkbook";
import { validateWorkbookData } from "./validate";
import { buildQuestionPayload } from "./buildPayload";
import { supabaseAdmin } from "./supabaseAdminClient";
import type { ValidationIssue, ImageRow, OptionRow, HotspotRow, DragDropRow, MatchingPairRow } from "./types";

const EXCEL_PATH = "C:/Users/PC/Desktop/PMP_Question_Bank copy.xlsx";
const DRY_RUN = process.env.DRY_RUN === "1";

/** Explicitly approved, narrow, two-question exception - see file header. */
const SAFE_IMAGE_ROW_SYNTHESIS: Record<string, ImageRow> = {
  Q000206: { question_id: "Q000206", image_id: "IMG_SYNTH_Q000206", image_path: "question_images/Q000206.png", image_alt_en: "", image_alt_ar: "", display_order: "1" },
  Q000207: { question_id: "Q000207", image_id: "IMG_SYNTH_Q000207", image_path: "question_images/Q000207.png", image_alt_en: "", image_alt_ar: "", display_order: "1" },
};

type FinalStatus =
  | "IMPORTED"
  | "ALREADY_PRESENT"
  | "UNRESOLVED_DATA_ISSUE"
  | "UNRESOLVED_ASSET_ISSUE"
  | "UNRESOLVED_OWNER_DECISION"
  | "INTENTIONAL_EXISTING_EXCLUSION";

/** Known special-case classifications from the approved audit - everything
 * NOT listed here defaults to UNRESOLVED_DATA_ISSUE if it has validator
 * errors (the 34-question missing-option cluster + Q000762 fallback +
 * Q000222/Q000359/Q000615). */
const OWNER_DECISION_IDS = new Set(["Q000715", "Q000719"]);
const ASSET_ISSUE_IDS = new Set(["Q000118", "Q000133"]);
/** Q000182's status cell contains shifted garbage (see the audit's
 * column-shift finding), not a genuine draft/needs-review state - without
 * this override the generic "status !== Approved" check would misfile it
 * as an owner-decision case when it's really the missing-question-text
 * data issue. */
const DATA_ISSUE_OVERRIDE_IDS = new Set(["Q000182"]);

async function main() {
  console.log(`Phase 2 import starting. Source: ${EXCEL_PATH}\n`);

  const data = readWorkbook(EXCEL_PATH);

  // Narrow, explicit, two-question image synthesis - never written back to Excel.
  const syntheticImageRows: ImageRow[] = [];
  for (const [qid, row] of Object.entries(SAFE_IMAGE_ROW_SYNTHESIS)) {
    const alreadyHasImageRow = data.images.some((i) => i.question_id === qid);
    if (!alreadyHasImageRow) {
      syntheticImageRows.push(row);
    }
  }
  if (syntheticImageRows.length > 0) {
    console.log(`Synthesizing ${syntheticImageRows.length} in-memory image row(s) (not written to Excel):`, syntheticImageRows.map((r) => r.question_id));
    data.images = [...data.images, ...syntheticImageRows];
  }

  const validation = validateWorkbookData(data);
  const structuralErrors = validation.issues.filter((i) => i.severity === "error" && !i.questionId);
  if (structuralErrors.length > 0) {
    console.error("STRUCTURAL VALIDATION FAILED - aborting. Nothing was imported.");
    console.error(structuralErrors);
    process.exit(1);
  }
  console.log(`Validation: ${validation.summary.totalQuestions} questions, ${validation.summary.errorCount} error(s) across ${validation.summary.questionsWithErrors} question(s).\n`);

  const errorsByQid = new Map<string, ValidationIssue[]>();
  for (const issue of validation.issues) {
    if (issue.severity === "error" && issue.questionId) {
      const list = errorsByQid.get(issue.questionId) ?? [];
      list.push(issue);
      errorsByQid.set(issue.questionId, list);
    }
  }

  const { data: existingRows } = await supabaseAdmin.from("questions").select("question_id");
  const existingIds = new Set(((existingRows ?? []) as { question_id: string }[]).map((r) => r.question_id));
  console.log(`Existing DB questions: ${existingIds.size}\n`);

  function groupByQuestionId<T extends { question_id: string }>(rows: T[]): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      const list = map.get(row.question_id) ?? [];
      list.push(row);
      map.set(row.question_id, list);
    }
    return map;
  }
  const optionsByQuestion = groupByQuestionId<OptionRow>(data.options);
  const matchingByQuestion = groupByQuestionId<MatchingPairRow>(data.matchingPairs);
  const hotspotsByQuestion = groupByQuestionId<HotspotRow>(data.hotspots);
  const dragDropByQuestion = groupByQuestionId<DragDropRow>(data.dragDrop);
  const imagesByQuestion = groupByQuestionId<ImageRow>(data.images);

  const results: { questionId: string; status: FinalStatus; detail: string }[] = [];
  let importedCount = 0;

  for (const question of data.questions) {
    const qid = question.question_id;

    if (existingIds.has(qid)) {
      results.push({ questionId: qid, status: "ALREADY_PRESENT", detail: "Already in DB (exact-match workbook-origin question) - not re-imported (avoids unnecessary UPSERT churn)." });
      continue;
    }

    if (DATA_ISSUE_OVERRIDE_IDS.has(qid)) {
      const errors = errorsByQid.get(qid) ?? [];
      results.push({ questionId: qid, status: "UNRESOLVED_DATA_ISSUE", detail: `Column-shift data corruption (see audit) - status cell holds shifted garbage, not a real approval state. Underlying errors: ${errors.map((e) => e.code).join(", ")}` });
      continue;
    }

    const isApproved = question.status.trim() === "Approved";
    if (!isApproved) {
      results.push({ questionId: qid, status: "UNRESOLVED_OWNER_DECISION", detail: `status is "${question.status}", not Approved.` });
      continue;
    }

    const errors = errorsByQid.get(qid) ?? [];
    if (errors.length > 0) {
      const codes = errors.map((e) => e.code);
      let status: FinalStatus = "UNRESOLVED_DATA_ISSUE";
      if (OWNER_DECISION_IDS.has(qid)) status = "UNRESOLVED_OWNER_DECISION";
      else if (ASSET_ISSUE_IDS.has(qid)) status = "UNRESOLVED_ASSET_ISSUE";
      results.push({ questionId: qid, status, detail: codes.join(", ") });
      continue;
    }

    // Clean, approved, not yet in DB - import it.
    const payload = buildQuestionPayload(question, {
      options: optionsByQuestion.get(qid) ?? [],
      matchingPairs: matchingByQuestion.get(qid) ?? [],
      hotspots: hotspotsByQuestion.get(qid) ?? [],
      dragDrop: dragDropByQuestion.get(qid) ?? [],
      images: imagesByQuestion.get(qid) ?? [],
    });

    if (DRY_RUN) {
      results.push({ questionId: qid, status: "IMPORTED", detail: "DRY RUN - would import, RPC not called." });
      importedCount++;
      continue;
    }

    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("import_question_bundle", { payload });
    if (rpcError) {
      results.push({ questionId: qid, status: "UNRESOLVED_DATA_ISSUE", detail: `RPC_CALL_FAILED: ${rpcError.message}` });
      continue;
    }
    const result = rpcData as { success: boolean; error?: string };
    if (!result?.success) {
      results.push({ questionId: qid, status: "UNRESOLVED_DATA_ISSUE", detail: `RPC_IMPORT_FAILED: ${result?.error ?? "unknown"}` });
      continue;
    }

    results.push({ questionId: qid, status: "IMPORTED", detail: "Imported successfully." });
    importedCount++;
  }

  const byStatus: Record<string, number> = {};
  for (const r of results) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  console.log("=== PHASE 2 IMPORT RESULTS ===");
  console.log(byStatus);
  console.log(`\nTotal intended questions processed: ${results.length}`);
  console.log(`Newly imported: ${importedCount}`);

  const outDir = path.resolve(__dirname, "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `phase2-import-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ byStatus, results }, null, 2));
  console.log(`\nFull report written to ${outPath}`);
}

main().catch((err) => {
  console.error("PHASE 2 IMPORT FAILED TO RUN:", err);
  process.exit(1);
});
