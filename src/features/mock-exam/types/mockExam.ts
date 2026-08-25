import type { QuizQuestion, QuizSubmitAnswer } from "@/features/courses/types/course";
import type { PmpDomain, PmpApproach, PmpDifficulty } from "@/features/mock-exam/config/examBlueprint";

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

export type MockExamReviewFilter = "all" | "incorrect" | "unanswered" | "correct" | "flagged";

export interface MockExamReviewOption {
  id: string;
  textEn: string;
  textAr: string | null;
  isCorrect: boolean;
}

export interface MockExamReviewQuestion {
  questionId: string | null;
  sequenceNumber: number;
  questionTextEn: string;
  questionTextAr: string | null;
  interactionType: string;
  answerType: string;
  domain: PmpDomain | null;
  approach: PmpApproach | null;
  difficulty: PmpDifficulty | null;
  options: MockExamReviewOption[];
  matchingLeft: { id: string; textEn: string; textAr: string | null }[];
  matchingRight: { id: string; textEn: string; textAr: string | null }[];
  matchingCorrectRightIdByLeft: Record<string, string>;
  dragDropItems: { id: string; textEn: string; textAr: string | null; category: string | null; correctPosition: number | null }[];
  images: { imagePath: string; altEn: string | null; altAr: string | null }[];
  explanationEn: string | null;
  explanationAr: string | null;
  response: QuizSubmitAnswer | null;
  isCorrect: boolean | null;
  isFlagged: boolean;
  timeSpentSeconds: number;
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
}
