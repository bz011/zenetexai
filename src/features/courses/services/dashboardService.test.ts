import { describe, it, expect } from "vitest";
import { getDashboardStats } from "./dashboardService";

/**
 * In-memory stand-in for the Supabase query builder: select / eq / in / not /
 * order / limit / maybeSingle, with eq and in REALLY filtering rows, so the
 * service's is_published, type and ownership filters are exercised rather
 * than assumed. Unknown tables fail loudly.
 */
type Row = Record<string, unknown>;
function fakeSupabase(tables: Record<string, Row[]>) {
  return {
    from(table: string) {
      if (!(table in tables)) throw new Error(`Unexpected table in dashboard test: ${table}`);
      let rows = [...tables[table]];
      const q = {
        select: () => q,
        eq: (col: string, val: unknown) => ((rows = rows.filter((r) => r[col] === val)), q),
        in: (col: string, vals: unknown[]) => ((rows = rows.filter((r) => vals.includes(r[col]))), q),
        not: () => q,
        order: () => q,
        limit: () => q,
        maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
        then: (resolve: (v: { data: Row[]; error: null }) => unknown) => resolve({ data: rows, error: null }),
      };
      return q;
    },
  };
}

const NOW = "2026-11-01T10:00:00.000Z";

// Shaped like production: the PRODUCT slug ("pmp-mastery-program") differs
// from the COURSE slug ("pmp"); they are linked by the "course:pmp" capability.
function pmpWorld(over: Partial<Record<string, Row[]>> = {}) {
  return {
    profiles: [{ id: "user-1", role: "student" }, { id: "admin-1", role: "admin" }],
    entitlements: [{ user_id: "user-1", product_id: "prod-mastery", status: "active", expires_at: null }],
    products: [
      { id: "prod-mastery", slug: "pmp-mastery-program", type: "course", is_free: false, is_active: true, is_published: true },
      { id: "prod-sim", slug: "pmp-exam-simulator", type: "simulator", is_free: false, is_active: true, is_published: true },
    ],
    product_capabilities: [
      { product_id: "prod-mastery", capability: "course:pmp" },
      { product_id: "prod-sim", capability: "practice:pmp" },
      { product_id: "prod-sim", capability: "mock_exam:pmp" },
    ],
    courses: [
      { id: "c-pmp", slug: "pmp", is_published: true },
      { id: "c-other", slug: "other", is_published: true }, // published, not owned
    ],
    modules: [
      { id: "m1", course_id: "c-pmp", is_published: true },
      { id: "m2", course_id: "c-pmp", is_published: true },
      { id: "mx", course_id: "c-other", is_published: true },
    ],
    lessons: [
      { id: "l1", module_id: "m1", is_published: true },
      { id: "l2", module_id: "m1", is_published: true },
      { id: "l3", module_id: "m2", is_published: true },
      { id: "l4", module_id: "m2", is_published: true },
      { id: "l-hidden", module_id: "m2", is_published: false }, // hidden (owner decision F4)
      { id: "lx", module_id: "mx", is_published: true },
    ],
    learning_assessments: [
      { id: "q2", module_id: "m2", type: "module_assessment", is_published: true },
      { id: "q-draft", module_id: "m1", type: "module_assessment", is_published: false },
      { id: "qx", module_id: "mx", type: "module_assessment", is_published: true },
    ],
    learning_assessment_attempts: [] as Row[],
    lesson_progress: [] as Row[],
    student_study_time: [] as Row[],
    ...over,
  };
}

