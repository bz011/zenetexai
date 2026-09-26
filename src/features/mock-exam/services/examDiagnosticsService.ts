/**
 * Admin-only diagnostic reads (Sprint 9.1 item 8) - never exposed to
 * students. Surfaces exactly the three things item 8 asks for: questions
 * excluded from selection because their required image is missing/broken,
 * the actual previous-attempt overlap recorded on recent Mock Exam
 * attempts, and any attempt whose blueprint needed a fallback because
 * inventory was insufficient. Everything here reads from blueprint_snapshot
 * (already persisted per attempt) or questions.image_verified_broken - no
 * new tracking mechanism, no answer-key exposure.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface BrokenImageQuestion {
  questionId: string;
  questionTextEn: string;
  status: string;
  imageVerifiedAt: string | null;
}

export async function getBrokenImageQuestions(supabase: SupabaseClient): Promise<BrokenImageQuestion[]> {
  const { data } = await supabase
    .from("questions")
    .select("question_id, question_text_en, status, image_verified_at")
    .eq("interaction_type", "graphic_based")
    .eq("image_verified_broken", true)
    .order("image_verified_at", { ascending: false });

  type Row = { question_id: string; question_text_en: string; status: string; image_verified_at: string | null };
  return ((data ?? []) as Row[]).map((r) => ({
    questionId: r.question_id,
    questionTextEn: r.question_text_en,
    status: r.status,
    imageVerifiedAt: r.image_verified_at,
  }));
}

export interface MockExamBlueprintDiagnostic {
  attemptId: string;
  userId: string;
  startedAt: string;
  status: string;
  blueprintVersion: string;
  previousAttemptOverlapCount: number | null;
  previousAttemptOverlapTarget: number | null;
  hadFallback: boolean;
  fallbackLogSample: string[];
  topUpCount: number;
}

const RECENT_ATTEMPT_LIMIT = 50;

/** Most recent attempts whose blueprint_snapshot shows a fallback fired or a previous-attempt overlap was recorded - the two things item 8 asks admins be able to see. */
export async function getRecentMockExamBlueprintDiagnostics(supabase: SupabaseClient): Promise<MockExamBlueprintDiagnostic[]> {
  const { data } = await supabase
    .from("mock_exam_attempts")
    .select("id, user_id, started_at, status, blueprint_version, blueprint_snapshot")
    .order("started_at", { ascending: false })
    .limit(RECENT_ATTEMPT_LIMIT);

  type Snapshot = {
    fallbackLog?: string[];
    interactionFallbackLog?: string[];
    answerTypeFallbackLog?: string[];
    topUpCount?: number;
    previousAttemptOverlapCount?: number;
    previousAttemptOverlapTarget?: number;
  };
  type Row = { id: string; user_id: string; started_at: string; status: string; blueprint_version: string; blueprint_snapshot: Snapshot | null };

  return ((data ?? []) as Row[]).map((row) => {
    const snapshot = row.blueprint_snapshot ?? {};
    const combinedLog = [...(snapshot.fallbackLog ?? []), ...(snapshot.interactionFallbackLog ?? []), ...(snapshot.answerTypeFallbackLog ?? [])];
    return {
      attemptId: row.id,
      userId: row.user_id,
      startedAt: row.started_at,
      status: row.status,
      blueprintVersion: row.blueprint_version,
      previousAttemptOverlapCount: snapshot.previousAttemptOverlapCount ?? null,
      previousAttemptOverlapTarget: snapshot.previousAttemptOverlapTarget ?? null,
      hadFallback: combinedLog.length > 0 || (snapshot.topUpCount ?? 0) > 0,
      fallbackLogSample: combinedLog.slice(0, 5),
      topUpCount: snapshot.topUpCount ?? 0,
    };
  });
}
