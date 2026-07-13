export type Severity = "error" | "warning";

export interface ValidationIssue {
  severity: Severity;
  /** Short machine-readable code, e.g. "MISSING_SHEET", "DUPLICATE_QUESTION_ID". */
  code: string;
  message: string;
  sheet: string;
  questionId?: string;
  /** Sub-row reference within the question, e.g. option_key, hotspot_id, pair_id, item_id, image_id. */
  ref?: string;
}

export interface QuestionRow {
  question_id: string;
  certification: string;
  eco_version: string;
  interaction_type: string;
  answer_type: string;
  question_text_en: string;
  question_text_ar: string;
  source: string;
  domain: string;
  task: string;
  topic: string;
  subtopic: string;
  approach: string;
  difficulty: string;
  cognitive_level: string;
  assessment_type: string;
  original_language: string;
  translation_verified: string;
  status: string;
  tags: string;
  notes: string;
  reviewed_by: string;
  has_image: string;
  image_path: string;
  explanation_en: string;
  explanation_ar: string;
}

export interface OptionRow {
  question_id: string;
  option_key: string;
  option_text_en: string;
  option_text_ar: string;
  display_order: string;
  is_correct: string;
  feedback_en: string;
  feedback_ar: string;
}

export interface MatchingPairRow {
  question_id: string;
  pair_id: string;
  left_text_en: string;
  left_text_ar: string;
  right_text_en: string;
  right_text_ar: string;
  display_order: string;
}

export interface HotspotRow {
  question_id: string;
  hotspot_id: string;
  x: string;
  y: string;
  width: string;
  height: string;
  label: string;
}

export interface DragDropRow {
  question_id: string;
  item_id: string;
  item_text_en: string;
  item_text_ar: string;
  correct_position: string;
  category: string;
}

export interface ImageRow {
  question_id: string;
  image_id: string;
  image_path: string;
  image_alt_en: string;
  image_alt_ar: string;
  display_order: string;
}

export interface WorkbookData {
  /** Actual sheet names as found in the file (for the sheet-existence check). */
  sheetNames: string[];
  questions: QuestionRow[];
  options: OptionRow[];
  matchingPairs: MatchingPairRow[];
  hotspots: HotspotRow[];
  dragDrop: DragDropRow[];
  images: ImageRow[];
}

export interface ValidationReport {
  issues: ValidationIssue[];
  summary: {
    totalQuestions: number;
    errorCount: number;
    warningCount: number;
    questionsWithErrors: number;
    questionsWithWarnings: number;
    /** 0-100. See validate.ts for the formula. */
    healthScore: number;
  };
}

// ============================================================================
// Import pipeline types (Sprint 4)
// ============================================================================

/** Not persisted to production tables - carried through the importer process
 * and surfaced in the import report only, per instruction. */
export interface ImportBatchMetadata {
  batchId: string;
  sourceFile: string;
  importedBy: string;
  importedAt: string; // ISO 8601
}

export interface RejectedQuestion {
  questionId: string;
  /** Validation rule code, or a synthetic code like STATUS_NOT_APPROVED / RPC_IMPORT_FAILED. */
  rule: string;
  severity: Severity;
  reason: string;
}

export interface ImportedQuestion {
  questionId: string;
  interactionType: string;
}

export interface ImportReport {
  batch: ImportBatchMetadata;
  validation: ValidationReport["summary"];
  imported: ImportedQuestion[];
  rejected: RejectedQuestion[];
  statistics: {
    totalQuestions: number;
    importedCount: number;
    rejectedCount: number;
    byInteractionType: Record<string, number>;
  };
}
