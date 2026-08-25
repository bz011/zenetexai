import { describe, it, expect, vi, beforeEach } from "vitest";

const adminFromMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: (...args: unknown[]) => adminFromMock(...args) } }));

const { submitMockExamAttempt } = await import("./examGradingService");

interface AdminConfig {
  questionMetaRows?: { question_id: string; interaction_type: string }[];
  optionRows?: { id: string; question_id: string }[];
  answerKeyRows?: { option_id: string; is_correct: boolean }[];
  matchingPairRows?: { question_id: string; left_item_id: string; right_item_id: string }[];
  dragDropRows?: { question_id: string; item_id: string; correct_position: number }[];
  hotspotRows?: { question_id: string; x: number; y: number; width: number; height: number }[];
}

function configureAdmin(config: AdminConfig) {
  adminFromMock.mockImplementation((table: string) => {
    if (table === "questions") return { select: () => ({ in: async () => ({ data: config.questionMetaRows ?? [] }) }) };
    if (table === "question_options") return { select: () => ({ in: async () => ({ data: config.optionRows ?? [] }) }) };
    if (table === "question_answer_key") return { select: () => ({ in: async () => ({ data: config.answerKeyRows ?? [] }) }) };
    if (table === "matching_answer_key") return { select: () => ({ in: async () => ({ data: config.matchingPairRows ?? [] }) }) };
    if (table === "drag_and_drop_answer_key") return { select: () => ({ in: async () => ({ data: config.dragDropRows ?? [] }) }) };
    if (table === "hotspots") return { select: () => ({ in: async () => ({ data: config.hotspotRows ?? [] }) }) };
    throw new Error(`Unexpected admin table in test: ${table}`);
  });
}

interface SupabaseConfig {
  attemptRow: { id: string; status: string; user_id: string } | null;
  attemptQuestionRows: { id: string; question_id: string | null; response: unknown }[];
}

function buildSupabaseMock(config: SupabaseConfig) {
  const attemptUpdateCalls: Record<string, unknown>[] = [];
  const questionUpdateCalls: { rowId: string; payload: Record<string, unknown> }[] = [];

  const from = vi.fn((table: string) => {
    if (table === "mock_exam_attempts") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: config.attemptRow, error: null }) }),
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: async () => {
            attemptUpdateCalls.push(payload);
            return { error: null };
          },
        }),
      };
    }
    if (table === "mock_exam_attempt_questions") {
      return {
        select: () => ({ eq: async () => ({ data: config.attemptQuestionRows, error: null }) }),
        update: (payload: Record<string, unknown>) => ({
          eq: async (_col: string, rowId: string) => {
            questionUpdateCalls.push({ rowId, payload });
            return { error: null };
          },
        }),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });

  return { from, attemptUpdateCalls, questionUpdateCalls } as unknown as { from: typeof from } & {
    attemptUpdateCalls: Record<string, unknown>[];
    questionUpdateCalls: { rowId: string; payload: Record<string, unknown> }[];
  };
}

