import { describe, it, expect } from "vitest";
import { getDashboardStats } from "./dashboardService";

interface Fixture {
  entitlements: { product_id: string; expires_at: string | null }[];
  products: { id: string; slug: string; type: string; title_en: string; title_ar: string }[];
  capabilities: { product_id: string; capability: string }[];
  courses: { id: string; slug: string; is_published: boolean }[];
  modules: { id: string; course_id: string }[];
  lessons: { id: string; module_id: string }[];
  progress: { lesson_id: string; completed_at: string }[];
}

// Regression fixture for a stabilization-sprint bug: getDashboardStats() used
// to query every published course platform-wide as the progress denominator,
// not just the ones the user owns. With one owned course A (2 lessons, 1
// completed) and one UNOWNED published course B (5 lessons, 0 completed),
// the buggy version reported totalLessons=7 / overallProgressPct=14; the fix
// must report totalLessons=2 / overallProgressPct=50 - course B never
// enters the calculation at all.
function buildSupabaseMock(f: Fixture) {
  return {
    from: (table: string) => {
      if (table === "entitlements") {
        return { select: () => ({ eq: () => ({ eq: async () => ({ data: f.entitlements, error: null }) }) }) };
      }
      if (table === "products") {
        return { select: () => ({ in: async () => ({ data: f.products, error: null }) }) };
      }
      if (table === "product_capabilities") {
        return { select: () => ({ in: async () => ({ data: f.capabilities, error: null }) }) };
      }
      if (table === "courses") {
        return {
          select: () => ({
            eq: () => ({
              in: async (_col: string, slugs: string[]) => ({
                data: f.courses.filter((c) => c.is_published && slugs.includes(c.slug)),
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "modules") {
        return {
          select: () => ({
            in: (_col: string, courseIds: string[]) => ({
              eq: async () => ({ data: f.modules.filter((m) => courseIds.includes(m.course_id)), error: null }),
            }),
          }),
        };
      }
      if (table === "lessons") {
        return {
          select: () => ({
            in: (_col: string, moduleIds: string[]) => ({
              eq: async () => ({ data: f.lessons.filter((l) => moduleIds.includes(l.module_id)), error: null }),
            }),
          }),
        };
      }
      if (table === "learning_assessments") {
        return { select: () => ({ in: () => ({ eq: () => ({ eq: async () => ({ data: [], error: null }) }) }) }) };
      }
      if (table === "learning_assessment_attempts") {
        return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
      }
      if (table === "student_study_time") {
        return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
      }
      if (table === "lesson_progress") {
        return {
          select: () => ({
            eq: () => ({
              in: async (_col: string, lessonIds: string[]) => ({
                data: f.progress.filter((p) => lessonIds.includes(p.lesson_id)),
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table in dashboardService test mock: ${table}`);
    },
  };
}

describe("getDashboardStats course scoping", () => {
  const fixture: Fixture = {
    entitlements: [{ product_id: "product-a", expires_at: null }],
    products: [{ id: "product-a", slug: "course-a", type: "course", title_en: "Course A", title_ar: "Course A" }],
    capabilities: [{ product_id: "product-a", capability: "course:course-a" }],
    courses: [
      { id: "course-a-id", slug: "course-a", is_published: true },
      { id: "course-b-id", slug: "course-b", is_published: true }, // published platform-wide, but NOT owned by this user
    ],
    modules: [
      { id: "mod-a1", course_id: "course-a-id" },
      { id: "mod-b1", course_id: "course-b-id" },
    ],
    lessons: [
      { id: "lesson-a1", module_id: "mod-a1" },
      { id: "lesson-a2", module_id: "mod-a1" },
      { id: "lesson-b1", module_id: "mod-b1" },
      { id: "lesson-b2", module_id: "mod-b1" },
      { id: "lesson-b3", module_id: "mod-b1" },
      { id: "lesson-b4", module_id: "mod-b1" },
      { id: "lesson-b5", module_id: "mod-b1" },
    ],
    progress: [{ lesson_id: "lesson-a1", completed_at: "2026-01-01T00:00:00.000Z" }],
  };

  it("scopes totalLessons/completedLessons/overallProgressPct to owned courses only, excluding an unowned published course", async () => {
    const supabase = buildSupabaseMock(fixture);
    const stats = await getDashboardStats(supabase as never, "user-1");

    expect(stats.totalLessons).toBe(2);
    expect(stats.completedLessons).toBe(1);
    expect(stats.overallProgressPct).toBe(50);
    expect(stats.totalCourses).toBe(1);
  });

  it("returns zeroed stats (not an error) when the user owns no course", async () => {
    const supabase = buildSupabaseMock({ ...fixture, entitlements: [], capabilities: [] });
    const stats = await getDashboardStats(supabase as never, "user-2");

    expect(stats.totalLessons).toBe(0);
    expect(stats.completedLessons).toBe(0);
    expect(stats.overallProgressPct).toBe(0);
    expect(stats.totalCourses).toBe(0);
  });
});
