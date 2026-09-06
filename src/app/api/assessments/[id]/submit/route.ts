/**
 * Grading route for Learning Checkpoints / Module Assessments.
 *
 * SECURITY-SENSITIVE: this is the only place in the app allowed to read any
 * answer-key table (question_answer_key, matching_answer_key,
 * drag_and_drop_answer_key, hotspots, learning_assessment_answer_key — RLS
 * blocks all of these for every other role). Uses the least privilege for
 * each step:
 *   - identifies the caller and reads/writes their own attempt via the
 *     normal RLS-respecting server client
 *   - uses the service-role client ONLY inside quizGradingService, for the
 *     queries that need to bypass RLS to check correctness
 *
 * Supports both legacy (learning_assessment_questions) and bank-linked
 * (learning_assessment_question_links → questions) assessments via the
 * unified QuizQuestion/quizGradingService path — see quizService.ts.
 *
 * Never returns the answer key itself — only per-question correct/incorrect
 * booleans and (post-submission) explanation text.
 */

import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/upstashRateLimit";
import { quizSubmitSchema } from "@/lib/validators/courseValidators";
import { getQuizQuestions } from "@/features/courses/services/quizService";
import { gradeQuizAnswer } from "@/features/courses/services/quizGradingService";
import type { QuizQuestionResult, QuizSubmitResult } from "@/features/courses/types/course";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await params;

  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkRateLimit("assessment-submit", user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many submissions. Please wait a moment and try again." },
      { status: 429, headers: limit.retryAfterSeconds ? { "Retry-After": String(limit.retryAfterSeconds) } : undefined }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = quizSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid submission" }, { status: 400 });
  }

  // RLS-respecting read: confirms the assessment exists and is accessible
  // to this user (published, or admin/instructor) before grading it.
  const { data: assessment, error: assessmentError } = await supabase
    .from("learning_assessments")
    .select("id, passing_score")
    .eq("id", assessmentId)
    .single();

  if (assessmentError || !assessment) {
    return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
  }

  // Real question set for this assessment — submitted answers for any other
  // question/assessment are ignored rather than trusted. This also supplies
  // the AUTHORITATIVE interaction_type/source per question, so a client can
  // never relabel a question to dodge its real grading path.
  const questions = await getQuizQuestions(supabase, assessmentId);
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const relevantAnswers = parsed.data.answers.filter((a) => questionById.has(a.questionId));

  // Explanations are only ever surfaced here, after grading — never in the
  // pre-submission question payload (quizService.ts deliberately omits them).
  const isBank = questions.some((q) => q.source === "bank");
  const isLegacy = questions.some((q) => q.source === "legacy");
  const [{ data: bankExplanations }, { data: legacyExplanations }] = await Promise.all([
    isBank
      ? supabase.from("questions").select("question_id, explanation_en, explanation_ar").in(
          "question_id",
          questions.filter((q) => q.source === "bank").map((q) => q.id)
        )
      : Promise.resolve({ data: [] as { question_id: string; explanation_en: string | null; explanation_ar: string | null }[] }),
    isLegacy
      ? supabase.from("learning_assessment_questions").select("id, explanation_en, explanation_ar").in(
          "id",
          questions.filter((q) => q.source === "legacy").map((q) => q.id)
        )
      : Promise.resolve({ data: [] as { id: string; explanation_en: string | null; explanation_ar: string | null }[] }),
  ]);

  const explanationByQuestionId = new Map<string, { en: string | null; ar: string | null }>();
  for (const row of bankExplanations ?? []) {
    explanationByQuestionId.set(row.question_id, { en: row.explanation_en, ar: row.explanation_ar });
  }
  for (const row of legacyExplanations ?? []) {
    explanationByQuestionId.set(row.id, { en: row.explanation_en, ar: row.explanation_ar });
  }

  // Each question's grading is independent, so grade them concurrently
  // rather than one at a time - Promise.all preserves the input order
  // regardless of completion order, so `results` still lines up with
  // `questions` exactly as the sequential loop did.
  const results: QuizQuestionResult[] = await Promise.all(
    questions.map(async (question) => {
      const answer = relevantAnswers.find((a) => a.questionId === question.id);
      const isCorrect = answer
        ? await gradeQuizAnswer(supabaseAdmin, { id: question.id, source: question.source, interactionType: question.interactionType }, answer)
        : false;

      const explanation = explanationByQuestionId.get(question.id) ?? { en: null, ar: null };
      return {
        questionId: question.id,
        isCorrect,
        explanationEn: explanation.en,
        explanationAr: explanation.ar,
      };
    })
  );
  const correctCount = results.filter((r) => r.isCorrect).length;

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= assessment.passing_score;

  // Writes use the normal RLS-respecting client — the RLS policy's
  // WITH CHECK (user_id = auth.uid()) is the backstop here, not just this
  // route's own logic.
  const { data: attempt, error: attemptError } = await supabase
    .from("learning_assessment_attempts")
    .insert({
      assessment_id: assessmentId,
      user_id: user.id,
      score,
      passed,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ success: false, error: "Failed to save attempt" }, { status: 500 });
  }

  const attemptAnswerRows = results.map((result) => {
    const answer = relevantAnswers.find((a) => a.questionId === result.questionId);
    const question = questionById.get(result.questionId)!;
    const singleSelectedOptionId =
      question.source === "legacy" && answer?.selectedOptionIds?.length === 1 ? answer.selectedOptionIds[0] : null;

    return {
      attempt_id: attempt.id,
      question_id: question.source === "legacy" ? result.questionId : null,
      question_bank_question_id: question.source === "bank" ? result.questionId : null,
      selected_option_id: singleSelectedOptionId,
      response: answer ?? null,
      is_correct: result.isCorrect,
    };
  });

  if (attemptAnswerRows.length > 0) {
    await supabase.from("learning_assessment_attempt_answers").insert(attemptAnswerRows);
  }

  const response: QuizSubmitResult = {
    success: true,
    attemptId: attempt.id,
    score,
    passed,
    results,
  };
  return NextResponse.json(response);
}
