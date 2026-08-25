import { describe, it, expect, vi, beforeEach } from "vitest";

const requireUserMock = vi.fn();
vi.mock("@/lib/auth/requireRole", () => ({ requireUser: (...args: unknown[]) => requireUserMock(...args) }));

const { saveExamAnswer } = await import("./examAttemptService");

interface AttemptRow {
  id: string;
  status: string;
  sections_locked: number[];
}

/**
 * saveExamAnswer's real query shape: an ownership+status read on
 * mock_exam_attempts (ALWAYS), then - only when sections_locked is
 * non-empty - a section_number lookup on mock_exam_attempt_questions
 * before finally writing the response. This mirrors
 * practiceSessionService.test.ts's ownership-aware mock pattern (a query
 * scoped by .eq("user_id", callerId) that doesn't match returns no data,
 * exactly like real RLS would).
 */
function buildSupabaseMock(config: { actualOwnerId: string; attemptRow: AttemptRow | null; questionSectionNumber: number | null }) {
  const updateCalls: { response: unknown }[] = [];

  const from = vi.fn((table: string) => {
    if (table === "mock_exam_attempts") {
      return {
        select: () => ({
          eq: (_col: string, _attemptId: string) => ({
            eq: (col: string, value: string) => ({
              maybeSingle: async () => {
                if (col === "user_id" && value !== config.actualOwnerId) return { data: null, error: null };
                return { data: config.attemptRow, error: null };
              },
            }),
          }),
        }),
      };
    }
    if (table === "mock_exam_attempt_questions") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: config.questionSectionNumber !== null ? { section_number: config.questionSectionNumber } : null, error: null }),
            }),
          }),
        }),
        update: (payload: { response: unknown }) => ({
          eq: () => ({
            eq: async () => {
              updateCalls.push(payload);
              return { error: null };
            },
          }),
        }),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });

  return { from, updateCalls } as unknown as { from: typeof from } & { updateCalls: { response: unknown }[] };
}

const RESPONSE = { questionId: "Q1", source: "bank" as const, selectedOptionIds: ["opt-a"] };

describe("saveExamAnswer security", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
  });

  it("rejects the write when the attempt belongs to a different user", async () => {
    const supabase = buildSupabaseMock({ actualOwnerId: "real-owner", attemptRow: { id: "a1", status: "active", sections_locked: [] }, questionSectionNumber: null });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "attacker" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("rejects the write when the attempt is not active (e.g. on_break or completed)", async () => {
    const supabase = buildSupabaseMock({ actualOwnerId: "user-1", attemptRow: { id: "a1", status: "on_break", sections_locked: [] }, questionSectionNumber: null });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("allows the write when no section is locked, without even checking the question's section", async () => {
    const supabase = buildSupabaseMock({ actualOwnerId: "user-1", attemptRow: { id: "a1", status: "active", sections_locked: [] }, questionSectionNumber: null });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(true);
    expect(supabase.updateCalls).toHaveLength(1);
  });

  it("rejects the write when the question belongs to a section already sealed by a break (item 11's section-review restriction)", async () => {
    const supabase = buildSupabaseMock({
      actualOwnerId: "user-1",
      attemptRow: { id: "a1", status: "active", sections_locked: [1] },
      questionSectionNumber: 1,
    });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("allows the write when a DIFFERENT section is locked but this question belongs to the still-open section", async () => {
    const supabase = buildSupabaseMock({
      actualOwnerId: "user-1",
      attemptRow: { id: "a1", status: "active", sections_locked: [1] },
      questionSectionNumber: 2,
    });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(true);
    expect(supabase.updateCalls).toHaveLength(1);
  });
});
