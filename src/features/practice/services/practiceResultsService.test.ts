import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: () => ({ select: () => ({ in: async () => ({ data: [] }) }) }) } }));

const { getPracticeResultsSummary } = await import("./practiceResultsService");

const SESSION_ROW = {
  id: "session-1",
  status: "completed",
  user_id: "user-1",
  question_count: 4,
  current_question_index: 3,
  is_timed: false,
  duration_seconds: null,
  score: 50,
  correct_count: 2,
  incorrect_count: 1,
  unanswered_count: 1,
  started_at: "2026-07-27T12:00:00.000Z",
  completed_at: "2026-07-27T12:10:00.000Z",
  filter_domain: null,
  filter_approach: null,
  filter_difficulty: null,
  filter_interaction_type: null,
  filter_answer_type: null,
  language_preference: "en",
};

const SESSION_QUESTION_ROWS = [
  { question_id: "Q1", is_correct: true, is_flagged: false, time_spent_seconds: 30 },
  { question_id: "Q2", is_correct: false, is_flagged: true, time_spent_seconds: 45 },
  { question_id: "Q3", is_correct: null, is_flagged: false, time_spent_seconds: 0 },
  { question_id: "Q4", is_correct: true, is_flagged: false, time_spent_seconds: 25 },
];

const QUESTION_META_ROWS = [
  { question_id: "Q1", domain: "Process", approach: "Predictive", difficulty: "Easy", interaction_type: "standard" },
  { question_id: "Q2", domain: "People", approach: "Agile", difficulty: "Moderate", interaction_type: "standard" },
  { question_id: "Q3", domain: "Process", approach: "Predictive", difficulty: "Easy", interaction_type: "matching" },
  { question_id: "Q4", domain: "Process", approach: "Predictive", difficulty: "Difficult", interaction_type: "standard" },
];

function buildSupabaseMock(sessionRow: typeof SESSION_ROW | null) {
  return {
    from: (table: string) => {
      if (table === "practice_sessions") {
        return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: sessionRow, error: null }) }) }) }) };
      }
      if (table === "practice_session_questions") {
        return { select: () => ({ eq: async () => ({ data: SESSION_QUESTION_ROWS, error: null }) }) };
      }
      if (table === "questions") {
        return { select: () => ({ in: async () => ({ data: QUESTION_META_ROWS, error: null }) }) };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("getPracticeResultsSummary", () => {
  it("returns null when the session doesn't belong to the caller", async () => {
    const summary = await getPracticeResultsSummary(buildSupabaseMock(null) as never, "session-1", "user-1");
    expect(summary).toBeNull();
  });

  it("returns null for a session that is still active (results only available after completion)", async () => {
    const summary = await getPracticeResultsSummary(buildSupabaseMock({ ...SESSION_ROW, status: "active" }) as never, "session-1", "user-1");
    expect(summary).toBeNull();
  });

  it("computes total/average time and flagged count correctly", async () => {
    const summary = await getPracticeResultsSummary(buildSupabaseMock(SESSION_ROW) as never, "session-1", "user-1");
    expect(summary).not.toBeNull();
    expect(summary!.totalTimeSpentSeconds).toBe(100); // 30 + 45 + 0 + 25
    expect(summary!.averageTimePerQuestionSeconds).toBe(25); // 100 / 4
    expect(summary!.flaggedCount).toBe(1);
  });

  it("groups the domain breakdown correctly, counting correct answers only within each group", async () => {
    const summary = await getPracticeResultsSummary(buildSupabaseMock(SESSION_ROW) as never, "session-1", "user-1");
    const processEntry = summary!.byDomain.find((e) => e.label === "Process");
    const peopleEntry = summary!.byDomain.find((e) => e.label === "People");

    // Process: Q1(correct), Q3(unanswered/not-correct), Q4(correct) -> 2/3
    expect(processEntry).toMatchObject({ total: 3, correct: 2 });
    // People: Q2(incorrect) -> 0/1
    expect(peopleEntry).toMatchObject({ total: 1, correct: 0 });
  });

  it("groups the question-type breakdown correctly", async () => {
    const summary = await getPracticeResultsSummary(buildSupabaseMock(SESSION_ROW) as never, "session-1", "user-1");
    const standardEntry = summary!.byQuestionType.find((e) => e.label === "standard");
    const matchingEntry = summary!.byQuestionType.find((e) => e.label === "matching");

    expect(standardEntry).toMatchObject({ total: 3, correct: 2 });
    expect(matchingEntry).toMatchObject({ total: 1, correct: 0 });
  });
});
