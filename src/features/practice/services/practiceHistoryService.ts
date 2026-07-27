import type { SupabaseClient } from "@supabase/supabase-js";
import type { PracticeHistoryEntry } from "@/features/practice/types/practice";

const DEFAULT_PAGE_SIZE = 20;

interface HistoryRow {
  id: string;
  status: PracticeHistoryEntry["status"];
  question_count: number;
  score: number | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  filter_domain: PracticeHistoryEntry["filters"]["domain"];
  filter_approach: PracticeHistoryEntry["filters"]["approach"];
  filter_difficulty: PracticeHistoryEntry["filters"]["difficulty"];
  filter_interaction_type: PracticeHistoryEntry["filters"]["interactionType"];
  filter_answer_type: PracticeHistoryEntry["filters"]["answerType"];
  language_preference: PracticeHistoryEntry["filters"]["language"];
}

export async function getPracticeHistory(
  supabase: SupabaseClient,
  userId: string,
  page = 0,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<{ entries: PracticeHistoryEntry[]; total: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("practice_sessions")
    .select(
      "id, status, question_count, score, started_at, completed_at, duration_seconds, filter_domain, filter_approach, filter_difficulty, filter_interaction_type, filter_answer_type, language_preference",
      { count: "exact" }
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .range(from, to);

  const rows = (data ?? []) as HistoryRow[];

  return {
    entries: rows.map((row) => ({
      id: row.id,
      status: row.status,
      questionCount: row.question_count,
      score: row.score,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationSeconds: row.duration_seconds,
      filters: {
        domain: row.filter_domain,
        approach: row.filter_approach,
        difficulty: row.filter_difficulty,
        interactionType: row.filter_interaction_type,
        answerType: row.filter_answer_type,
        language: row.language_preference,
      },
    })),
    total: count ?? 0,
  };
}
