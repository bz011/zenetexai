import type { QuizQuestion, QuizSubmitAnswer } from "@/features/courses/types/course";

export type MockExamAttemptStatus = "active" | "on_break" | "completed" | "expired" | "abandoned";

export interface MockExamAttempt {
  id: string;
  status: MockExamAttemptStatus;
  blueprintVersion: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  durationSeconds: number;
  onBreak: boolean;
  breakStartedAt: string | null;
  currentSection: number;
  breaksTaken: number[];
  sectionsLocked: number[];
  score: number | null;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  startedAt: string;
  completedAt: string | null;
  /** Sprint 9.1 item 7A - set only for a Retake Same Exam attempt. */
  retakeOfAttemptId: string | null;
  /** Denormalized top-most ancestor - equals this attempt's own id when it is NOT a retake. */
  rootAttemptId: string | null;
}

export interface MockExamAttemptQuestionState {
  questionId: string | null;
  sequenceNumber: number;
  sectionNumber: number;
  response: QuizSubmitAnswer | null;
  isCorrect: boolean | null;
  isFlagged: boolean;
  answeredAt: string | null;
  timeSpentSeconds: number;
}

export interface MockExamRunnerData {
  attempt: MockExamAttempt;
  questions: (QuizQuestion | null)[];
  questionStates: MockExamAttemptQuestionState[];
  /** Server-authoritative - null once the attempt is no longer active/on_break. */
  serverRemainingSeconds: number | null;
  /** Seconds remaining in the CURRENT break, only meaningful when attempt.onBreak is true. */
  serverBreakRemainingSeconds: number | null;
}

export interface CreateMockExamAttemptResult {
  success: boolean;
  attemptId?: string;
  error?: string;
}

export interface MockExamBreakdownEntry {
  label: string;
  total: number;
  correct: number;
}

export interface MockExamResultsSummary {
  attempt: MockExamAttempt;
  totalTimeSpentSeconds: number;
  averageTimePerQuestionSeconds: number;
  byDomain: MockExamBreakdownEntry[];
  byApproach: MockExamBreakdownEntry[];
  byDifficulty: MockExamBreakdownEntry[];
  byQuestionType: MockExamBreakdownEntry[];
  byTopic: MockExamBreakdownEntry[];
  flaggedCount: number;
}

export interface MockExamHistoryEntry {
  id: string;
  status: MockExamAttemptStatus;
  blueprintVersion: string;
  totalQuestions: number;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  retakeOfAttemptId: string | null;
  rootAttemptId: string | null;
}

/** Sprint 9.1 item 7A - a simple before/after comparison shown after a same-exam retake, deliberately not longitudinal analytics. */
export interface MockExamRetakeComparison {
  previousScore: number | null;
  currentScore: number | null;
  previousCorrectCount: number;
  currentCorrectCount: number;
  previousTotalTimeSpentSeconds: number;
  currentTotalTimeSpentSeconds: number;
  byDomain: { label: string; previousCorrect: number; currentCorrect: number; total: number }[];
}
