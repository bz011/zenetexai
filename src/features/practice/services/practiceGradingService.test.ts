import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: {} }));

const gradeQuizAnswerMock = vi.fn();
vi.mock("@/features/courses/services/quizGradingService", () => ({
  gradeQuizAnswer: (...args: unknown[]) => gradeQuizAnswerMock(...args),
}));

const { submitPracticeSession } = await import("./practiceGradingService");

interface MockConfig {
  sessionRow: { id: string; status: string; user_id: string } | null;
  sessionQuestionRows: { id: string; question_id: string | null; response: unknown }[];
  questionMetaRows: { question_id: string; interaction_type: string }[];
}

function buildSupabaseMock(config: MockConfig) {
  const sessionUpdateCalls: Record<string, unknown>[] = [];
  const questionUpdateCalls: { rowId: string; payload: Record<string, unknown> }[] = [];

  const from = vi.fn((table: string) => {
    if (table === "practice_sessions") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: config.sessionRow, error: null }) }),
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: async () => {
            sessionUpdateCalls.push(payload);
            return { error: null };
          },
        }),
      };
    }
    if (table === "practice_session_questions") {
      return {
        select: () => ({ eq: async () => ({ data: config.sessionQuestionRows, error: null }) }),
        update: (payload: Record<string, unknown>) => ({
          eq: async (_col: string, rowId: string) => {
            questionUpdateCalls.push({ rowId, payload });
            return { error: null };
          },
        }),
      };
    }
    if (table === "questions") {
      return { select: () => ({ in: async () => ({ data: config.questionMetaRows, error: null }) }) };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });

  return { from, sessionUpdateCalls, questionUpdateCalls } as unknown as { from: typeof from } & {
    sessionUpdateCalls: Record<string, unknown>[];
    questionUpdateCalls: { rowId: string; payload: Record<string, unknown> }[];
  };
}

