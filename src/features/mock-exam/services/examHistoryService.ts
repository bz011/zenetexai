import type { SupabaseClient } from "@supabase/supabase-js";
import type { MockExamHistoryEntry } from "@/features/mock-exam/types/mockExam";

const DEFAULT_PAGE_SIZE = 20;

interface HistoryRow {
  id: string;
  status: MockExamHistoryEntry["status"];
  blueprint_version: string;
  total_questions: number;
  score: number | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number;
}

export async function getMockExamHistory(
  supabase: SupabaseClient,
  userId: string,
  page = 0,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<{ entries: MockExamHistoryEntry[]; total: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("mock_exam_attempts")
    .select("id, status, blueprint_version, total_questions, score, started_at, completed_at, duration_seconds", { count: "exact" })
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .range(from, to);

  const rows = (data ?? []) as HistoryRow[];

  return {
    entries: rows.map((row) => ({
      id: row.id,
      status: row.status,
      blueprintVersion: row.blueprint_version,
      totalQuestions: row.total_questions,
      score: row.score,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationSeconds: row.duration_seconds,
    })),
    total: count ?? 0,
  };
}
