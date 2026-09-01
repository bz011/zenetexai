import { describe, it, expect } from "vitest";
import { validateWorkbook } from "./workbookRules";
import type { WorkbookData, QuestionRow } from "../types";

function baseData(overrides: Partial<WorkbookData>): WorkbookData {
  return {
    sheetNames: ["questions", "question_options", "hotspots", "drag_and_drop", "question_images"],
    questions: [],
    options: [],
    matchingPairs: [],
    hotspots: [],
    dragDrop: [],
    images: [],
    ...overrides,
  };
}

function questionWithInteraction(interactionType: string): QuestionRow {
  return { question_id: "Q1", interaction_type: interactionType } as QuestionRow;
}

describe("validateWorkbook - matching_pairs conditional requirement", () => {
  it("does NOT require matching_pairs when the workbook has zero matching-type questions (Phase 2 fix)", () => {
    const data = baseData({ questions: [questionWithInteraction("standard"), questionWithInteraction("graphic_based")] });
    const issues = validateWorkbook(data);
    expect(issues.filter((i) => i.code === "MISSING_SHEET")).toHaveLength(0);
  });

  it("still requires matching_pairs when at least one matching-type question exists", () => {
    const data = baseData({ questions: [questionWithInteraction("standard"), questionWithInteraction("matching")] });
    const issues = validateWorkbook(data);
    expect(issues.some((i) => i.code === "MISSING_SHEET" && i.sheet === "matching_pairs")).toBe(true);
  });

  it("does not flag matching_pairs as missing when it's present and needed", () => {
    const data = baseData({
      sheetNames: ["questions", "question_options", "hotspots", "drag_and_drop", "question_images", "matching_pairs"],
      questions: [questionWithInteraction("matching")],
    });
    const issues = validateWorkbook(data);
    expect(issues.filter((i) => i.code === "MISSING_SHEET")).toHaveLength(0);
  });

  it("still requires the always-mandatory sheets regardless of question content", () => {
    const data = baseData({ sheetNames: ["questions"], questions: [questionWithInteraction("standard")] });
    const issues = validateWorkbook(data);
    const missingSheets = issues.filter((i) => i.code === "MISSING_SHEET").map((i) => i.sheet);
    expect(missingSheets).toEqual(expect.arrayContaining(["question_options", "hotspots", "drag_and_drop", "question_images"]));
  });
});
