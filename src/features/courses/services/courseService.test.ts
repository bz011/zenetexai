import { describe, it, expect } from "vitest";
import { getPublicCurriculumOutline } from "./courseService";

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
