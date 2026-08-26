/**
 * Results/review reads for a COMPLETED practice session only. The score
 * summary never needs an answer-key table - is_correct is already a graded
 * snapshot on practice_session_questions (same precedent as
 * learning_assessment_attempt_answers.is_correct). The per-question review
 * (which reveals the correct answer/explanation) does need the answer-key
 * tables, so it goes through the service-role client - exactly the same
 * enrichment pattern the Sprint 5 admin review page uses - and ONLY after
 * confirming the session is both owned by the caller and already
 * completed/expired. Nothing here is reachable while a session is still
 * active.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PracticeResultsSummary, PracticeBreakdownEntry } from "@/features/practice/types/practice";
import type { AssessmentReviewListEntry, AssessmentReviewQuestionDetail } from "@/components/assessment/assessmentReviewTypes";

interface SessionRow {
  id: string;
  status: string;
  question_count: number;
  current_question_index: number;
  is_timed: boolean;
  duration_seconds: number | null;
  score: number | null;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  started_at: string;
  completed_at: string | null;
  filter_domain: PracticeResultsSummary["session"]["filters"]["domain"];
  filter_approach: PracticeResultsSummary["session"]["filters"]["approach"];
  filter_difficulty: PracticeResultsSummary["session"]["filters"]["difficulty"];
  filter_interaction_type: PracticeResultsSummary["session"]["filters"]["interactionType"];
  filter_answer_type: PracticeResultsSummary["session"]["filters"]["answerType"];
  language_preference: PracticeResultsSummary["session"]["filters"]["language"];
}

async function getOwnedCompletedSession(supabase: SupabaseClient, sessionId: string, userId: string): Promise<SessionRow | null> {
  const { data } = await supabase
    .from("practice_sessions")
    .select(
      "id, status, question_count, current_question_index, is_timed, duration_seconds, score, correct_count, incorrect_count, unanswered_count, started_at, completed_at, filter_domain, filter_approach, filter_difficulty, filter_interaction_type, filter_answer_type, language_preference"
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const row = data as SessionRow;
  if (row.status !== "completed" && row.status !== "expired") return null;
  return row;
}

function addToBreakdown(map: Map<string, PracticeBreakdownEntry>, label: string | null, isCorrect: boolean | null): void {
  const key = label ?? "Unspecified";
  const entry = map.get(key) ?? { label: key, total: 0, correct: 0 };
  entry.total += 1;
  if (isCorrect) entry.correct += 1;
  map.set(key, entry);
}

export async function getPracticeResultsSummary(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<PracticeResultsSummary | null> {
  const session = await getOwnedCompletedSession(supabase, sessionId, userId);
  if (!session) return null;

  const { data: rows } = await supabase
    .from("practice_session_questions")
    .select("question_id, is_correct, is_flagged, time_spent_seconds")
    .eq("session_id", sessionId);

  type Row = { question_id: string | null; is_correct: boolean | null; is_flagged: boolean; time_spent_seconds: number };
  const questionRows = (rows ?? []) as Row[];

  const questionIds = questionRows.filter((r) => r.question_id).map((r) => r.question_id as string);
  const { data: meta } = questionIds.length
    ? await supabase.from("questions").select("question_id, domain, approach, difficulty, interaction_type").in("question_id", questionIds)
    : { data: [] as { question_id: string; domain: string | null; approach: string | null; difficulty: string | null; interaction_type: string }[] };

  const metaByQuestionId = new Map(
    ((meta ?? []) as { question_id: string; domain: string | null; approach: string | null; difficulty: string | null; interaction_type: string }[]).map(
      (m) => [m.question_id, m]
    )
  );

  const byDomain = new Map<string, PracticeBreakdownEntry>();
  const byApproach = new Map<string, PracticeBreakdownEntry>();
  const byDifficulty = new Map<string, PracticeBreakdownEntry>();
  const byQuestionType = new Map<string, PracticeBreakdownEntry>();

  let totalTimeSpentSeconds = 0;
  let flaggedCount = 0;

  for (const row of questionRows) {
    totalTimeSpentSeconds += row.time_spent_seconds;
    if (row.is_flagged) flaggedCount += 1;

    const m = row.question_id ? metaByQuestionId.get(row.question_id) : undefined;
    addToBreakdown(byDomain, m?.domain ?? null, row.is_correct);
    addToBreakdown(byApproach, m?.approach ?? null, row.is_correct);
    addToBreakdown(byDifficulty, m?.difficulty ?? null, row.is_correct);
    addToBreakdown(byQuestionType, m?.interaction_type ?? null, row.is_correct);
  }

  const totalQuestions = questionRows.length;

  return {
    session: {
      id: session.id,
      status: session.status as PracticeResultsSummary["session"]["status"],
      filters: {
        domain: session.filter_domain,
        approach: session.filter_approach,
        difficulty: session.filter_difficulty,
        interactionType: session.filter_interaction_type,
        answerType: session.filter_answer_type,
        language: session.language_preference,
      },
      questionCount: session.question_count,
      currentQuestionIndex: session.current_question_index,
      isTimed: session.is_timed,
      durationSeconds: session.duration_seconds,
      score: session.score,
      correctCount: session.correct_count,
      incorrectCount: session.incorrect_count,
      unansweredCount: session.unanswered_count,
      startedAt: session.started_at,
      completedAt: session.completed_at,
    },
    totalTimeSpentSeconds,
    averageTimePerQuestionSeconds: totalQuestions > 0 ? Math.round(totalTimeSpentSeconds / totalQuestions) : 0,
    byDomain: Array.from(byDomain.values()),
    byApproach: Array.from(byApproach.values()),
    byDifficulty: Array.from(byDifficulty.values()),
    byQuestionType: Array.from(byQuestionType.values()),
    flaggedCount,
  };
}

/** Cheap review list for the compact grid + filter counts - no answer-key join, mirrors examResultsService.ts's getMockExamReviewList exactly. */
export async function getPracticeReviewList(supabase: SupabaseClient, sessionId: string, userId: string): Promise<AssessmentReviewListEntry[]> {
  const session = await getOwnedCompletedSession(supabase, sessionId, userId);
  if (!session) return [];

  const { data: rows } = await supabase
    .from("practice_session_questions")
    .select("question_id, sequence_number, response, is_correct, is_flagged")
    .eq("session_id", sessionId)
    .order("sequence_number", { ascending: true });

  type Row = { question_id: string | null; sequence_number: number; response: unknown; is_correct: boolean | null; is_flagged: boolean };
  return ((rows ?? []) as Row[]).map((r) => ({
    questionId: r.question_id,
    sequenceNumber: r.sequence_number,
    isCorrect: r.is_correct,
    isFlagged: r.is_flagged,
    hasResponse: r.response !== null,
  }));
}

