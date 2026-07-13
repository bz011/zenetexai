import { readWorkbook } from "./readWorkbook";
import { validateWorkbook } from "./rules/workbookRules";
import { validateQuestions } from "./rules/questionRules";
import { validateOptions } from "./rules/optionRules";
import { validateMatchingPairs } from "./rules/matchingRules";
import { validateHotspots } from "./rules/hotspotRules";
import { validateDragDrop } from "./rules/dragDropRules";
import { validateImages } from "./rules/imageRules";
import { validateMetadata } from "./rules/metadataRules";
import { validateCrossReferences } from "./rules/crossValidationRules";
import type { ValidationIssue, ValidationReport, WorkbookData } from "./types";

/**
 * Runs every validation category (A-I) against already-parsed workbook data
 * and produces a report + health score.
 *
 * Health score formula (documented so it can be audited/tuned, not a black
 * box): starts from the percentage of questions with ZERO blocking errors,
 * then subtracts up to 10 points for pervasive warnings. This is deliberately
 * driven by "what fraction of the bank is actually import-ready" rather than
 * raw issue counts, which don't normalize across bank size.
 */
export function validateWorkbookData(data: WorkbookData): ValidationReport {
  const issues: ValidationIssue[] = [
    ...validateWorkbook(data),
    ...validateQuestions(data),
    ...validateOptions(data),
    ...validateMatchingPairs(data),
    ...validateHotspots(data),
    ...validateDragDrop(data),
    ...validateImages(data),
    ...validateMetadata(data),
    ...validateCrossReferences(data),
  ];

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  const questionsWithErrors = new Set(
    issues.filter((i) => i.severity === "error" && i.questionId).map((i) => i.questionId)
  ).size;
  const questionsWithWarnings = new Set(
    issues.filter((i) => i.severity === "warning" && i.questionId).map((i) => i.questionId)
  ).size;

  const totalQuestions = data.questions.length;
  const cleanRatio = totalQuestions > 0 ? (totalQuestions - questionsWithErrors) / totalQuestions : 1;
  const warningPenalty = totalQuestions > 0 ? Math.min(10, (questionsWithWarnings / totalQuestions) * 10) : 0;
  const healthScore = Math.max(0, Math.round(cleanRatio * 100 - warningPenalty));

  return {
    issues,
    summary: {
      totalQuestions,
      errorCount,
      warningCount,
      questionsWithErrors,
      questionsWithWarnings,
      healthScore,
    },
  };
}

/** Convenience wrapper: reads the file, then validates it. */
export function validateWorkbookFile(filePath: string): ValidationReport {
  const data = readWorkbook(filePath);
  return validateWorkbookData(data);
}
