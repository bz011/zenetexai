#!/usr/bin/env node
/**
 * Question Bank Validator CLI.
 *
 * Usage: npm run validate:question-bank -- [path/to/workbook.xlsx]
 * Defaults to ../PMP_Question_Bank.xlsx (the project root, one level above
 * this app) if no path is given.
 *
 * Exit code 0 = no blocking errors, safe to import.
 * Exit code 1 = blocking errors found, import must not proceed.
 *
 * This is the mandatory pre-import gate: the importer (built in a later
 * sprint) must call validateWorkbookFile() and refuse to run if the report
 * contains any error-severity issues. No question should ever bypass this.
 */

import path from "node:path";
import { validateWorkbookFile } from "./validate";
import type { ValidationReport } from "./types";

const filePath = process.argv[2] ?? path.resolve(__dirname, "../../../PMP_Question_Bank.xlsx");

console.log(`Validating question bank: ${filePath}\n`);

let report: ValidationReport;
try {
  report = validateWorkbookFile(filePath);
} catch (err) {
  console.error(`VALIDATION FAILED TO RUN: ${(err as Error).message}`);
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === "error");
const warnings = report.issues.filter((i) => i.severity === "warning");

console.log("=== Summary ===");
console.log(`Total questions: ${report.summary.totalQuestions}`);
console.log(`Errors: ${report.summary.errorCount} (${report.summary.questionsWithErrors} questions affected)`);
console.log(`Warnings: ${report.summary.warningCount} (${report.summary.questionsWithWarnings} questions affected)`);
console.log(`Health score: ${report.summary.healthScore}/100\n`);

function printIssue(issue: (typeof report.issues)[number]): void {
  const qid = issue.questionId ? ` ${issue.questionId}` : "";
  const ref = issue.ref ? ` (${issue.ref})` : "";
  console.log(`  [${issue.code}] ${issue.sheet}${qid}${ref}: ${issue.message}`);
}

if (errors.length > 0) {
  console.log("=== Errors (blocking import) ===");
  errors.forEach(printIssue);
  console.log("");
}

if (warnings.length > 0) {
  console.log("=== Warnings (non-blocking) ===");
  warnings.forEach(printIssue);
  console.log("");
}

if (errors.length > 0) {
  console.error(`VALIDATION FAILED: ${errors.length} blocking error(s) found. Import must not proceed.`);
  process.exit(1);
} else {
  console.log("VALIDATION PASSED: no blocking errors. Safe to import.");
  process.exit(0);
}