describe("submitPracticeSession", () => {
  beforeEach(() => {
    gradeQuizAnswerMock.mockReset();
  });

  it("returns not-found for a session that doesn't belong to the caller", async () => {
    const supabase = buildSupabaseMock({ sessionRow: null, sessionQuestionRows: [], questionMetaRows: [] });
    const result = await submitPracticeSession(supabase as never, "session-1", "user-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Session not found");
  });

  it("is idempotent - a session already completed is never re-graded", async () => {
    const supabase = buildSupabaseMock({
      sessionRow: { id: "session-1", status: "completed", user_id: "user-1" },
      sessionQuestionRows: [],
      questionMetaRows: [],
    });
    const result = await submitPracticeSession(supabase as never, "session-1", "user-1");
    expect(result.success).toBe(true);
    expect(result.alreadyGraded).toBe(true);
    expect(gradeQuizAnswerMock).not.toHaveBeenCalled();
    expect(supabase.sessionUpdateCalls).toHaveLength(0);
  });

  it("is idempotent for an already-expired session too", async () => {
    const supabase = buildSupabaseMock({
      sessionRow: { id: "session-1", status: "expired", user_id: "user-1" },
      sessionQuestionRows: [],
      questionMetaRows: [],
    });
    const result = await submitPracticeSession(supabase as never, "session-1", "user-1");
    expect(result.alreadyGraded).toBe(true);
    expect(gradeQuizAnswerMock).not.toHaveBeenCalled();
  });

  it("counts a question with no response as unanswered, never graded as incorrect", async () => {
    const supabase = buildSupabaseMock({
      sessionRow: { id: "session-1", status: "active", user_id: "user-1" },
      sessionQuestionRows: [{ id: "row-1", question_id: "Q1", response: null }],
      questionMetaRows: [{ question_id: "Q1", interaction_type: "standard" }],
    });

    await submitPracticeSession(supabase as never, "session-1", "user-1");

    expect(gradeQuizAnswerMock).not.toHaveBeenCalled();
    const finalUpdate = supabase.sessionUpdateCalls[0];
    expect(finalUpdate).toMatchObject({ unanswered_count: 1, correct_count: 0, incorrect_count: 0, score: 0, status: "completed" });
  });

  it("counts a question whose question_id was set to null (deleted question) as unanswered", async () => {
    const supabase = buildSupabaseMock({
      sessionRow: { id: "session-1", status: "active", user_id: "user-1" },
      sessionQuestionRows: [{ id: "row-1", question_id: null, response: { questionId: "Q1", source: "bank", selectedOptionIds: ["A"] } }],
      questionMetaRows: [],
    });

    await submitPracticeSession(supabase as never, "session-1", "user-1");
    expect(gradeQuizAnswerMock).not.toHaveBeenCalled();
    expect(supabase.sessionUpdateCalls[0]).toMatchObject({ unanswered_count: 1 });
  });

  it("grades an answered question via gradeQuizAnswer, using the authoritative interaction_type from the questions table", async () => {
    const response = { questionId: "Q1", source: "bank" as const, selectedOptionIds: ["opt-a"] };
    const supabase = buildSupabaseMock({
      sessionRow: { id: "session-1", status: "active", user_id: "user-1" },
      sessionQuestionRows: [{ id: "row-1", question_id: "Q1", response }],
      questionMetaRows: [{ question_id: "Q1", interaction_type: "standard" }],
    });
    gradeQuizAnswerMock.mockResolvedValue(true);

    const result = await submitPracticeSession(supabase as never, "session-1", "user-1");

    expect(result.success).toBe(true);
    expect(gradeQuizAnswerMock).toHaveBeenCalledWith({}, { id: "Q1", source: "bank", interactionType: "standard" }, response);
    expect(supabase.sessionUpdateCalls[0]).toMatchObject({ correct_count: 1, incorrect_count: 0, unanswered_count: 0, score: 100, status: "completed" });
  });

  it("computes score as correct/total across a mix of correct, incorrect, and unanswered questions", async () => {
    const supabase = buildSupabaseMock({
      sessionRow: { id: "session-1", status: "active", user_id: "user-1" },
      sessionQuestionRows: [
        { id: "row-1", question_id: "Q1", response: { questionId: "Q1", source: "bank", selectedOptionIds: ["a"] } },
        { id: "row-2", question_id: "Q2", response: { questionId: "Q2", source: "bank", selectedOptionIds: ["b"] } },
        { id: "row-3", question_id: "Q3", response: null },
        { id: "row-4", question_id: "Q4", response: { questionId: "Q4", source: "bank", selectedOptionIds: ["c"] } },
      ],
      questionMetaRows: [
        { question_id: "Q1", interaction_type: "standard" },
        { question_id: "Q2", interaction_type: "standard" },
        { question_id: "Q4", interaction_type: "standard" },
      ],
    });
    gradeQuizAnswerMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await submitPracticeSession(supabase as never, "session-1", "user-1");

    // 2 correct, 1 incorrect, 1 unanswered out of 4 total -> score 50
    expect(supabase.sessionUpdateCalls[0]).toMatchObject({ correct_count: 2, incorrect_count: 1, unanswered_count: 1, score: 50 });
  });

  it("grades questions concurrently but still attributes each result to the right question, even when they resolve out of order", async () => {
    // Q1 is deliberately the slowest to resolve - if the concurrent grading
    // ever mixed up which outcome belongs to which row (e.g. by writing to
    // a shared counter by completion order instead of mapping per-row),
    // this would surface as Q1 being graded with Q2 or Q3's result instead
    // of its own.
    const supabase = buildSupabaseMock({
      sessionRow: { id: "session-1", status: "active", user_id: "user-1" },
      sessionQuestionRows: [
        { id: "row-1", question_id: "Q1", response: { questionId: "Q1", source: "bank", selectedOptionIds: ["a"] } },
        { id: "row-2", question_id: "Q2", response: { questionId: "Q2", source: "bank", selectedOptionIds: ["b"] } },
        { id: "row-3", question_id: "Q3", response: { questionId: "Q3", source: "bank", selectedOptionIds: ["c"] } },
      ],
      questionMetaRows: [
        { question_id: "Q1", interaction_type: "standard" },
        { question_id: "Q2", interaction_type: "standard" },
        { question_id: "Q3", interaction_type: "standard" },
      ],
    });

    gradeQuizAnswerMock.mockImplementation(async (_admin: unknown, question: { id: string }) => {
      const delays: Record<string, number> = { Q1: 15, Q2: 5, Q3: 0 };
      const results: Record<string, boolean> = { Q1: true, Q2: false, Q3: true };
      await new Promise((resolve) => setTimeout(resolve, delays[question.id]));
      return results[question.id];
    });

    await submitPracticeSession(supabase as never, "session-1", "user-1");

    const isCorrectByRowId = new Map(supabase.questionUpdateCalls.map((c) => [c.rowId, c.payload.is_correct]));
    expect(isCorrectByRowId.get("row-1")).toBe(true); // Q1
    expect(isCorrectByRowId.get("row-2")).toBe(false); // Q2
    expect(isCorrectByRowId.get("row-3")).toBe(true); // Q3
    expect(supabase.sessionUpdateCalls[0]).toMatchObject({ correct_count: 2, incorrect_count: 1, unanswered_count: 0, score: 67 });
  });

  it("marks the session status as 'expired' rather than 'completed' when the timeout triggered submission", async () => {
    const supabase = buildSupabaseMock({
      sessionRow: { id: "session-1", status: "active", user_id: "user-1" },
      sessionQuestionRows: [],
      questionMetaRows: [],
    });

    await submitPracticeSession(supabase as never, "session-1", "user-1", "expired");

    expect(supabase.sessionUpdateCalls[0]).toMatchObject({ status: "expired" });
  });
});
