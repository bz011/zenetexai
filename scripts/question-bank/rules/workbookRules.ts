/** Category A - Workbook Validation */

import type { WorkbookData, ValidationIssue } from "../types";
import { REQUIRED_SHEETS, CONDITIONALLY_REQUIRED_SHEETS } from "../constants";

export function validateWorkbook(data: WorkbookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lowerNames = data.sheetNames.map((n) => n.toLowerCase());

  for (const required of REQUIRED_SHEETS) {
    if (!lowerNames.includes(required.toLowerCase())) {
      issues.push({
        severity: "error",
        code: "MISSING_SHEET",
        message: `Required sheet "${required}" was not found in the workbook.`,
        sheet: required,
      });
    }
  }

  for (const conditional of CONDITIONALLY_REQUIRED_SHEETS) {
    const isNeeded = data.questions.some((q) => q.interaction_type === conditional.requiredForInteractionType);
    if (isNeeded && !lowerNames.includes(conditional.sheet.toLowerCase())) {
      issues.push({
        severity: "error",
        code: "MISSING_SHEET",
        message: `Required sheet "${conditional.sheet}" was not found in the workbook, but the workbook contains at least one "${conditional.requiredForInteractionType}"-type question that needs it.`,
        sheet: conditional.sheet,
      });
    }
  }

  return issues;
}