/** Full answer-key-enriched review for exactly ONE question, fetched on-demand - mirrors examResultsService.ts's getMockExamReviewQuestionDetail exactly (same shared AssessmentReviewQuestionDetail shape, same enrichment queries), just scoped to practice_session_questions instead of mock_exam_attempt_questions. */
export async function getPracticeReviewQuestionDetail(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  questionId: string
): Promise<AssessmentReviewQuestionDetail | null> {
  const session = await getOwnedCompletedSession(supabase, sessionId, userId);
  if (!session) return null;

  const { data: sessionQuestionRow } = await supabase
    .from("practice_session_questions")
    .select("sequence_number, response, is_correct, is_flagged, time_spent_seconds")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .maybeSingle();
  if (!sessionQuestionRow) return null;

  const { data: question } = await supabase
    .from("questions")
    .select("question_id, question_text_en, question_text_ar, interaction_type, answer_type, domain, approach, difficulty, explanation_en, explanation_ar, explanation_structured")
    .eq("question_id", questionId)
    .maybeSingle();
  if (!question) return null;

  const [{ data: options }, { data: matchingItems }, { data: dragDropItems }, { data: images }] = await Promise.all([
    supabase.from("question_options").select("id, option_text_en, option_text_ar, feedback_en, feedback_ar, display_order").eq("question_id", questionId).order("display_order"),
    supabase.from("matching_items").select("id, side, text_en, text_ar, display_order").eq("question_id", questionId).order("display_order"),
    supabase.from("drag_and_drop_items").select("id, item_text_en, item_text_ar, category, display_order").eq("question_id", questionId).order("display_order"),
    supabase.from("question_images").select("image_path, image_alt_en, image_alt_ar").eq("question_id", questionId),
  ]);

  const optionRows = (options ?? []) as { id: string; option_text_en: string; option_text_ar: string | null; feedback_en: string | null; feedback_ar: string | null }[];
  const matchingRows = (matchingItems ?? []) as { id: string; side: "left" | "right"; text_en: string; text_ar: string | null }[];
  const dragDropRows = (dragDropItems ?? []) as { id: string; item_text_en: string; item_text_ar: string | null; category: string | null }[];
  const imageRows = (images ?? []) as { image_path: string; image_alt_en: string | null; image_alt_ar: string | null }[];

  const optionIds = optionRows.map((o) => o.id);
  const matchingItemIds = matchingRows.map((m) => m.id);
  const dragDropItemIds = dragDropRows.map((d) => d.id);

  const [{ data: answerKeyRows }, { data: matchingPairRows }, { data: positionRows }] = await Promise.all([
    optionIds.length
      ? supabaseAdmin.from("question_answer_key").select("option_id, is_correct").in("option_id", optionIds)
      : Promise.resolve({ data: [] as { option_id: string; is_correct: boolean }[] }),
    matchingItemIds.length
      ? supabaseAdmin.from("matching_answer_key").select("left_item_id, right_item_id").in("left_item_id", matchingItemIds)
      : Promise.resolve({ data: [] as { left_item_id: string; right_item_id: string }[] }),
    dragDropItemIds.length
      ? supabaseAdmin.from("drag_and_drop_answer_key").select("item_id, correct_position").in("item_id", dragDropItemIds)
      : Promise.resolve({ data: [] as { item_id: string; correct_position: number }[] }),
  ]);

  const correctByOptionId = new Map(((answerKeyRows ?? []) as { option_id: string; is_correct: boolean }[]).map((a) => [a.option_id, a.is_correct]));
  const correctRightIdByLeft = new Map(((matchingPairRows ?? []) as { left_item_id: string; right_item_id: string }[]).map((p) => [p.left_item_id, p.right_item_id]));
  const positionByItemId = new Map(((positionRows ?? []) as { item_id: string; correct_position: number }[]).map((p) => [p.item_id, p.correct_position]));

  type StructuredExplanation = {
    key_concept_en?: string; key_concept_ar?: string;
    exam_tip_en?: string; exam_tip_ar?: string;
    common_trap_en?: string; common_trap_ar?: string;
  } | null;
  const structured = question.explanation_structured as StructuredExplanation;
  const sq = sessionQuestionRow as { sequence_number: number; response: AssessmentReviewQuestionDetail["response"]; is_correct: boolean | null; is_flagged: boolean; time_spent_seconds: number };

  return {
    questionId,
    sequenceNumber: sq.sequence_number,
    questionTextEn: question.question_text_en,
    questionTextAr: question.question_text_ar,
    interactionType: question.interaction_type,
    answerType: question.answer_type,
    domain: question.domain,
    approach: question.approach,
    difficulty: question.difficulty,
    options: optionRows.map((o) => ({
      id: o.id,
      textEn: o.option_text_en,
      textAr: o.option_text_ar,
      isCorrect: correctByOptionId.get(o.id) ?? false,
      feedbackEn: o.feedback_en,
      feedbackAr: o.feedback_ar,
    })),
    matchingLeft: matchingRows.filter((m) => m.side === "left").map((m) => ({ id: m.id, textEn: m.text_en, textAr: m.text_ar })),
    matchingRight: matchingRows.filter((m) => m.side === "right").map((m) => ({ id: m.id, textEn: m.text_en, textAr: m.text_ar })),
    matchingCorrectRightIdByLeft: Object.fromEntries(matchingRows.filter((m) => m.side === "left").map((m) => [m.id, correctRightIdByLeft.get(m.id) ?? ""])),
    dragDropItems: dragDropRows.map((d) => ({ id: d.id, textEn: d.item_text_en, textAr: d.item_text_ar, category: d.category, correctPosition: positionByItemId.get(d.id) ?? null })),
    images: imageRows.map((i) => ({ imagePath: i.image_path, altEn: i.image_alt_en, altAr: i.image_alt_ar })),
    explanationEn: question.explanation_en,
    explanationAr: question.explanation_ar,
    explanationExtras: structured
      ? {
          keyConceptEn: structured.key_concept_en ?? null,
          keyConceptAr: structured.key_concept_ar ?? null,
          examTipEn: structured.exam_tip_en ?? null,
          examTipAr: structured.exam_tip_ar ?? null,
          commonTrapEn: structured.common_trap_en ?? null,
          commonTrapAr: structured.common_trap_ar ?? null,
        }
      : null,
    response: sq.response,
    isCorrect: sq.is_correct,
    isFlagged: sq.is_flagged,
    timeSpentSeconds: sq.time_spent_seconds,
  };
}
