import type { SupabaseClient } from "@supabase/supabase-js";
import type { MockExamHistoryEntry } from "@/features/mock-exam/types/mockExam";

// A real 240-minute Mock Exam bounds how many attempts any one student can
// realistically accumulate - fetching up to this many in one query (rather
// than paginating) is what makes grouping retakes with their original
// exam (item 7A) simple: the grouping can't be done correctly across a
// page boundary without either a second query per page or refetching
// everything anyway, so there is no real pagination to preserve here.
const MAX_ATTEMPTS = 200;

export interface MockExamHistoryGroup {
  rootAttemptId: string;
  /** Original attempt first, then retakes in the order they were taken. */
  attempts: MockExamHistoryEntry[];
}

interface HistoryRow {
  id: string;
  status: MockExamHistoryEntry["status"];
  blueprint_version: string;
  total_questions: number;
  score: number | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number;
  retake_of_attempt_id: string | null;
  root_attempt_id: string | null;
}

export async function getMockExamHistory(supabase: SupabaseClient, userId: string): Promise<{ groups: MockExamHistoryGroup[]; total: number }> {
  const { data, count } = await supabase
    .from("mock_exam_attempts")
    .select("id, status, blueprint_version, total_questions, score, started_at, completed_at, duration_seconds, retake_of_attempt_id, root_attempt_id", { count: "exact" })
    .eq("user_id", userId)
    .order("started_at", { ascending: true })
    .limit(MAX_ATTEMPTS);

  const rows = (data ?? []) as HistoryRow[];

  const entries: MockExamHistoryEntry[] = rows.map((row) => ({
    id: row.id,
    status: row.status,
    blueprintVersion: row.blueprint_version,
    totalQuestions: row.total_questions,
    score: row.score,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationSeconds: row.duration_seconds,
    retakeOfAttemptId: row.retake_of_attempt_id,
    rootAttemptId: row.root_attempt_id,
  }));

  const byRoot = new Map<string, MockExamHistoryEntry[]>();
  for (const entry of entries) {
    const rootId = entry.rootAttemptId ?? entry.id;
    const list = byRoot.get(rootId) ?? [];
    list.push(entry);
    byRoot.set(rootId, list);
  }

  const groups: MockExamHistoryGroup[] = Array.from(byRoot.entries())
    .map(([rootAttemptId, attempts]) => ({ rootAttemptId, attempts }))
    // Most recently active group first (its last attempt's start time).
    .sort((a, b) => {
      const aLatest = a.attempts[a.attempts.length - 1]?.startedAt ?? "";
      const bLatest = b.attempts[b.attempts.length - 1]?.startedAt ?? "";
      return bLatest.localeCompare(aLatest);
    });

  return { groups, total: count ?? 0 };
}
