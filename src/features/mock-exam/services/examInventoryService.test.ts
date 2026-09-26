import { describe, it, expect } from "vitest";
import { fetchQuestionHistoryForUser } from "./examInventoryService";

interface AttemptRow {
  id: string;
  user_id: string;
  retake_of_attempt_id: string | null;
  started_at: string;
}
interface QuestionRow {
  attempt_id: string;
  question_id: string;
}

function buildSupabaseMock(attempts: AttemptRow[], questionRows: QuestionRow[]) {
  return {
    from: (table: string) => {
      if (table === "mock_exam_attempts") {
        return {
          select: () => ({
            eq: (_col: string, userId: string) => ({
              order: async () => ({ data: attempts.filter((a) => a.user_id === userId), error: null }),
            }),
          }),
        };
      }
      if (table === "mock_exam_attempt_questions") {
        return {
          select: () => ({
            in: (_col: string, attemptIds: string[]) => ({
              not: async () => ({ data: questionRows.filter((q) => attemptIds.includes(q.attempt_id)), error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("fetchQuestionHistoryForUser", () => {
  it("returns empty history for a student with no past attempts", async () => {
    const supabase = buildSupabaseMock([], []);
    const history = await fetchQuestionHistoryForUser(supabase as never, "user-a");
    expect(history.seenCounts.size).toBe(0);
    expect(history.previousAttemptQuestionIds.size).toBe(0);
    expect(history.previousAttemptId).toBeNull();
  });

  it("isolates one student's history from another's - User A's questions never appear in User B's result", async () => {
    const attempts: AttemptRow[] = [
      { id: "attempt-a1", user_id: "user-a", retake_of_attempt_id: null, started_at: "2026-08-01T00:00:00Z" },
      { id: "attempt-b1", user_id: "user-b", retake_of_attempt_id: null, started_at: "2026-08-01T00:00:00Z" },
    ];
    const questionRows: QuestionRow[] = [
      { attempt_id: "attempt-a1", question_id: "Q_A_ONLY" },
      { attempt_id: "attempt-b1", question_id: "Q_B_ONLY" },
    ];
    const supabase = buildSupabaseMock(attempts, questionRows);

    const historyA = await fetchQuestionHistoryForUser(supabase as never, "user-a");
    expect(historyA.seenCounts.has("Q_A_ONLY")).toBe(true);
    expect(historyA.seenCounts.has("Q_B_ONLY")).toBe(false);

    const historyB = await fetchQuestionHistoryForUser(supabase as never, "user-b");
    expect(historyB.seenCounts.has("Q_B_ONLY")).toBe(true);
    expect(historyB.seenCounts.has("Q_A_ONLY")).toBe(false);
  });

  it("counts questions seen across multiple attempts, including retakes", async () => {
    const attempts: AttemptRow[] = [
      { id: "original", user_id: "user-a", retake_of_attempt_id: null, started_at: "2026-08-01T00:00:00Z" },
      { id: "retake-1", user_id: "user-a", retake_of_attempt_id: "original", started_at: "2026-08-02T00:00:00Z" },
    ];
    const questionRows: QuestionRow[] = [
      { attempt_id: "original", question_id: "Q1" },
      { attempt_id: "retake-1", question_id: "Q1" },
    ];
    const supabase = buildSupabaseMock(attempts, questionRows);

    const history = await fetchQuestionHistoryForUser(supabase as never, "user-a");
    expect(history.seenCounts.get("Q1")).toBe(2);
  });

  it("previousAttemptQuestionIds resolves to the most recent INDEPENDENTLY-generated attempt, never a retake", async () => {
    // Exam A (original) -> Retake -> Retake -> should still compare a NEW
    // exam's overlap against Exam A's question set, not either retake's.
    const attempts: AttemptRow[] = [
      { id: "retake-2", user_id: "user-a", retake_of_attempt_id: "retake-1", started_at: "2026-08-03T00:00:00Z" },
      { id: "retake-1", user_id: "user-a", retake_of_attempt_id: "exam-a", started_at: "2026-08-02T00:00:00Z" },
      { id: "exam-a", user_id: "user-a", retake_of_attempt_id: null, started_at: "2026-08-01T00:00:00Z" },
    ];
    const questionRows: QuestionRow[] = [
      { attempt_id: "exam-a", question_id: "Q1" },
      { attempt_id: "exam-a", question_id: "Q2" },
      { attempt_id: "retake-1", question_id: "Q1" },
      { attempt_id: "retake-1", question_id: "Q2" },
      { attempt_id: "retake-2", question_id: "Q1" },
      { attempt_id: "retake-2", question_id: "Q2" },
    ];
    const supabase = buildSupabaseMock(attempts, questionRows);

    const history = await fetchQuestionHistoryForUser(supabase as never, "user-a");
    expect(history.previousAttemptId).toBe("exam-a");
    expect(history.previousAttemptQuestionIds).toEqual(new Set(["Q1", "Q2"]));
  });

  it("previousAttemptQuestionIds is empty when the student has only ever retaken exams (no independent exam in the returned window)", async () => {
    const attempts: AttemptRow[] = [{ id: "retake-only", user_id: "user-a", retake_of_attempt_id: "some-other-user-purged-exam", started_at: "2026-08-01T00:00:00Z" }];
    const supabase = buildSupabaseMock(attempts, []);

    const history = await fetchQuestionHistoryForUser(supabase as never, "user-a");
    expect(history.previousAttemptId).toBeNull();
    expect(history.previousAttemptQuestionIds.size).toBe(0);
  });
});
