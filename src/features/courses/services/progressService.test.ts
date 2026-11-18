import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * markLessonComplete (audit F4): progress may only be recorded on a PUBLISHED
 * lesson of a course the user can access; the course comes from the
 * database, never from the client's courseSlug.
 */
const lessons = new Map<string, { id: string; module_id: string; is_published: boolean }>();
const upserts: unknown[] = [];
const fakeSupabase = {
  from(table: string) {
    if (table === "lessons") {
      let id = "";
      const q = {
        select: () => q,
        eq: (_c: string, v: string) => ((id = v), q),
        maybeSingle: async () => ({ data: lessons.get(id) ?? null, error: null }),
      };
      return q;
    }
    if (table === "lesson_progress") {
      return { upsert: async (row: unknown) => (upserts.push(row), { error: null }) };
    }
    throw new Error(`unexpected table ${table}`);
  },
};

const courseOfModule = vi.fn<(m: string) => Promise<string | null>>();
const capability = vi.fn<(c: string) => Promise<boolean>>();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/requireRole", () => ({ requireUser: async () => ({ supabase: fakeSupabase, user: { id: "user-1" } }) }));
vi.mock("@/lib/upstashRateLimit", () => ({ checkRateLimit: async () => ({ allowed: true }) }));
vi.mock("@/features/courses/services/courseService", () => ({ getCourseSlugForModule: (_s: unknown, m: string) => courseOfModule(m) }));
vi.mock("@/features/commerce/services/entitlementService", () => ({ hasCapability: (_s: unknown, _u: string, c: string) => capability(c) }));

const { markLessonComplete } = await import("./progressService");

beforeEach(() => {
  lessons.clear();
  upserts.length = 0;
  courseOfModule.mockReset().mockResolvedValue("pmp");
  capability.mockReset().mockImplementation(async (c) => c === "course:pmp");
  lessons.set("published", { id: "published", module_id: "m2", is_published: true });
  lessons.set("hidden", { id: "hidden", module_id: "m2", is_published: false });
});

describe("markLessonComplete", () => {
  it("records progress on a published lesson of an accessible course", async () => {
    expect(await markLessonComplete("published", "pmp")).toEqual({ success: true });
    expect(upserts).toEqual([{ user_id: "user-1", lesson_id: "published" }]);
  });

  it("refuses a hidden (unpublished) lesson and writes nothing", async () => {
    expect(await markLessonComplete("hidden", "pmp")).toEqual({ success: false, error: "lesson_unavailable" });
    expect(upserts).toHaveLength(0);
  });

  it("refuses a lesson the user cannot read at all (RLS returns nothing)", async () => {
    expect(await markLessonComplete("does-not-exist", "pmp")).toMatchObject({ success: false });
    expect(upserts).toHaveLength(0);
  });

  it("checks access against the lesson's real course, not the courseSlug sent by the client", async () => {
    courseOfModule.mockResolvedValue("other-course");
    expect(await markLessonComplete("published", "pmp")).toEqual({ success: false, error: "lesson_unavailable" });
    expect(capability).toHaveBeenCalledWith("course:other-course");
    expect(upserts).toHaveLength(0);
  });

  it("refuses when the user has no access to the course", async () => {
    capability.mockResolvedValue(false);
    expect(await markLessonComplete("published", "pmp")).toMatchObject({ success: false });
    expect(upserts).toHaveLength(0);
  });
});