describe("submitMockExamAttempt", () => {
  beforeEach(() => {
    adminFromMock.mockReset();
    configureAdmin({});
  });

  it("returns not-found for an attempt that doesn't belong to the caller", async () => {
    const supabase = buildSupabaseMock({ attemptRow: null, attemptQuestionRows: [] });
    const result = await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Attempt not found");
  });

  it("is idempotent - a completed attempt is never re-graded", async () => {
    const supabase = buildSupabaseMock({ attemptRow: { id: "attempt-1", status: "completed", user_id: "user-1" }, attemptQuestionRows: [] });
    const result = await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
    expect(result.success).toBe(true);
    expect(result.alreadyGraded).toBe(true);
    expect(supabase.attemptUpdateCalls).toHaveLength(0);
  });

  it("is idempotent for an already-expired attempt too", async () => {
    const supabase = buildSupabaseMock({ attemptRow: { id: "attempt-1", status: "expired", user_id: "user-1" }, attemptQuestionRows: [] });
    const result = await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
    expect(result.alreadyGraded).toBe(true);
  });

  it("grades a standard single-answer question correctly using the batch-fetched answer key", async () => {
    configureAdmin({
      questionMetaRows: [{ question_id: "Q1", interaction_type: "standard" }],
      optionRows: [
        { id: "opt-correct", question_id: "Q1" },
        { id: "opt-wrong", question_id: "Q1" },
      ],
      answerKeyRows: [
        { option_id: "opt-correct", is_correct: true },
        { option_id: "opt-wrong", is_correct: false },
      ],
    });
    const supabase = buildSupabaseMock({
      attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
      attemptQuestionRows: [{ id: "row-1", question_id: "Q1", response: { questionId: "Q1", source: "bank", selectedOptionIds: ["opt-correct"] } }],
    });

    const result = await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");

    expect(result.success).toBe(true);
    expect(supabase.questionUpdateCalls[0]).toMatchObject({ payload: { is_correct: true } });
    expect(supabase.attemptUpdateCalls[0]).toMatchObject({ status: "completed", correct_count: 1, incorrect_count: 0, unanswered_count: 0, score: 100 });
  });

  it("grades a wrong selection as incorrect", async () => {
    configureAdmin({
      questionMetaRows: [{ question_id: "Q1", interaction_type: "standard" }],
      optionRows: [
        { id: "opt-correct", question_id: "Q1" },
        { id: "opt-wrong", question_id: "Q1" },
      ],
      answerKeyRows: [
        { option_id: "opt-correct", is_correct: true },
        { option_id: "opt-wrong", is_correct: false },
      ],
    });
    const supabase = buildSupabaseMock({
      attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
      attemptQuestionRows: [{ id: "row-1", question_id: "Q1", response: { questionId: "Q1", source: "bank", selectedOptionIds: ["opt-wrong"] } }],
    });

    await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
    expect(supabase.attemptUpdateCalls[0]).toMatchObject({ correct_count: 0, incorrect_count: 1, score: 0 });
  });

  it("counts a question with no response as unanswered without touching the answer key at all", async () => {
    const supabase = buildSupabaseMock({
      attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
      attemptQuestionRows: [{ id: "row-1", question_id: "Q1", response: null }],
    });

    await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
    expect(supabase.attemptUpdateCalls[0]).toMatchObject({ unanswered_count: 1, correct_count: 0, incorrect_count: 0, score: 0 });
  });

  it("counts a question whose question_id was set to null (deleted question) as unanswered", async () => {
    const supabase = buildSupabaseMock({
      attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
      attemptQuestionRows: [{ id: "row-1", question_id: null, response: { questionId: "Q1", source: "bank", selectedOptionIds: ["a"] } }],
    });

    await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
    expect(supabase.attemptUpdateCalls[0]).toMatchObject({ unanswered_count: 1 });
  });

  it("grades a matching question using the batch-fetched matching answer key", async () => {
    configureAdmin({
      questionMetaRows: [{ question_id: "Q1", interaction_type: "matching" }],
      matchingPairRows: [{ question_id: "Q1", left_item_id: "left-a", right_item_id: "right-a" }],
    });
    const supabase = buildSupabaseMock({
      attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
      attemptQuestionRows: [
        { id: "row-1", question_id: "Q1", response: { questionId: "Q1", source: "bank", matchingPairs: [{ leftId: "left-a", rightId: "right-a" }] } },
      ],
    });

    await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
    expect(supabase.attemptUpdateCalls[0]).toMatchObject({ correct_count: 1 });
  });

  it("marks status as 'expired' rather than 'completed' when the reason is expiry", async () => {
    const supabase = buildSupabaseMock({ attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" }, attemptQuestionRows: [] });
    await submitMockExamAttempt(supabase as never, "attempt-1", "user-1", "expired");
    expect(supabase.attemptUpdateCalls[0]).toMatchObject({ status: "expired" });
  });

  it("computes score across a realistic mix of correct/incorrect/unanswered", async () => {
    configureAdmin({
      questionMetaRows: [
        { question_id: "Q1", interaction_type: "standard" },
        { question_id: "Q2", interaction_type: "standard" },
      ],
      optionRows: [
        { id: "q1-correct", question_id: "Q1" },
        { id: "q2-correct", question_id: "Q2" },
        { id: "q2-wrong", question_id: "Q2" },
      ],
      answerKeyRows: [
        { option_id: "q1-correct", is_correct: true },
        { option_id: "q2-correct", is_correct: true },
        { option_id: "q2-wrong", is_correct: false },
      ],
    });
    const supabase = buildSupabaseMock({
      attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
      attemptQuestionRows: [
        { id: "row-1", question_id: "Q1", response: { questionId: "Q1", source: "bank", selectedOptionIds: ["q1-correct"] } },
        { id: "row-2", question_id: "Q2", response: { questionId: "Q2", source: "bank", selectedOptionIds: ["q2-wrong"] } },
        { id: "row-3", question_id: "Q3", response: null },
      ],
    });

    await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
    // 1 correct, 1 incorrect, 1 unanswered out of 3 -> score 33
    expect(supabase.attemptUpdateCalls[0]).toMatchObject({ correct_count: 1, incorrect_count: 1, unanswered_count: 1, score: 33 });
  });
});
