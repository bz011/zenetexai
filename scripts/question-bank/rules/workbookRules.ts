/** Category A - Workbook Validation */

import type { WorkbookData, ValidationIssue } from "../types";
import { REQUIRED_SHEETS } from "../constants";

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

  return issues;
}
