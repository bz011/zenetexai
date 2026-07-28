/**
 * Practice session grading - reuses gradeQuizAnswer (quizGradingService.ts)
 * directly, the exact same per-type comparison functions the Learning Quiz
 * submit route uses. Practice questions are always source="bank" (practice
 * never draws from the legacy learning_assessment_questions path), and the
 * authoritative interaction_type is always re-read from `questions` here,
 * never trusted from anywhere else.
 *
 * Idempotent by construction: a session already in a terminal status
 * (completed/expired) is never re-graded - calling this again just returns
 * success without touching scores a second time, so a duplicate submit
 * (double-click, retry after a flaky network response) can never change a
 * result that was already recorded.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { gradeQuizAnswer } from "@/features/courses/services/quizGradingService";
import type { QuizSubmitAnswer, QuestionInteractionTypeValue } from "@/features/courses/types/course";

export interface SubmitPracticeSessionResult {
  success: boolean;
  error?: string;
  alreadyGraded?: boolean;
}

interface SessionQuestionRow {
  id: string;
  question_id: string | null;
  response: QuizSubmitAnswer | null;
}

export async function submitPracticeSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  reason: "manual" | "expired" = "manual"
): Promise<SubmitPracticeSessionResult> {
  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, status, user_id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!session) {
    return { success: false, error: "Session not found" };
  }

  // Idempotency guard: a terminal session is never re-graded, so a
  // duplicate submit call (double-click, retried request, the expiry check
  // racing a manual submit) can never change an already-recorded result.
  if (session.status === "completed" || session.status === "expired") {
    return { success: true, alreadyGraded: true };
  }

  const { data: rows } = await supabase
    .from("practice_session_questions")
    .select("id, question_id, response")
    .eq("session_id", sessionId);

  const sessionQuestions = (rows ?? []) as SessionQuestionRow[];

  const questionIds = sessionQuestions.filter((r) => r.question_id).map((r) => r.question_id as string);
  const { data: questionMeta } = questionIds.length
    ? await supabase.from("questions").select("question_id, interaction_type").in("question_id", questionIds)
    : { data: [] as { question_id: string; interaction_type: QuestionInteractionTypeValue }[] };

  const interactionTypeByQuestionId = new Map(
    ((questionMeta ?? []) as { question_id: string; interaction_type: QuestionInteractionTypeValue }[]).map((q) => [
      q.question_id,
      q.interaction_type,
    ])
  );

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const gradedUpdates: { id: string; is_correct: boolean }[] = [];

  // Each question's grading is independent (own DB read inside
  // gradeQuizAnswer), so grading them concurrently rather than one at a
  // time in a sequential for-loop turns N sequential round-trips into one
  // batch - this was the primary cause of slow practice-submission latency.
  const outcomes = await Promise.all(
    sessionQuestions.map(async (row) => {
      // A deleted question (question_id null) or a question never answered
      // is unanswered - never graded as incorrect, matching "unanswered" as
      // its own distinct outcome per the results breakdown requirement.
      if (!row.question_id || !row.response) {
        return { kind: "unanswered" as const };
      }

      const interactionType = interactionTypeByQuestionId.get(row.question_id);
      if (!interactionType) {
        return { kind: "unanswered" as const };
      }

      const isCorrect = await gradeQuizAnswer(
        supabaseAdmin,
        { id: row.question_id, source: "bank", interactionType },
        row.response
      );
      return { kind: "graded" as const, id: row.id, isCorrect };
    })
  );

  for (const outcome of outcomes) {
    if (outcome.kind === "unanswered") {
      unansweredCount += 1;
      continue;
    }
    gradedUpdates.push({ id: outcome.id, is_correct: outcome.isCorrect });
    if (outcome.isCorrect) correctCount += 1;
    else incorrectCount += 1;
  }

  await Promise.all(
    gradedUpdates.map((u) => supabase.from("practice_session_questions").update({ is_correct: u.is_correct }).eq("id", u.id))
  );

  const totalQuestions = sessionQuestions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const { error: updateError } = await supabase
    .from("practice_sessions")
    .update({
      status: reason === "expired" ? "expired" : "completed",
      completed_at: new Date().toISOString(),
      score,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
      remaining_seconds: 0,
    })
    .eq("id", sessionId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
