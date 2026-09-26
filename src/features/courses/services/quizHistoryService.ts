/**
 * Read-only history of a student's own past learning-quiz attempts.
 * Distinct from any future Mock Exam history — this only ever reads
 * learning_assessment_attempts/attempt_answers (migration 006/009), nothing
 * exam-related. Attempts are stored permanently; nothing here deletes them.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getQuizQuestions } from "@/features/courses/services/quizService";
import type { QuizAttemptDetail, QuizAttemptSummary } from "@/features/courses/types/course";

export async function getQuizAttempts(
  supabase: SupabaseClient,
  userId: string,
  assessmentId: string
): Promise<QuizAttemptSummary[]> {
  const { data } = await supabase
    .from("learning_assessment_attempts")
    .select("id, assessment_id, score, passed, completed_at")
    .eq("assessment_id", assessmentId)
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  return ((data ?? []) as { id: string; assessment_id: string; score: number; passed: boolean; completed_at: string }[]).map((a) => ({
    id: a.id,
    assessmentId: a.assessment_id,
    score: a.score,
    passed: a.passed,
    completedAt: a.completed_at,
  }));
}

export async function getQuizAttemptDetail(
  supabase: SupabaseClient,
  userId: string,
  attemptId: string
): Promise<QuizAttemptDetail | null> {
  const { data: attempt } = await supabase
    .from("learning_assessment_attempts")
    .select("id, assessment_id, score, passed, completed_at, user_id")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.user_id !== userId) return null;

  const { data: answers } = await supabase
    .from("learning_assessment_attempt_answers")
    .select("question_id, question_bank_question_id, response, is_correct")
    .eq("attempt_id", attemptId);

  type AnswerRow = { question_id: string | null; question_bank_question_id: string | null; response: unknown; is_correct: boolean };
  const answerRows = (answers ?? []) as AnswerRow[];
  const answerByQuestionId = new Map(answerRows.map((a) => [a.question_id ?? a.question_bank_question_id ?? "", a]));

  // Explanations aren't stored on the attempt_answers row - reuse the same
  // live question fetch the submit route used, matching by id. If content
  // was later removed from the assessment, that question is simply absent
  // from this review (a documented, accepted limitation for Sprint 6).
  const liveQuestions = await getQuizQuestions(supabase, attempt.assessment_id);
  const isBank = liveQuestions.some((q) => q.source === "bank");
  const isLegacy = liveQuestions.some((q) => q.source === "legacy");
  const [{ data: bankExplanations }, { data: legacyExplanations }] = await Promise.all([
    isBank
      ? supabase.from("questions").select("question_id, explanation_en, explanation_ar").in(
          "question_id",
          liveQuestions.filter((q) => q.source === "bank").map((q) => q.id)
        )
      : Promise.resolve({ data: [] as { question_id: string; explanation_en: string | null; explanation_ar: string | null }[] }),
    isLegacy
      ? supabase.from("learning_assessment_questions").select("id, explanation_en, explanation_ar").in(
          "id",
          liveQuestions.filter((q) => q.source === "legacy").map((q) => q.id)
        )
      : Promise.resolve({ data: [] as { id: string; explanation_en: string | null; explanation_ar: string | null }[] }),
  ]);
  const explanationByQuestionId = new Map<string, { en: string | null; ar: string | null }>();
  for (const row of bankExplanations ?? []) explanationByQuestionId.set(row.question_id, { en: row.explanation_en, ar: row.explanation_ar });
  for (const row of legacyExplanations ?? []) explanationByQuestionId.set(row.id, { en: row.explanation_en, ar: row.explanation_ar });

  return {
    id: attempt.id,
    assessmentId: attempt.assessment_id,
    score: attempt.score,
    passed: attempt.passed,
    completedAt: attempt.completed_at,
    questions: liveQuestions.map((q) => {
      const answer = answerByQuestionId.get(q.id);
      const explanation = explanationByQuestionId.get(q.id) ?? { en: null, ar: null };
      return {
        ...q,
        response: (answer?.response as QuizAttemptDetail["questions"][number]["response"]) ?? null,
        result: {
          questionId: q.id,
          isCorrect: answer?.is_correct ?? false,
          explanationEn: explanation.en,
          explanationAr: explanation.ar,
        },
      };
    }),
  };
}
