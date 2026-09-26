import { describe, it, expect } from "vitest";
import { isOptionSelectionCorrect, isMatchingCorrect, isDragDropCorrect, isHotspotClickCorrect, gradeQuizAnswer } from "./quizGradingService";

describe("isOptionSelectionCorrect", () => {
  it("is correct when the single submitted option is the single correct option", () => {
    expect(isOptionSelectionCorrect(new Set(["A"]), ["A"])).toBe(true);
  });

  it("is incorrect when the wrong option is submitted", () => {
    expect(isOptionSelectionCorrect(new Set(["A"]), ["B"])).toBe(false);
  });

  it("is correct for multiple_response only when the exact set matches", () => {
    expect(isOptionSelectionCorrect(new Set(["A", "B"]), ["A", "B"])).toBe(true);
    expect(isOptionSelectionCorrect(new Set(["A", "B"]), ["B", "A"])).toBe(true);
  });

  it("is incorrect for a partial multiple_response selection - no partial credit", () => {
    expect(isOptionSelectionCorrect(new Set(["A", "B"]), ["A"])).toBe(false);
  });

  it("is incorrect when extra wrong options are included alongside correct ones", () => {
    expect(isOptionSelectionCorrect(new Set(["A"]), ["A", "B"])).toBe(false);
  });

  it("is incorrect for an empty submission against a non-empty correct set", () => {
    expect(isOptionSelectionCorrect(new Set(["A"]), [])).toBe(false);
  });
});

describe("isMatchingCorrect", () => {
  const correct = new Map([
    ["L1", "R1"],
    ["L2", "R2"],
  ]);

  it("is correct when every pair matches exactly", () => {
    expect(
      isMatchingCorrect(correct, [
        { leftItemId: "L1", rightItemId: "R1" },
        { leftItemId: "L2", rightItemId: "R2" },
      ])
    ).toBe(true);
  });

  it("is incorrect when one pair is swapped", () => {
    expect(
      isMatchingCorrect(correct, [
        { leftItemId: "L1", rightItemId: "R2" },
        { leftItemId: "L2", rightItemId: "R1" },
      ])
    ).toBe(false);
  });

  it("is incorrect when fewer pairs are submitted than exist", () => {
    expect(isMatchingCorrect(correct, [{ leftItemId: "L1", rightItemId: "R1" }])).toBe(false);
  });
});

describe("isDragDropCorrect", () => {
  it("is correct when the order matches exactly", () => {
    expect(isDragDropCorrect(["A", "B", "C"], ["A", "B", "C"])).toBe(true);
  });

  it("is incorrect when two adjacent items are swapped", () => {
    expect(isDragDropCorrect(["A", "B", "C"], ["B", "A", "C"])).toBe(false);
  });

  it("is incorrect when the submitted order has a different length", () => {
    expect(isDragDropCorrect(["A", "B", "C"], ["A", "B"])).toBe(false);
  });
});

describe("isHotspotClickCorrect", () => {
  const region = { x: 40, y: 40, width: 20, height: 20 }; // covers 40-60 on both axes

  it("is correct for a click inside the region", () => {
    expect(isHotspotClickCorrect(region, { xPct: 50, yPct: 50 })).toBe(true);
  });

  it("is correct for a click exactly on the region's edge", () => {
    expect(isHotspotClickCorrect(region, { xPct: 40, yPct: 60 })).toBe(true);
  });

  it("is incorrect for a click outside the region", () => {
    expect(isHotspotClickCorrect(region, { xPct: 10, yPct: 10 })).toBe(false);
  });

  it("is incorrect for a click just past the region's edge", () => {
    expect(isHotspotClickCorrect(region, { xPct: 60.1, yPct: 50 })).toBe(false);
  });
});

