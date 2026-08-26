import type { QuizSubmitAnswer } from "@/features/courses/types/course";

/**
 * Shared review-detail shape for BOTH Practice Mode and Mock Exam results
 * (Sprint 9.1 item 5 - "apply the same UX principle to Practice Results...
 * use the same professional review language and interaction model" - one
 * type/component set, not two parallel implementations). Produced by
 * examResultsService.ts's and practiceResultsService.ts's respective
 * getXReviewQuestionDetail() - fetched LAZILY, one question at a time, not
 * eagerly for an entire filtered list (item 9's performance requirement).
 */

export type AssessmentReviewFilter = "all" | "incorrect" | "correct" | "unanswered" | "flagged";

/** Cheap, no-answer-key-join summary of every question in an attempt/session - enough to render the compact grid + filter counts without ever touching an answer-key table. */
export interface AssessmentReviewListEntry {
  questionId: string | null;
  sequenceNumber: number;
  isCorrect: boolean | null;
  isFlagged: boolean;
  hasResponse: boolean;
}

export interface AssessmentReviewOption {
  id: string;
  textEn: string;
  textAr: string | null;
  isCorrect: boolean;
  /** "why this alternative is wrong" (or right) - question_options.feedback_en/ar, migration 007. Null when the content author never wrote one. */
  feedbackEn: string | null;
  feedbackAr: string | null;
}

/** AI Question Factory structured teaching content (questions.explanation_structured, migration 014) - null for workbook-imported/legacy questions that predate it. */
export interface AssessmentExplanationExtras {
  keyConceptEn: string | null;
  keyConceptAr: string | null;
  examTipEn: string | null;
  examTipAr: string | null;
  commonTrapEn: string | null;
  commonTrapAr: string | null;
}

export interface AssessmentReviewQuestionDetail {
  questionId: string;
  sequenceNumber: number;
  questionTextEn: string;
  questionTextAr: string | null;
  interactionType: string;
  answerType: string;
  domain: string | null;
  approach: string | null;
  difficulty: string | null;
  options: AssessmentReviewOption[];
  matchingLeft: { id: string; textEn: string; textAr: string | null }[];
  matchingRight: { id: string; textEn: string; textAr: string | null }[];
  matchingCorrectRightIdByLeft: Record<string, string>;
  dragDropItems: { id: string; textEn: string; textAr: string | null; category: string | null; correctPosition: number | null }[];
  images: { imagePath: string; altEn: string | null; altAr: string | null }[];
  explanationEn: string | null;
  explanationAr: string | null;
  explanationExtras: AssessmentExplanationExtras | null;
  response: QuizSubmitAnswer | null;
  isCorrect: boolean | null;
  isFlagged: boolean;
  timeSpentSeconds: number;
}
