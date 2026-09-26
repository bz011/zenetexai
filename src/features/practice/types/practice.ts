import type {
  QuizQuestion,
  QuizSubmitAnswer,
  QuizOption,
  QuizMatchingItem,
  QuizDragDropItem,
  QuizImage,
  QuestionInteractionTypeValue,
  QuestionAnswerTypeValue,
} from "@/features/courses/types/course";

// Mirrors migrations/007's enums exactly - kept as plain string literal
// unions here rather than re-generating from the DB, same convention the
// rest of this codebase already uses for Supabase row shapes.
export type QuestionDomainValue = "People" | "Process" | "Business Environment";
export type QuestionApproachValue = "Predictive" | "Agile" | "Hybrid" | "Mixed";
export type QuestionDifficultyValue = "Easy" | "Moderate" | "Difficult" | "Expert";

export type PracticeSessionStatus = "active" | "completed" | "abandoned" | "expired";
export type PracticeLanguage = "en" | "ar" | "bilingual";
export type PracticeQuestionCount = 5 | 10 | 20 | 30 | 50;

export interface PracticeFilters {
  domain: QuestionDomainValue | null;
  approach: QuestionApproachValue | null;
  difficulty: QuestionDifficultyValue | null;
  interactionType: QuestionInteractionTypeValue | null;
  answerType: QuestionAnswerTypeValue | null;
  language: PracticeLanguage;
}

export interface PracticeConfig extends PracticeFilters {
  questionCount: PracticeQuestionCount;
  isTimed: boolean;
  /** Seconds per question, applies only when isTimed and customDurationMinutes is not set. */
  secondsPerQuestion?: 60 | 78;
  /** Total session duration in minutes, overrides secondsPerQuestion when set. */
  customDurationMinutes?: number;
}

export interface PracticeSession {
  id: string;
  status: PracticeSessionStatus;
  filters: PracticeFilters;
  questionCount: number;
  currentQuestionIndex: number;
  isTimed: boolean;
  durationSeconds: number | null;
  score: number | null;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  startedAt: string;
  completedAt: string | null;
}

export interface PracticeSessionQuestionState {
  questionId: string | null;
  sequenceNumber: number;
  response: QuizSubmitAnswer | null;
  isCorrect: boolean | null;
  isFlagged: boolean;
  answeredAt: string | null;
  timeSpentSeconds: number;
}

export interface PracticeRunnerData {
  session: PracticeSession;
  /** In fixed sequence order; a null entry means that sequence slot's question was later deleted. */
  questions: (QuizQuestion | null)[];
  questionStates: PracticeSessionQuestionState[];
  /** Computed fresh server-side at read time - never trust a client-held countdown alone. */
  serverRemainingSeconds: number | null;
}

export interface PracticeBreakdownEntry {
  label: string;
  total: number;
  correct: number;
}

export interface PracticeResultsSummary {
  session: PracticeSession;
  totalTimeSpentSeconds: number;
  averageTimePerQuestionSeconds: number;
  byDomain: PracticeBreakdownEntry[];
  byApproach: PracticeBreakdownEntry[];
  byDifficulty: PracticeBreakdownEntry[];
  byQuestionType: PracticeBreakdownEntry[];
  flaggedCount: number;
}

export interface PracticeHistoryEntry {
  id: string;
  status: PracticeSessionStatus;
  questionCount: number;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  filters: PracticeFilters;
}

export interface CreatePracticeSessionResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}