// --- Hotspot grading fix (launch blocker), exercised through
// gradeQuizAnswer() - the exact function Practice sessions and the course
// assessment submit route call to grade a real answer, not a duplicate
// helper. hotspots.x/y/width/height are pixel coordinates on the image's
// natural dimensions; a submitted click is always a 0-100 percentage
// (HotspotQuestion.tsx) - getHotspotRegions() must normalize by
// natural_width/natural_height (question_images, migration 027) before any
// comparison. These are the 4 real hotspot questions' actual stored
// coordinates and actual image dimensions (verified directly against the
// real image files, not assumed). ---
describe("gradeQuizAnswer - hotspot, all 4 real production questions, via the real Practice/assessment grading path", () => {
  interface FakeAdminConfig {
    hotspotRows?: { x: number; y: number; width: number; height: number }[];
    imageRows?: { natural_width: number | null; natural_height: number | null }[];
  }

  function buildFakeSupabaseAdmin(config: FakeAdminConfig) {
    return {
      from: (table: string) => ({
        select: () => ({
          eq: () => {
            if (table === "hotspots") return Promise.resolve({ data: config.hotspotRows ?? [] });
            if (table === "question_images") {
              return { limit: () => Promise.resolve({ data: config.imageRows ?? [] }) };
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        }),
      }),
    };
  }

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

  for (const q of REAL_HOTSPOT_QUESTIONS) {
    it(`${q.questionId}: a click at the exact center of the correct region grades correct`, async () => {
      const admin = buildFakeSupabaseAdmin({ hotspotRows: [q.region], imageRows: [{ natural_width: q.natural.width, natural_height: q.natural.height }] });
      const click = centerClickPct(q.region, q.natural);

      const isCorrect = await gradeQuizAnswer(
        admin as never,
        { id: q.questionId, source: "bank", interactionType: "hotspot" },
        { questionId: q.questionId, source: "bank", hotspotClick: click }
      );

      expect(isCorrect).toBe(true);
    });

    it(`${q.questionId}: a click clearly outside the correct region grades incorrect`, async () => {
      const admin = buildFakeSupabaseAdmin({ hotspotRows: [q.region], imageRows: [{ natural_width: q.natural.width, natural_height: q.natural.height }] });

      const isCorrect = await gradeQuizAnswer(
        admin as never,
        { id: q.questionId, source: "bank", interactionType: "hotspot" },
        { questionId: q.questionId, source: "bank", hotspotClick: { xPct: 1, yPct: 1 } }
      );

      expect(isCorrect).toBe(false);
    });

    it(`${q.questionId}: grading the same percentage click twice (simulating mobile then desktop) is always identical - device/viewport never enters grading`, async () => {
      const click = centerClickPct(q.region, q.natural);
      const admin1 = buildFakeSupabaseAdmin({ hotspotRows: [q.region], imageRows: [{ natural_width: q.natural.width, natural_height: q.natural.height }] });
      const admin2 = buildFakeSupabaseAdmin({ hotspotRows: [q.region], imageRows: [{ natural_width: q.natural.width, natural_height: q.natural.height }] });

      const [first, second] = await Promise.all([
        gradeQuizAnswer(admin1 as never, { id: q.questionId, source: "bank", interactionType: "hotspot" }, { questionId: q.questionId, source: "bank", hotspotClick: click }),
        gradeQuizAnswer(admin2 as never, { id: q.questionId, source: "bank", interactionType: "hotspot" }, { questionId: q.questionId, source: "bank", hotspotClick: click }),
      ]);

      expect(first).toBe(true);
      expect(second).toBe(true);
    });
  }

  it("boundary click exactly on the region's top-left corner is deterministically correct (inclusive bounds)", async () => {
    const q = REAL_HOTSPOT_QUESTIONS[3]; // Q000359
    const admin = buildFakeSupabaseAdmin({ hotspotRows: [q.region], imageRows: [{ natural_width: q.natural.width, natural_height: q.natural.height }] });
    const edgeClick = { xPct: (q.region.x / q.natural.width) * 100, yPct: (q.region.y / q.natural.height) * 100 };

    const isCorrect = await gradeQuizAnswer(
      admin as never,
      { id: q.questionId, source: "bank", interactionType: "hotspot" },
      { questionId: q.questionId, source: "bank", hotspotClick: edgeClick }
    );

    expect(isCorrect).toBe(true);
  });

  it("fails closed (never a false positive) when natural image dimensions are not yet backfilled", async () => {
    const region = { x: 610, y: 324, width: 40, height: 40 };
    const admin = buildFakeSupabaseAdmin({ hotspotRows: [region], imageRows: [{ natural_width: null, natural_height: null }] });

    const isCorrect = await gradeQuizAnswer(
      admin as never,
      { id: "Q000359", source: "bank", interactionType: "hotspot" },
      { questionId: "Q000359", source: "bank", hotspotClick: { xPct: 34.69, yPct: 35.98 } }
    );

    expect(isCorrect).toBe(false);
  });

  it("a missing hotspotClick on the submission grades incorrect without querying anything nonsensical", async () => {
    const q = REAL_HOTSPOT_QUESTIONS[0];
    const admin = buildFakeSupabaseAdmin({ hotspotRows: [q.region], imageRows: [{ natural_width: q.natural.width, natural_height: q.natural.height }] });

    const isCorrect = await gradeQuizAnswer(admin as never, { id: q.questionId, source: "bank", interactionType: "hotspot" }, { questionId: q.questionId, source: "bank" });

    expect(isCorrect).toBe(false);
  });
});
