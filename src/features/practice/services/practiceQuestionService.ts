/**
 * Reads a practice session's fixed-order question list, reusing the exact
 * same bank-question fetch/shape (getBankQuestions) the Learning Quiz path
 * uses - one implementation, two callers. Never touches an answer-key
 * table; correctness for already-answered questions comes only from the
 * is_correct snapshot already stored on practice_session_questions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBankQuestions } from "@/features/courses/services/quizService";
import type { QuizQuestion, QuizSubmitAnswer } from "@/features/courses/types/course";
import type { PracticeSessionQuestionState } from "@/features/practice/types/practice";

interface SessionQuestionRow {
  question_id: string | null;
  sequence_number: number;
  response: QuizSubmitAnswer | null;
  is_correct: boolean | null;
  is_flagged: boolean;
  answered_at: string | null;
  time_spent_seconds: number;
}

export async function getSessionQuestionsAndStates(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ questions: (QuizQuestion | null)[]; states: PracticeSessionQuestionState[] }> {
  const { data } = await supabase
    .from("practice_session_questions")
    .select("question_id, sequence_number, response, is_correct, is_flagged, answered_at, time_spent_seconds")
    .eq("session_id", sessionId)
    .order("sequence_number", { ascending: true });

  const rows = (data ?? []) as SessionQuestionRow[];

  const bankLinks = rows
    .filter((r): r is SessionQuestionRow & { question_id: string } => r.question_id !== null)
    .map((r) => ({ question_id: r.question_id, order_index: r.sequence_number }));

  const bankQuestions = bankLinks.length ? await getBankQuestions(supabase, bankLinks) : [];
  const questionById = new Map(bankQuestions.map((q) => [q.id, q]));

  const questions = rows.map((r) => (r.question_id ? questionById.get(r.question_id) ?? null : null));

  const states: PracticeSessionQuestionState[] = rows.map((r) => ({
    questionId: r.question_id,
    sequenceNumber: r.sequence_number,
    response: r.response,
    isCorrect: r.is_correct,
    isFlagged: r.is_flagged,
    answeredAt: r.answered_at,
    timeSpentSeconds: r.time_spent_seconds,
  }));

  return { questions, states };
}
