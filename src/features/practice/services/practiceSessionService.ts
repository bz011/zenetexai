"use server";

/**
 * Practice session lifecycle: create, read (with server-authoritative
 * timer-expiry handling), and per-question autosave (answer/index/flag).
 * Every action re-derives the caller's own user_id via requireUser() and
 * scopes every query to it explicitly, in addition to RLS - the same
 * "app-level check + RLS backstop" pattern used throughout this project.
 */

import { requireUser } from "@/lib/auth/requireRole";
import { getCertificationId, getEligibleQuestionCount } from "@/features/practice/services/practiceConfigService";
import { getSessionQuestionsAndStates } from "@/features/practice/services/practiceQuestionService";
import { submitPracticeSession } from "@/features/practice/services/practiceGradingService";
import { computeRemainingSeconds, isSessionExpired, resolveDurationSeconds } from "@/features/practice/services/practiceTimerUtils";
import type {
  PracticeConfig,
  PracticeFilters,
  PracticeSession,
  PracticeRunnerData,
  CreatePracticeSessionResult,
} from "@/features/practice/types/practice";
import type { QuizSubmitAnswer } from "@/features/courses/types/course";

/** Client-callable wrapper around getEligibleQuestionCount - the config page re-checks this as filters change, before allowing Start. */
export async function checkEligibleQuestionCount(filters: PracticeFilters): Promise<number> {
  const { supabase } = await requireUser();
  const certificationId = await getCertificationId(supabase, "PMP");
  if (!certificationId) return 0;
  return getEligibleQuestionCount(supabase, certificationId, filters);
}

