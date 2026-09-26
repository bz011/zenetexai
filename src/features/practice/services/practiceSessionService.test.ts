import { describe, it, expect, vi, beforeEach } from "vitest";

const requireUserMock = vi.fn();
vi.mock("@/lib/auth/requireRole", () => ({ requireUser: (...args: unknown[]) => requireUserMock(...args) }));

const getCertificationIdMock = vi.fn();
const getEligibleQuestionCountMock = vi.fn();
vi.mock("@/features/practice/services/practiceConfigService", () => ({
  getCertificationId: (...args: unknown[]) => getCertificationIdMock(...args),
  getEligibleQuestionCount: (...args: unknown[]) => getEligibleQuestionCountMock(...args),
}));

vi.mock("@/features/practice/services/practiceQuestionService", () => ({
  getSessionQuestionsAndStates: vi.fn().mockResolvedValue({ questions: [], states: [] }),
}));

const submitPracticeSessionMock = vi.fn();
vi.mock("@/features/practice/services/practiceGradingService", () => ({
  submitPracticeSession: (...args: unknown[]) => submitPracticeSessionMock(...args),
}));

const { getPracticeSession, saveAnswer, toggleFlag } = await import("./practiceSessionService");

/**
 * Simulates real RLS/ownership-filtered behavior: a query scoped with
 * .eq("user_id", callerId) that doesn't match the row's actual owner
 * returns no data - exactly what Postgres RLS does for a foreign session,
 * and exactly what the explicit .eq("user_id", user.id) app-level check
 * backstops even if RLS were ever misconfigured.
 */
function buildOwnershipAwareSupabaseMock(actualOwnerId: string, sessionRow: Record<string, unknown>) {
  return {
    from: () => ({
      select: () => ({
        eq: (_col: string, sessionIdValue: string) => ({
          eq: (col: string, value: string) => ({
            maybeSingle: async () => {
              if (col === "user_id" && value !== actualOwnerId) return { data: null, error: null };
              return { data: sessionRow, error: null };
            },
          }),
        }),
      }),
      update: () => ({ eq: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }),
    }),
  };
}

describe("practice session ownership security", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
  });

  it("getPracticeSession returns null when the session belongs to a different user", async () => {
    const supabase = buildOwnershipAwareSupabaseMock("real-owner", { id: "session-1" });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "attacker" } });

    const result = await getPracticeSession("session-1");
    expect(result).toBeNull();
  });

  it("getPracticeSession succeeds for the actual owner", async () => {
    const supabase = buildOwnershipAwareSupabaseMock("real-owner", {
      id: "session-1",
      status: "active",
      filter_domain: null,
      filter_approach: null,
      filter_difficulty: null,
      filter_interaction_type: null,
      filter_answer_type: null,
      language_preference: "en",
      question_count: 5,
      current_question_index: 0,
      is_timed: false,
      duration_seconds: null,
      score: null,
      correct_count: 0,
      incorrect_count: 0,
      unanswered_count: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
    });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "real-owner" } });

    const result = await getPracticeSession("session-1");
    expect(result).not.toBeNull();
    expect(result!.session.id).toBe("session-1");
  });

  it("saveAnswer fails closed when the session isn't owned by the caller", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
        update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
      }),
    };
    requireUserMock.mockResolvedValue({ supabase, user: { id: "attacker" } });

    const result = await saveAnswer("session-1", "Q1", { questionId: "Q1", source: "bank", selectedOptionIds: ["a"] });
    expect(result.success).toBe(false);
  });

  it("toggleFlag fails closed when the session isn't owned by the caller", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
        update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
      }),
    };
    requireUserMock.mockResolvedValue({ supabase, user: { id: "attacker" } });

    const result = await toggleFlag("session-1", "Q1", true);
    expect(result.success).toBe(false);
  });
});
