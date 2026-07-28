import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const requireUserMock = vi.fn();
vi.mock("@/lib/auth/requireRole", () => ({ requireUser: (...args: unknown[]) => requireUserMock(...args) }));

const { getMyEnrollment, enrollInCourse } = await import("./enrollmentService");

function buildSupabaseMock(config: {
  course: { id: string } | null;
  enrollment: { status: string; enrolled_at: string } | null;
  upsertError?: { message: string } | null;
}) {
  const upsertCalls: { payload: unknown; options: unknown }[] = [];
  return {
    from: (table: string) => {
      if (table === "courses") {
        const chain = {
          eq: () => chain,
          maybeSingle: async () => ({ data: config.course, error: null }),
        };
        return { select: () => chain };
      }
      if (table === "enrollments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: config.enrollment, error: null }) }),
            }),
          }),
          upsert: (payload: unknown, options: unknown) => {
            upsertCalls.push({ payload, options });
            return { error: config.upsertError ?? null };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    upsertCalls,
  };
}

describe("getMyEnrollment", () => {
  beforeEach(() => requireUserMock.mockReset());

  it("returns null when the course doesn't exist", async () => {
    const supabase = buildSupabaseMock({ course: null, enrollment: null });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await getMyEnrollment("pmp");
    expect(result).toBeNull();
  });

  it("returns null when the user has no enrollment row for the course", async () => {
    const supabase = buildSupabaseMock({ course: { id: "course-1" }, enrollment: null });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await getMyEnrollment("pmp");
    expect(result).toBeNull();
  });

  it("returns the enrollment status when one exists", async () => {
    const supabase = buildSupabaseMock({
      course: { id: "course-1" },
      enrollment: { status: "active", enrolled_at: "2026-01-01T00:00:00.000Z" },
    });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await getMyEnrollment("pmp");
    expect(result).toEqual({ status: "active", enrolled_at: "2026-01-01T00:00:00.000Z" });
  });
});

describe("enrollInCourse", () => {
  beforeEach(() => requireUserMock.mockReset());

  it("fails when the course doesn't exist or isn't published", async () => {
    const supabase = buildSupabaseMock({ course: null, enrollment: null });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollInCourse("pmp");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Course not found");
  });

  it("upserts an active enrollment scoped to the caller's own user_id", async () => {
    const supabase = buildSupabaseMock({ course: { id: "course-1" }, enrollment: null });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollInCourse("pmp");

    expect(result.success).toBe(true);
    expect(supabase.upsertCalls[0].payload).toEqual({ user_id: "user-1", course_id: "course-1", status: "active" });
  });

  it("surfaces the database error when the upsert fails", async () => {
    const supabase = buildSupabaseMock({ course: { id: "course-1" }, enrollment: null, upsertError: { message: "db down" } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollInCourse("pmp");
    expect(result.success).toBe(false);
    expect(result.error).toBe("db down");
  });
});
