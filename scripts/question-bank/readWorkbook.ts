import fs from "node:fs";
import * as XLSX from "xlsx";
import type {
  WorkbookData,
  QuestionRow,
  OptionRow,
  MatchingPairRow,
  HotspotRow,
  DragDropRow,
  ImageRow,
} from "./types";

function findSheetName(workbook: XLSX.WorkBook, candidates: string[]): string | undefined {
  const lowerMap = new Map(workbook.SheetNames.map((n) => [n.toLowerCase(), n]));
  for (const candidate of candidates) {
    const found = lowerMap.get(candidate.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

function sheetToRows<T>(workbook: XLSX.WorkBook, sheetName: string | undefined): T[] {
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<T>(sheet, { defval: "", raw: false });
}

/**
 * Reads the question bank workbook into typed row arrays. Sheet-name
 * matching is case-insensitive since the current workbook mixes casing
 * conventions (QUESTIONS, drag_and_drop, HOTSPOTS, ...) - this does not fix
 * that inconsistency, just doesn't let it break reading the file.
 */
export function readWorkbook(filePath: string): WorkbookData {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Workbook not found at ${filePath}`);
  }
  const workbook = XLSX.readFile(filePath);

  const questionsSheet = findSheetName(workbook, ["questions"]);
  const optionsSheet = findSheetName(workbook, ["question_options"]);
  const matchingSheet = findSheetName(workbook, ["matching_pairs"]);
  const hotspotsSheet = findSheetName(workbook, ["hotspots"]);
  const dragDropSheet = findSheetName(workbook, ["drag_and_drop"]);
  const imagesSheet = findSheetName(workbook, ["question_images"]);

  return {
    sheetNames: workbook.SheetNames,
    questions: sheetToRows<QuestionRow>(workbook, questionsSheet),
    options: sheetToRows<OptionRow>(workbook, optionsSheet),
    matchingPairs: sheetToRows<MatchingPairRow>(workbook, matchingSheet),
    hotspots: sheetToRows<HotspotRow>(workbook, hotspotsSheet),
    dragDrop: sheetToRows<DragDropRow>(workbook, dragDropSheet),
    images: sheetToRows<ImageRow>(workbook, imagesSheet),
  };
}