export async function createPracticeSession(config: PracticeConfig): Promise<CreatePracticeSessionResult> {
  const { supabase } = await requireUser();

  const certificationId = await getCertificationId(supabase, "PMP");
  if (!certificationId) {
    return { success: false, error: "Certification not found" };
  }

  const durationSeconds = resolveDurationSeconds(config);

  const { data, error } = await supabase.rpc("create_practice_session", {
    p_certification_id: certificationId,
    p_domain: config.domain,
    p_approach: config.approach,
    p_difficulty: config.difficulty,
    p_interaction_type: config.interactionType,
    p_answer_type: config.answerType,
    p_language: config.language,
    p_question_count: config.questionCount,
    p_is_timed: config.isTimed,
    p_duration_seconds: durationSeconds,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; session_id?: string; error?: string; available?: number };
  if (!result?.success) {
    return {
      success: false,
      error:
        result?.error === "not_enough_eligible_questions"
          ? `Only ${result.available ?? 0} question(s) match these filters.`
          : result?.error ?? "Failed to create practice session",
    };
  }

  return { success: true, sessionId: result.session_id };
}

interface SessionRow {
  id: string;
  status: PracticeSession["status"];
  filter_domain: PracticeSession["filters"]["domain"];
  filter_approach: PracticeSession["filters"]["approach"];
  filter_difficulty: PracticeSession["filters"]["difficulty"];
  filter_interaction_type: PracticeSession["filters"]["interactionType"];
  filter_answer_type: PracticeSession["filters"]["answerType"];
  language_preference: PracticeSession["filters"]["language"];
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
}

function mapSessionRow(row: SessionRow): PracticeSession {
  return {
    id: row.id,
    status: row.status,
    filters: {
      domain: row.filter_domain,
      approach: row.filter_approach,
      difficulty: row.filter_difficulty,
      interactionType: row.filter_interaction_type,
      answerType: row.filter_answer_type,
      language: row.language_preference,
    },
    questionCount: row.question_count,
    currentQuestionIndex: row.current_question_index,
    isTimed: row.is_timed,
    durationSeconds: row.duration_seconds,
    score: row.score,
    correctCount: row.correct_count,
    incorrectCount: row.incorrect_count,
    unansweredCount: row.unanswered_count,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

/**
 * Reads a session for the runner, computing remaining time fresh from
 * started_at/duration_seconds server-side (never trusting a client-held
 * countdown). If a timed session's time has genuinely run out, this
 * triggers the exact same grading path a manual submit uses before
 * returning - so simply reloading an expired session's page is enough to
 * resolve it, matching "automatic submission at zero".
 */
export async function getPracticeSession(sessionId: string): Promise<PracticeRunnerData | null> {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("practice_sessions")
    .select(
      "id, status, filter_domain, filter_approach, filter_difficulty, filter_interaction_type, filter_answer_type, language_preference, question_count, current_question_index, is_timed, duration_seconds, score, correct_count, incorrect_count, unanswered_count, started_at, completed_at"
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  let session = mapSessionRow(data as SessionRow);

  let serverRemainingSeconds: number | null = null;
  if (session.isTimed && session.durationSeconds !== null) {
    serverRemainingSeconds = computeRemainingSeconds(session.startedAt, session.durationSeconds);

    if (session.status === "active" && serverRemainingSeconds <= 0) {
      await submitPracticeSession(supabase, sessionId, user.id, "expired");
      const { data: refreshed } = await supabase
        .from("practice_sessions")
        .select(
          "id, status, filter_domain, filter_approach, filter_difficulty, filter_interaction_type, filter_answer_type, language_preference, question_count, current_question_index, is_timed, duration_seconds, score, correct_count, incorrect_count, unanswered_count, started_at, completed_at"
        )
        .eq("id", sessionId)
        .single();
      if (refreshed) session = mapSessionRow(refreshed as SessionRow);
    }
  }

  const { questions, states } = await getSessionQuestionsAndStates(supabase, sessionId);

  return { session, questions, questionStates: states, serverRemainingSeconds };
}

/** Saves the student's in-progress response only - never grades, never touches is_correct. Time is tracked separately by recordTimeSpent so the two never double-count. */
export async function saveAnswer(sessionId: string, questionId: string, response: QuizSubmitAnswer): Promise<{ success: boolean }> {
  const { supabase, user } = await requireUser();

  const { data: owned } = await supabase.from("practice_sessions").select("id, status").eq("id", sessionId).eq("user_id", user.id).maybeSingle();
  if (!owned || (owned as { status: string }).status !== "active") return { success: false };

  const { error } = await supabase
    .from("practice_session_questions")
    .update({ response, answered_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("question_id", questionId);

  return { success: !error };
}

/** The single place time_spent_seconds accumulates - independent of whether the question has been answered yet, so lingering on an unanswered question still counts toward average time per question. */
export async function recordTimeSpent(sessionId: string, questionId: string, deltaSeconds: number): Promise<{ success: boolean }> {
  if (deltaSeconds <= 0) return { success: true };
  const { supabase, user } = await requireUser();

  const { data: owned } = await supabase.from("practice_sessions").select("id, status").eq("id", sessionId).eq("user_id", user.id).maybeSingle();
  if (!owned || (owned as { status: string }).status !== "active") return { success: false };

  const { data: existing } = await supabase
    .from("practice_session_questions")
    .select("time_spent_seconds")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .maybeSingle();
  if (!existing) return { success: false };

  const priorSeconds = (existing as { time_spent_seconds: number }).time_spent_seconds;
  const { error } = await supabase
    .from("practice_session_questions")
    .update({ time_spent_seconds: priorSeconds + Math.round(deltaSeconds) })
    .eq("session_id", sessionId)
    .eq("question_id", questionId);

  return { success: !error };
}

export async function saveCurrentIndex(sessionId: string, index: number): Promise<{ success: boolean }> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("practice_sessions")
    .update({ current_question_index: Math.max(0, index) })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "active");

  return { success: !error };
}

export async function toggleFlag(sessionId: string, questionId: string, isFlagged: boolean): Promise<{ success: boolean }> {
  const { supabase, user } = await requireUser();

  const { data: owned } = await supabase.from("practice_sessions").select("id").eq("id", sessionId).eq("user_id", user.id).maybeSingle();
  if (!owned) return { success: false };

  const { error } = await supabase
    .from("practice_session_questions")
    .update({ is_flagged: isFlagged })
    .eq("session_id", sessionId)
    .eq("question_id", questionId);

  return { success: !error };
}

/**
 * Manual submit (the student clicking Submit) still goes through the same
 * server-authoritative expiry check getPracticeSession uses - if a timed
 * session's deadline has actually passed (regardless of what the client's
 * own countdown displayed), this records it as "expired" rather than
 * "manual", so the server's clock is always the one that decides, never
 * the browser's.
 */
export async function submitSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("practice_sessions")
    .select("is_timed, duration_seconds, started_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  let reason: "manual" | "expired" = "manual";
  if (data) {
    const row = data as { is_timed: boolean; duration_seconds: number | null; started_at: string };
    if (row.is_timed && row.duration_seconds !== null && isSessionExpired(row.started_at, row.duration_seconds)) {
      reason = "expired";
    }
  }

  const result = await submitPracticeSession(supabase, sessionId, user.id, reason);
  return { success: result.success, error: result.error };
}

/** Client-callable wrapper for practiceResultsService.ts's lazy single-question detail fetch (item 9) - AssessmentResultsView calls this directly from the browser when a student opens the review panel for one question. */
export async function getPracticeReviewQuestionDetail(sessionId: string, questionId: string) {
  const { supabase, user } = await requireUser();
  const { getPracticeReviewQuestionDetail: fetchDetail } = await import("@/features/practice/services/practiceResultsService");
  return fetchDetail(supabase, sessionId, user.id, questionId);
}
