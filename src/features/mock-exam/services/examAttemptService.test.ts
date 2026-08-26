import { describe, it, expect, vi, beforeEach } from "vitest";

const requireUserMock = vi.fn();
vi.mock("@/lib/auth/requireRole", () => ({ requireUser: (...args: unknown[]) => requireUserMock(...args) }));

const { saveExamAnswer, retakeMockExamAttempt, startExamBreak, advanceToNextSection } = await import("./examAttemptService");

interface AttemptRow {
  id: string;
  status: string;
  current_section: number;
}

/**
 * saveExamAnswer's real query shape (Sprint 9.1 hardening): an
 * ownership+status read on mock_exam_attempts, then an UNCONDITIONAL
 * section_number lookup on mock_exam_attempt_questions - the write is only
 * permitted when that section EXACTLY equals the attempt's current_section,
 * which rejects both a past/locked section AND a not-yet-reached future one
 * with the same check (item 4: "do not expose future-section questions
 * before that section begins" applies to server actions directly, not just
 * UI navigation). Mirrors practiceSessionService.test.ts's ownership-aware
 * mock pattern (a query scoped by .eq("user_id", callerId) that doesn't
 * match returns no data, exactly like real RLS would).
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
    const supabase = buildSupabaseMock({ actualOwnerId: "real-owner", attemptRow: { id: "a1", status: "active", current_section: 1 }, questionSectionNumber: 1 });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "attacker" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("rejects the write when the attempt is not active (e.g. on_break or completed)", async () => {
    const supabase = buildSupabaseMock({ actualOwnerId: "user-1", attemptRow: { id: "a1", status: "on_break", current_section: 1 }, questionSectionNumber: 1 });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("allows the write when the question belongs to the attempt's current section", async () => {
    const supabase = buildSupabaseMock({ actualOwnerId: "user-1", attemptRow: { id: "a1", status: "active", current_section: 1 }, questionSectionNumber: 1 });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(true);
    expect(supabase.updateCalls).toHaveLength(1);
  });

  it("rejects the write when the question belongs to a PAST section already sealed (item 11's section-review restriction)", async () => {
    const supabase = buildSupabaseMock({ actualOwnerId: "user-1", attemptRow: { id: "a1", status: "active", current_section: 2 }, questionSectionNumber: 1 });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("rejects the write when the question belongs to a FUTURE section not yet reached (item 4 - a server action must enforce this too, not just UI navigation)", async () => {
    const supabase = buildSupabaseMock({ actualOwnerId: "user-1", attemptRow: { id: "a1", status: "active", current_section: 1 }, questionSectionNumber: 2 });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("rejects the write when the question doesn't belong to this attempt at all", async () => {
    const supabase = buildSupabaseMock({ actualOwnerId: "user-1", attemptRow: { id: "a1", status: "active", current_section: 1 }, questionSectionNumber: null });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await saveExamAnswer("a1", "Q1", RESPONSE);
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });
});

interface OriginalAttemptRow {
  status: string;
  certification_id: string;
  blueprint_version: string;
  blueprint_snapshot: unknown;
  duration_seconds: number;
}
interface RetakeQuestionRow {
  question_id: string | null;
  sequence_number: number;
  section_number: number;
}

function buildRetakeSupabaseMock(config: {
  actualOwnerId: string;
  originalRow: OriginalAttemptRow | null;
  questionRows: RetakeQuestionRow[];
  rpcResult?: { success: boolean; attempt_id?: string; error?: string };
}) {
  const rpcCalls: { name: string; args: Record<string, unknown> }[] = [];

  const client = {
    from: (table: string) => {
      if (table === "mock_exam_attempts") {
        return {
          select: () => ({
            eq: (_col: string, _id: string) => ({
              eq: (col: string, value: string) => ({
                maybeSingle: async () => {
                  if (col === "user_id" && value !== config.actualOwnerId) return { data: null, error: null };
                  return { data: config.originalRow, error: null };
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
              order: async () => ({ data: config.questionRows, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table in test: ${table}`);
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args });
      return { data: config.rpcResult ?? { success: true, attempt_id: "new-attempt-id" }, error: null };
    },
  };

  return { ...client, rpcCalls } as unknown as typeof client & { rpcCalls: { name: string; args: Record<string, unknown> }[] };
}

const ORIGINAL_ROW: OriginalAttemptRow = {
  status: "completed",
  certification_id: "cert-1",
  blueprint_version: "zentexai-pmp-eco-2026",
  blueprint_snapshot: { some: "snapshot" },
  duration_seconds: 14400,
};

const THREE_QUESTIONS: RetakeQuestionRow[] = [
  { question_id: "Q1", sequence_number: 0, section_number: 1 },
  { question_id: "Q2", sequence_number: 1, section_number: 1 },
  { question_id: "Q3", sequence_number: 2, section_number: 1 },
];

describe("retakeMockExamAttempt security and fidelity", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
  });

  it("rejects retaking another user's attempt", async () => {
    const supabase = buildRetakeSupabaseMock({ actualOwnerId: "real-owner", originalRow: ORIGINAL_ROW, questionRows: THREE_QUESTIONS });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "attacker" } });

    const result = await retakeMockExamAttempt("original-1");
    expect(result.success).toBe(false);
    expect(supabase.rpcCalls).toHaveLength(0);
  });

  it("rejects retaking an attempt that isn't terminal yet", async () => {
    const supabase = buildRetakeSupabaseMock({ actualOwnerId: "user-1", originalRow: { ...ORIGINAL_ROW, status: "active" }, questionRows: THREE_QUESTIONS });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await retakeMockExamAttempt("original-1");
    expect(result.success).toBe(false);
    expect(supabase.rpcCalls).toHaveLength(0);
  });

  it("rejects a retake when a question in the original set was deleted (question_id null)", async () => {
    const supabase = buildRetakeSupabaseMock({
      actualOwnerId: "user-1",
      originalRow: ORIGINAL_ROW,
      questionRows: [...THREE_QUESTIONS, { question_id: null, sequence_number: 3, section_number: 1 }],
    });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await retakeMockExamAttempt("original-1");
    expect(result.success).toBe(false);
    expect(supabase.rpcCalls).toHaveLength(0);
  });

  it("passes the EXACT same question_ids in the EXACT same order, plus the retake_of_attempt_id, to the RPC", async () => {
    const supabase = buildRetakeSupabaseMock({ actualOwnerId: "user-1", originalRow: ORIGINAL_ROW, questionRows: THREE_QUESTIONS });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await retakeMockExamAttempt("original-1");
    expect(result.success).toBe(true);
    expect(supabase.rpcCalls[0].name).toBe("create_mock_exam_attempt");
    expect(supabase.rpcCalls[0].args.p_question_ids).toEqual(["Q1", "Q2", "Q3"]);
    expect(supabase.rpcCalls[0].args.p_section_numbers).toEqual([1, 1, 1]);
    expect(supabase.rpcCalls[0].args.p_retake_of_attempt_id).toBe("original-1");
    expect(supabase.rpcCalls[0].args.p_duration_seconds).toBe(14400);
    expect(supabase.rpcCalls[0].args.p_blueprint_version).toBe("zentexai-pmp-eco-2026");
  });

  it("surfaces the RPC's own rejection (e.g. a since-unapproved question) as a failure, not a false success", async () => {
    const supabase = buildRetakeSupabaseMock({
      actualOwnerId: "user-1",
      originalRow: ORIGINAL_ROW,
      questionRows: THREE_QUESTIONS,
      rpcResult: { success: false, error: "not_all_questions_approved" },
    });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await retakeMockExamAttempt("original-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("not_all_questions_approved");
  });
});

interface BoundaryRow {
  status: string;
  blueprint_version: string;
  current_question_index: number;
  breaks_taken: number[];
  sections_locked: number[];
}

function buildBoundarySupabaseMock(config: { actualOwnerId: string; row: BoundaryRow | null }) {
  const updateCalls: Record<string, unknown>[] = [];
  const from = vi.fn((table: string) => {
    if (table !== "mock_exam_attempts") throw new Error(`Unexpected table: ${table}`);
    return {
      select: () => ({
        eq: (_col: string, _id: string) => ({
          eq: (col: string, value: string) => ({
            maybeSingle: async () => {
              if (col === "user_id" && value !== config.actualOwnerId) return { data: null, error: null };
              return { data: config.row, error: null };
            },
          }),
        }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: async () => {
          updateCalls.push(payload);
          return { error: null };
        },
      }),
    };
  });
  return { from, updateCalls } as unknown as { from: typeof from } & { updateCalls: Record<string, unknown>[] };
}

// PMP_EXAM_BLUEPRINT_2026: sections of 60, breaks after Q60/Q120 - index 59
// is the LAST question of section 1 (60 questions completed once it's answered).
const LAST_QUESTION_OF_SECTION_1: BoundaryRow = {
  status: "active",
  blueprint_version: "zentexai-pmp-eco-2026",
  current_question_index: 59,
  breaks_taken: [],
  sections_locked: [],
};

describe("startExamBreak (section-boundary transition)", () => {
  beforeEach(() => requireUserMock.mockReset());

  it("rejects starting a break for another user's attempt", async () => {
    const supabase = buildBoundarySupabaseMock({ actualOwnerId: "real-owner", row: LAST_QUESTION_OF_SECTION_1 });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "attacker" } });

    const result = await startExamBreak("attempt-1");
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("rejects starting a break when not actually at an eligible boundary", async () => {
    const supabase = buildBoundarySupabaseMock({ actualOwnerId: "user-1", row: { ...LAST_QUESTION_OF_SECTION_1, current_question_index: 10 } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await startExamBreak("attempt-1");
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("advances current_question_index by exactly one (past the boundary) and locks the completed section - computed server-side from the STILL-at-boundary stored index, never trusting a client value", async () => {
    const supabase = buildBoundarySupabaseMock({ actualOwnerId: "user-1", row: LAST_QUESTION_OF_SECTION_1 });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await startExamBreak("attempt-1");
    expect(result.success).toBe(true);
    expect(result.nextIndex).toBe(60);
    expect(supabase.updateCalls[0]).toMatchObject({ current_question_index: 60, sections_locked: [1], on_break: true, status: "on_break", breaks_taken: [1] });
  });
});

describe("advanceToNextSection (Continue Without Break)", () => {
  beforeEach(() => requireUserMock.mockReset());

  it("rejects for another user's attempt", async () => {
    const supabase = buildBoundarySupabaseMock({ actualOwnerId: "real-owner", row: LAST_QUESTION_OF_SECTION_1 });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "attacker" } });

    const result = await advanceToNextSection("attempt-1");
    expect(result.success).toBe(false);
    expect(supabase.updateCalls).toHaveLength(0);
  });

  it("rejects when not currently at a section boundary", async () => {
    const supabase = buildBoundarySupabaseMock({ actualOwnerId: "user-1", row: { ...LAST_QUESTION_OF_SECTION_1, current_question_index: 10 } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await advanceToNextSection("attempt-1");
    expect(result.success).toBe(false);
  });

  it("locks the completed section and advances the index WITHOUT consuming a break or changing status", async () => {
    const supabase = buildBoundarySupabaseMock({ actualOwnerId: "user-1", row: LAST_QUESTION_OF_SECTION_1 });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await advanceToNextSection("attempt-1");
    expect(result.success).toBe(true);
    expect(result.nextIndex).toBe(60);
    expect(result.nextSection).toBe(2);
    expect(supabase.updateCalls[0]).toEqual({ sections_locked: [1], current_section: 2, current_question_index: 60 });
    expect(supabase.updateCalls[0]).not.toHaveProperty("on_break");
    expect(supabase.updateCalls[0]).not.toHaveProperty("breaks_taken");
  });

  it("does not double-add a section to sections_locked if it's somehow already there", async () => {
    const supabase = buildBoundarySupabaseMock({ actualOwnerId: "user-1", row: { ...LAST_QUESTION_OF_SECTION_1, sections_locked: [1] } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await advanceToNextSection("attempt-1");
    expect(result.success).toBe(true);
    expect(supabase.updateCalls[0]).toMatchObject({ sections_locked: [1] });
  });
});