describe("getDashboardStats", () => {
  it("counts the real curriculum when the product slug differs from the course slug (was 0/0)", async () => {
    const stats = await getDashboardStats(fakeSupabase(pmpWorld()) as never, "user-1");
    expect(stats.totalCourses).toBe(1);
    expect(stats.totalModules).toBe(2);
    expect(stats.totalLessons).toBe(4);
    expect(stats.totalQuizzes).toBe(1);
  });

  it("excludes hidden lessons from the total and ignores progress recorded on them, without deleting it", async () => {
    const progress = [
      { user_id: "user-1", lesson_id: "l1", completed_at: NOW },
      { user_id: "user-1", lesson_id: "l-hidden", completed_at: NOW }, // historical row, kept
    ];
    const world = pmpWorld({ lesson_progress: progress });
    const stats = await getDashboardStats(fakeSupabase(world) as never, "user-1");
    expect(stats.totalLessons).toBe(4);
    expect(stats.completedLessons).toBe(1);
    expect(stats.overallProgressPct).toBe(25);
    expect(world.lesson_progress).toHaveLength(2);
  });

  it("uses published module quizzes as the quiz denominator and counts each passed quiz once", async () => {
    const attempts = [
      { user_id: "user-1", assessment_id: "q2", passed: false, completed_at: NOW },
      { user_id: "user-1", assessment_id: "q2", passed: true, completed_at: NOW },
      { user_id: "user-1", assessment_id: "q2", passed: true, completed_at: NOW }, // retake: still one quiz
      { user_id: "user-1", assessment_id: "q-draft", passed: true, completed_at: NOW }, // unpublished quiz
    ];
    const stats = await getDashboardStats(fakeSupabase(pmpWorld({ learning_assessment_attempts: attempts })) as never, "user-1");
    expect(stats.quizzesPassed).toBe(1);
    expect(stats.totalQuizzes).toBe(1);
    expect(stats.quizzesAttempted).toBe(4);
  });

  it("a module is complete only with all its published lessons and its quiz passed; a hidden lesson never blocks it", async () => {
    const world = pmpWorld({
      lesson_progress: ["l1", "l2", "l3", "l4"].map((lesson_id) => ({ user_id: "user-1", lesson_id, completed_at: NOW })),
      learning_assessment_attempts: [{ user_id: "user-1", assessment_id: "q2", passed: true, completed_at: NOW }],
    });
    const stats = await getDashboardStats(fakeSupabase(world) as never, "user-1");
    expect(stats.completedLessons).toBe(4);
    expect(stats.completedModules).toBe(2);
    expect(stats.completedCourses).toBe(1);
    expect(stats.overallProgressPct).toBe(100);
  });

  it("partial progress: lessons done but quiz not passed leaves that module incomplete", async () => {
    const world = pmpWorld({
      lesson_progress: ["l1", "l2", "l3", "l4"].map((lesson_id) => ({ user_id: "user-1", lesson_id, completed_at: NOW })),
    });
    const stats = await getDashboardStats(fakeSupabase(world) as never, "user-1");
    expect(stats.completedModules).toBe(1); // m1 has no published quiz; m2's quiz not passed
    expect(stats.completedCourses).toBe(0);
  });

  it("a new learner sees the real totals with zero progress", async () => {
    const stats = await getDashboardStats(fakeSupabase(pmpWorld()) as never, "user-1");
    expect(stats.completedLessons).toBe(0);
    expect(stats.completedModules).toBe(0);
    expect(stats.quizzesPassed).toBe(0);
    expect(stats.overallProgressPct).toBe(0);
  });

  it("never counts a published course the user does not own", async () => {
    const stats = await getDashboardStats(fakeSupabase(pmpWorld()) as never, "user-1");
    expect(stats.totalLessons).toBe(4); // course "other" (lx, qx) is excluded
    expect(stats.totalQuizzes).toBe(1);
  });

  it("counts a free course product for a signed-in user without an entitlement row", async () => {
    const world = pmpWorld({
      entitlements: [],
      products: pmpWorld().products.map((p) => (p.id === "prod-mastery" ? { ...p, is_free: true } : p)),
    });
    const stats = await getDashboardStats(fakeSupabase(world) as never, "user-1");
    expect(stats.totalLessons).toBe(4);
  });

  it("returns zeroed stats, not an error, when the user has no course access", async () => {
    const stats = await getDashboardStats(fakeSupabase(pmpWorld({ entitlements: [] })) as never, "user-1");
    expect(stats).toMatchObject({ totalCourses: 0, totalLessons: 0, totalModules: 0, totalQuizzes: 0, overallProgressPct: 0 });
  });

  it("an admin sees course progress through the admin capability rule", async () => {
    const stats = await getDashboardStats(fakeSupabase(pmpWorld({ entitlements: [] })) as never, "admin-1");
    // An admin holds every capability that exists in product_capabilities -
    // here only course:pmp (no product grants "course:other").
    expect(stats.totalCourses).toBe(1);
    expect(stats.totalLessons).toBe(4);
  });
});
