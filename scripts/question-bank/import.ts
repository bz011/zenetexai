#!/usr/bin/env node
/**
 * Question Bank Importer.
 *
 * Usage: npm run import:question-bank -- [path/to/workbook.xlsx]
 * Optional env: IMPORTED_BY=<name> (defaults to "system")
 *
 * Runs the Sprint 3.5 validator first (mandatory - see validate.ts). If the
 * workbook itself is structurally invalid (missing required sheet), stops
 * entirely and nothing is imported. Otherwise imports every question with
 * status=Approved and zero validator errors, one at a time via the
 * `import_question_bundle` RPC (migration 007) - each call is its own
 * atomic transaction, so one bad question never blocks the rest of the
 * batch. Every excluded or failed question is logged to the report with a
 * rule, severity, and reason - nothing is ever silently skipped.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readWorkbook } from "./readWorkbook";
import { validateWorkbookData } from "./validate";
import { buildQuestionPayload } from "./buildPayload";
import { supabaseAdmin } from "./supabaseAdminClient";
import type {
  ValidationIssue,
  ImportReport,
  RejectedQuestion,
  ImportedQuestion,
  OptionRow,
  MatchingPairRow,
  HotspotRow,
  DragDropRow,
  ImageRow,
} from "./types";

const filePath = process.argv[2] ?? path.resolve(__dirname, "../../../PMP_Question_Bank.xlsx");
const importedBy = process.env.IMPORTED_BY || "system";
const batchId = crypto.randomUUID();
const importedAt = new Date().toISOString();

function groupByQuestionId<T extends { question_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.question_id) ?? [];
    list.push(row);
    map.set(row.question_id, list);
  }
  return map;
}

function writeReport(report: ImportReport): string {
  const dir = path.resolve(__dirname, "reports");
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `import-report-${report.batch.batchId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");
  return outPath;
}

async function main(): Promise<void> {
  console.log(`Import batch ${batchId} starting`);
  console.log(`  source: ${filePath}`);
  console.log(`  imported by: ${importedBy}\n`);

  const data = readWorkbook(filePath);
  const validation = validateWorkbookData(data);

  // Structural errors have no questionId - they describe the workbook
  // itself (e.g. a missing required sheet), not a specific row.
  const structuralErrors = validation.issues.filter((i) => i.severity === "error" && !i.questionId);

  if (structuralErrors.length > 0) {
    console.error("STRUCTURAL VALIDATION FAILED - import aborted. Nothing was written to the database.");
    for (const e of structuralErrors) {
      console.error(`  [${e.code}] ${e.sheet}: ${e.message}`);
    }

    const report: ImportReport = {
      batch: { batchId, sourceFile: filePath, importedBy, importedAt },
      validation: validation.summary,
      imported: [],
      rejected: structuralErrors.map((e) => ({
        questionId: "(workbook)",
        rule: e.code,
        severity: e.severity,
        reason: e.message,
      })),
      statistics: {
        totalQuestions: validation.summary.totalQuestions,
        importedCount: 0,
        rejectedCount: structuralErrors.length,
        byInteractionType: {},
      },
    };
    const reportPath = writeReport(report);
    console.error(`Report written to ${reportPath}`);
    process.exit(1);
  }

  const errorsByQuestion = new Map<string, ValidationIssue[]>();
  for (const issue of validation.issues) {
    if (issue.severity === "error" && issue.questionId) {
      const list = errorsByQuestion.get(issue.questionId) ?? [];
      list.push(issue);
      errorsByQuestion.set(issue.questionId, list);
    }
  }

  const optionsByQuestion = groupByQuestionId<OptionRow>(data.options);
  const matchingByQuestion = groupByQuestionId<MatchingPairRow>(data.matchingPairs);
  const hotspotsByQuestion = groupByQuestionId<HotspotRow>(data.hotspots);
  const dragDropByQuestion = groupByQuestionId<DragDropRow>(data.dragDrop);
  const imagesByQuestion = groupByQuestionId<ImageRow>(data.images);

  const rejected: RejectedQuestion[] = [];
  const imported: ImportedQuestion[] = [];
  const byInteractionType: Record<string, number> = {};

  for (const question of data.questions) {
    const qid = question.question_id;
    const isApproved = question.status.trim() === "Approved";
    const validatorErrors = errorsByQuestion.get(qid) ?? [];

    if (!isApproved) {
      rejected.push({
        questionId: qid,
        rule: "STATUS_NOT_APPROVED",
        severity: "error",
        reason: `status is "${question.status}", not Approved - excluded from production import.`,
      });
      continue;
    }

    if (validatorErrors.length > 0) {
      for (const issue of validatorErrors) {
        rejected.push({ questionId: qid, rule: issue.code, severity: issue.severity, reason: issue.message });
      }
      continue;
    }

    const payload = buildQuestionPayload(question, {
      options: optionsByQuestion.get(qid) ?? [],
      matchingPairs: matchingByQuestion.get(qid) ?? [],
      hotspots: hotspotsByQuestion.get(qid) ?? [],
      dragDrop: dragDropByQuestion.get(qid) ?? [],
      images: imagesByQuestion.get(qid) ?? [],
    });

    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("import_question_bundle", { payload });

    if (rpcError) {
      rejected.push({ questionId: qid, rule: "RPC_CALL_FAILED", severity: "error", reason: rpcError.message });
      continue;
    }

    const result = rpcData as { success: boolean; question_id: string; error?: string };
    if (!result?.success) {
      rejected.push({
        questionId: qid,
        rule: "RPC_IMPORT_FAILED",
        severity: "error",
        reason: result?.error ?? "Unknown RPC failure - no error message returned.",
      });
      continue;
    }

    imported.push({ questionId: qid, interactionType: question.interaction_type });
    byInteractionType[question.interaction_type] = (byInteractionType[question.interaction_type] ?? 0) + 1;
  }

  const report: ImportReport = {
    batch: { batchId, sourceFile: filePath, importedBy, importedAt },
    validation: validation.summary,
    imported,
    rejected,
    statistics: {
      totalQuestions: data.questions.length,
      importedCount: imported.length,
      rejectedCount: rejected.length,
      byInteractionType,
    },
  };

  const reportPath = writeReport(report);

  console.log("=== Import Complete ===");
  console.log(`Batch ID: ${batchId}`);
  console.log(`Total questions: ${report.statistics.totalQuestions}`);
  console.log(`Imported: ${report.statistics.importedCount}`);
  console.log(`Rejected: ${report.statistics.rejectedCount}`);
  console.log(`Workbook health score: ${validation.summary.healthScore}/100`);
  console.log(`Report: ${reportPath}`);
}

main().catch((err) => {
  console.error("IMPORT FAILED TO RUN:", err);
  process.exit(1);
});
