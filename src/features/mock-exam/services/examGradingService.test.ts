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
  /** question_images.natural_width/height (migration 027) - required to normalize hotspotRows' pixel coordinates into the 0-100 percentage a submitted click uses. */
  hotspotImageRows?: { question_id: string; natural_width: number | null; natural_height: number | null }[];
}

function configureAdmin(config: AdminConfig) {
  adminFromMock.mockImplementation((table: string) => {
    if (table === "questions") return { select: () => ({ in: async () => ({ data: config.questionMetaRows ?? [] }) }) };
    if (table === "question_options") return { select: () => ({ in: async () => ({ data: config.optionRows ?? [] }) }) };
    if (table === "question_answer_key") return { select: () => ({ in: async () => ({ data: config.answerKeyRows ?? [] }) }) };
    if (table === "matching_answer_key") return { select: () => ({ in: async () => ({ data: config.matchingPairRows ?? [] }) }) };
    if (table === "drag_and_drop_answer_key") return { select: () => ({ in: async () => ({ data: config.dragDropRows ?? [] }) }) };
    if (table === "hotspots") return { select: () => ({ in: async () => ({ data: config.hotspotRows ?? [] }) }) };
    if (table === "question_images") return { select: () => ({ in: async () => ({ data: config.hotspotImageRows ?? [] }) }) };
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

  // --- Hotspot grading fix (launch blocker): hotspots.x/y/width/height are
  // pixel coordinates on the image's natural dimensions, but a submitted
  // click is always a 0-100 percentage - before normalizing by
  // natural_width/natural_height (migration 027), no click could ever
  // match any region on any of the 4 real hotspot questions in the bank.
  // These are those 4 questions' REAL stored coordinates and REAL image
  // dimensions (verified directly against the actual image files, not
  // assumed), exercised through submitMockExamAttempt - the actual
  // function Mock Exam calls to grade a real attempt. ---
  describe("hotspot grading - all 4 real production questions, via the real Mock Exam grading path", () => {
    const REAL_HOTSPOT_QUESTIONS = [
      { questionId: "Q000017", region: { x: 1421, y: 82, width: 397, height: 67 }, natural: { width: 1838, height: 506 } },
      { questionId: "Q000031", region: { x: 945, y: 18, width: 418, height: 418 }, natural: { width: 1840, height: 462 } },
      { questionId: "Q000247", region: { x: 925, y: 430, width: 900, height: 470 }, natural: { width: 1850, height: 934 } },
      { questionId: "Q000359", region: { x: 610, y: 324, width: 40, height: 40 }, natural: { width: 1816, height: 956 } },
    ];

    function centerClickPct(region: { x: number; y: number; width: number; height: number }, natural: { width: number; height: number }) {
      return {
        xPct: ((region.x + region.width / 2) / natural.width) * 100,
        yPct: ((region.y + region.height / 2) / natural.height) * 100,
      };
    }

    function configureFor(q: (typeof REAL_HOTSPOT_QUESTIONS)[number]) {
      configureAdmin({
        questionMetaRows: [{ question_id: q.questionId, interaction_type: "hotspot" }],
        hotspotRows: [{ question_id: q.questionId, ...q.region }],
        hotspotImageRows: [{ question_id: q.questionId, natural_width: q.natural.width, natural_height: q.natural.height }],
      });
    }

    for (const q of REAL_HOTSPOT_QUESTIONS) {
      it(`${q.questionId}: a click at the exact center of the correct region grades correct`, async () => {
        configureFor(q);
        const click = centerClickPct(q.region, q.natural);
        const supabase = buildSupabaseMock({
          attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
          attemptQuestionRows: [{ id: "row-1", question_id: q.questionId, response: { questionId: q.questionId, source: "bank", hotspotClick: click } }],
        });

        await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");

        expect(supabase.questionUpdateCalls[0]).toMatchObject({ payload: { is_correct: true } });
        expect(supabase.attemptUpdateCalls[0]).toMatchObject({ correct_count: 1, incorrect_count: 0 });
      });

      it(`${q.questionId}: a click clearly outside the correct region grades incorrect`, async () => {
        configureFor(q);
        // (1, 1) is never inside any of these 4 regions - all are well
        // away from the image's top-left corner.
        const supabase = buildSupabaseMock({
          attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
          attemptQuestionRows: [
            { id: "row-1", question_id: q.questionId, response: { questionId: q.questionId, source: "bank", hotspotClick: { xPct: 1, yPct: 1 } } },
          ],
        });

        await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");

        expect(supabase.questionUpdateCalls[0]).toMatchObject({ payload: { is_correct: false } });
        expect(supabase.attemptUpdateCalls[0]).toMatchObject({ correct_count: 0, incorrect_count: 1 });
      });

      it(`${q.questionId}: grading is deterministic regardless of the device/viewport that produced the percentage - the same click always grades the same way`, async () => {
        // A submitted click is always a 0-100 percentage of the image's
        // OWN rendered box (see HotspotQuestion.tsx) - mobile vs desktop
        // never changes what percentage a given point on the image is, so
        // grading (which only ever sees that percentage) cannot be
        // affected by screen size. Proven here by grading the identical
        // click twice and requiring an identical result both times.
        configureFor(q);
        const click = centerClickPct(q.region, q.natural);
        const response = { questionId: q.questionId, source: "bank" as const, hotspotClick: click };

        const supabaseA = buildSupabaseMock({
          attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
          attemptQuestionRows: [{ id: "row-1", question_id: q.questionId, response }],
        });
        const supabaseB = buildSupabaseMock({
          attemptRow: { id: "attempt-2", status: "active", user_id: "user-1" },
          attemptQuestionRows: [{ id: "row-1", question_id: q.questionId, response }],
        });

        await submitMockExamAttempt(supabaseA as never, "attempt-1", "user-1");
        await submitMockExamAttempt(supabaseB as never, "attempt-2", "user-1");

        expect(supabaseA.attemptUpdateCalls[0]).toMatchObject({ correct_count: 1 });
        expect(supabaseB.attemptUpdateCalls[0]).toMatchObject({ correct_count: 1 });
      });
    }

    it("boundary click exactly on the region's edge is deterministically correct (inclusive bounds)", async () => {
      const q = REAL_HOTSPOT_QUESTIONS[3]; // Q000359
      configureFor(q);
      const edgeClick = { xPct: (q.region.x / q.natural.width) * 100, yPct: (q.region.y / q.natural.height) * 100 }; // top-left corner of the region
      const supabase = buildSupabaseMock({
        attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
        attemptQuestionRows: [
          { id: "row-1", question_id: q.questionId, response: { questionId: q.questionId, source: "bank", hotspotClick: edgeClick } },
        ],
      });

      await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
      expect(supabase.questionUpdateCalls[0]).toMatchObject({ payload: { is_correct: true } });
    });

    it("fails closed (incorrect, never a false positive) when natural image dimensions are not yet backfilled for a hotspot question", async () => {
      configureAdmin({
        questionMetaRows: [{ question_id: "Q000359", interaction_type: "hotspot" }],
        hotspotRows: [{ question_id: "Q000359", x: 610, y: 324, width: 40, height: 40 }],
        hotspotImageRows: [{ question_id: "Q000359", natural_width: null, natural_height: null }],
      });
      const supabase = buildSupabaseMock({
        attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
        attemptQuestionRows: [
          { id: "row-1", question_id: "Q000359", response: { questionId: "Q000359", source: "bank", hotspotClick: { xPct: 34.69, yPct: 35.98 } } },
        ],
      });

      await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
      expect(supabase.questionUpdateCalls[0]).toMatchObject({ payload: { is_correct: false } });
    });
  });

  it("non-hotspot grading (standard, matching) is unchanged by the hotspot normalization fix", async () => {
    configureAdmin({
      questionMetaRows: [
        { question_id: "Q1", interaction_type: "standard" },
        { question_id: "Q2", interaction_type: "matching" },
      ],
      optionRows: [{ id: "opt-correct", question_id: "Q1" }],
      answerKeyRows: [{ option_id: "opt-correct", is_correct: true }],
      matchingPairRows: [{ question_id: "Q2", left_item_id: "left-a", right_item_id: "right-a" }],
    });
    const supabase = buildSupabaseMock({
      attemptRow: { id: "attempt-1", status: "active", user_id: "user-1" },
      attemptQuestionRows: [
        { id: "row-1", question_id: "Q1", response: { questionId: "Q1", source: "bank", selectedOptionIds: ["opt-correct"] } },
        { id: "row-2", question_id: "Q2", response: { questionId: "Q2", source: "bank", matchingPairs: [{ leftId: "left-a", rightId: "right-a" }] } },
      ],
    });

    await submitMockExamAttempt(supabase as never, "attempt-1", "user-1");
    expect(supabase.attemptUpdateCalls[0]).toMatchObject({ correct_count: 2, incorrect_count: 0 });
  });
});
