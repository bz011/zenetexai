import { describe, it, expect } from "vitest";
import { getPublicCurriculumOutline, getReadyAssessmentIds, getAssessmentAttemptStatus } from "./courseService";

function buildSupabaseMock(config: {
  course: { id: string } | null;
  modules: { id: string; title_en: string; title_ar: string | null; order_index: number }[];
  lessons: { id: string; module_id: string; title_en: string; title_ar: string | null; order_index: number }[];
}) {
  return {
    from: (table: string) => {
      if (table === "courses") {
        const chain = { eq: () => chain, maybeSingle: async () => ({ data: config.course, error: null }) };
        return { select: () => chain };
      }
      if (table === "modules") {
        const chain = { eq: () => chain, order: async () => ({ data: config.modules, error: null }) };
        return { select: () => chain };
      }
      if (table === "lessons") {
        const chain = { in: () => chain, eq: () => chain, order: async () => ({ data: config.lessons, error: null }) };
        return { select: () => chain };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("getPublicCurriculumOutline", () => {
  it("returns [] when the course doesn't exist or isn't published", async () => {
    const supabase = buildSupabaseMock({ course: null, modules: [], lessons: [] });
    expect(await getPublicCurriculumOutline(supabase as never, "pmp")).toEqual([]);
  });

  it("returns [] when there are zero published lessons anywhere (placeholder-only course content)", async () => {
    const supabase = buildSupabaseMock({
      course: { id: "course-1" },
      modules: [{ id: "module-1", title_en: "modul1", title_ar: null, order_index: 0 }],
      lessons: [],
    });
    expect(await getPublicCurriculumOutline(supabase as never, "pmp")).toEqual([]);
  });

  it("excludes a module that has zero published lessons, even if other modules have real content", async () => {
    const supabase = buildSupabaseMock({
      course: { id: "course-1" },
      modules: [
        { id: "module-empty", title_en: "Empty module", title_ar: null, order_index: 0 },
        { id: "module-real", title_en: "Real module", title_ar: null, order_index: 1 },
      ],
      lessons: [{ id: "lesson-1", module_id: "module-real", title_en: "Lesson 1", title_ar: null, order_index: 0 }],
    });

    const result = await getPublicCurriculumOutline(supabase as never, "pmp");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("module-real");
    expect(result[0].lessons).toHaveLength(1);
  });
});

// --- Module quiz safety: a learning_assessments row existing (and even
// being published) is not enough on its own for a quiz to be usable - it
// must also have at least one real question. These mirror
// quizService.getQuizQuestions()'s own source-of-truth (bank-linked
// question_links OR legacy learning_assessment_questions). ---
describe("getReadyAssessmentIds", () => {
  function buildMock(config: { linkRows?: { assessment_id: string }[]; legacyRows?: { assessment_id: string }[] }) {
    return {
      from: (table: string) => {
        if (table === "learning_assessment_question_links") {
          return { select: () => ({ in: async () => ({ data: config.linkRows ?? [], error: null }) }) };
        }
        if (table === "learning_assessment_questions") {
          return { select: () => ({ in: async () => ({ data: config.legacyRows ?? [], error: null }) }) };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    };
  }

  it("returns an empty set for an empty input without querying anything", async () => {
    const result = await getReadyAssessmentIds({ from: () => { throw new Error("should not be called"); } } as never, []);
    expect(result.size).toBe(0);
  });

  it("excludes an assessment with zero questions from either source - the exact bug this guards against", async () => {
    const supabase = buildMock({ linkRows: [], legacyRows: [] });
    const result = await getReadyAssessmentIds(supabase as never, ["assessment-empty"]);
    expect(result.has("assessment-empty")).toBe(false);
  });

  it("includes an assessment with at least one legacy question", async () => {
    const supabase = buildMock({ legacyRows: [{ assessment_id: "assessment-1" }] });
    const result = await getReadyAssessmentIds(supabase as never, ["assessment-1"]);
    expect(result.has("assessment-1")).toBe(true);
  });

  it("includes an assessment with at least one bank-linked question", async () => {
    const supabase = buildMock({ linkRows: [{ assessment_id: "assessment-2" }] });
    const result = await getReadyAssessmentIds(supabase as never, ["assessment-2"]);
    expect(result.has("assessment-2")).toBe(true);
  });

  it("correctly separates ready from not-ready across multiple assessments in one call", async () => {
    const supabase = buildMock({
      legacyRows: [{ assessment_id: "ready-legacy" }],
      linkRows: [{ assessment_id: "ready-bank" }],
    });
    const result = await getReadyAssessmentIds(supabase as never, ["ready-legacy", "ready-bank", "not-ready"]);
    expect(result.has("ready-legacy")).toBe(true);
    expect(result.has("ready-bank")).toBe(true);
    expect(result.has("not-ready")).toBe(false);
  });
});

// --- Permanent pass semantics: "has this user EVER passed" is derived
// from persisted attempts (at least one passed=true row), never a stored
// flag - so a later failed retake can never un-pass a module. ---
describe("getAssessmentAttemptStatus", () => {
  function buildMock(rows: { assessment_id: string; passed: boolean }[]) {
    return {
      from: (table: string) => {
        if (table === "learning_assessment_attempts") {
          return { select: () => ({ eq: () => ({ in: async () => ({ data: rows, error: null }) }) }) };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    };
  }

  it("returns empty sets for an empty input without querying anything", async () => {
    const result = await getAssessmentAttemptStatus({ from: () => { throw new Error("should not be called"); } } as never, "user-1", []);
    expect(result.attempted.size).toBe(0);
    expect(result.passed.size).toBe(0);
  });

  it("a never-attempted assessment is in neither set", async () => {
    const supabase = buildMock([]);
    const result = await getAssessmentAttemptStatus(supabase as never, "user-1", ["assessment-1"]);
    expect(result.attempted.has("assessment-1")).toBe(false);
    expect(result.passed.has("assessment-1")).toBe(false);
  });

  it("an attempted-but-failed assessment is attempted but not passed", async () => {
    const supabase = buildMock([{ assessment_id: "assessment-1", passed: false }]);
    const result = await getAssessmentAttemptStatus(supabase as never, "user-1", ["assessment-1"]);
    expect(result.attempted.has("assessment-1")).toBe(true);
    expect(result.passed.has("assessment-1")).toBe(false);
  });

  it("a single passing attempt marks the assessment passed", async () => {
    const supabase = buildMock([{ assessment_id: "assessment-1", passed: true }]);
    const result = await getAssessmentAttemptStatus(supabase as never, "user-1", ["assessment-1"]);
    expect(result.attempted.has("assessment-1")).toBe(true);
    expect(result.passed.has("assessment-1")).toBe(true);
  });

  it("PERMANENT PASS: an earlier pass followed by a later failed retake still counts as passed", async () => {
    // Two persisted rows for the same assessment - one passed, one failed
    // (order doesn't matter - this is "does at least one passed=true row
    // exist", not "what was the most recent attempt").
    const supabase = buildMock([
      { assessment_id: "assessment-1", passed: true },
      { assessment_id: "assessment-1", passed: false },
    ]);
    const result = await getAssessmentAttemptStatus(supabase as never, "user-1", ["assessment-1"]);
    expect(result.passed.has("assessment-1")).toBe(true);
  });

  it("handles multiple assessments independently in one call", async () => {
    const supabase = buildMock([
      { assessment_id: "passed-one", passed: true },
      { assessment_id: "failed-one", passed: false },
    ]);
    const result = await getAssessmentAttemptStatus(supabase as never, "user-1", ["passed-one", "failed-one", "untouched-one"]);
    expect(result.passed.has("passed-one")).toBe(true);
    expect(result.attempted.has("failed-one")).toBe(true);
    expect(result.passed.has("failed-one")).toBe(false);
    expect(result.attempted.has("untouched-one")).toBe(false);
  });
});
