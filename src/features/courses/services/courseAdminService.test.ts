import { describe, it, expect, vi, beforeEach } from "vitest";

const requireRoleMock = vi.fn();
const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("@/lib/auth/requireRole", () => ({ requireRole: (...args: unknown[]) => requireRoleMock(...args) }));
vi.mock("next/navigation", () => ({ redirect: (...args: unknown[]) => redirectMock(...args) }));
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePathMock(...args) }));

const { createCourse } = await import("./courseAdminService");
const initialState = { success: false };

function buildFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.append(key, value);
  return fd;
}

function mockSupabaseWithInsertResult(insertResult: { error: unknown }) {
  const insert = vi.fn().mockResolvedValue(insertResult);
  const from = vi.fn().mockReturnValue({ insert });
  return { supabase: { from }, insert, from };
}

const validFields = {
  slug: "pmp",
  title_en: "PMP Certification Prep",
  title_ar: "",
  description_en: "",
  description_ar: "",
  order_index: "0",
  is_published: "on",
};

describe("createCourse", () => {
  beforeEach(() => {
    requireRoleMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("returns field-level errors for invalid FormData (uppercase slug) without touching the database", async () => {
    const { supabase, from } = mockSupabaseWithInsertResult({ error: null });
    requireRoleMock.mockResolvedValue({ supabase });

    const formData = buildFormData({ ...validFields, slug: "PMP" });
    const result = await createCourse(initialState, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.slug).toBeDefined();
    expect(from).not.toHaveBeenCalled();
  });

  it("returns a generic user-facing message (not the raw DB error) when the Supabase insert fails", async () => {
    const { supabase } = mockSupabaseWithInsertResult({
      error: { code: "23505", message: "duplicate key value violates unique constraint", details: "Key (slug)=(pmp) already exists.", hint: null },
    });
    requireRoleMock.mockResolvedValue({ supabase });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const formData = buildFormData(validFields);
    const result = await createCourse(initialState, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to create course. Please try again.");
    // The real error must still reach server logs, tagged for searchability.
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[CREATE_COURSE_ERROR] insert failed",
      expect.objectContaining({ code: "23505" })
    );
    consoleErrorSpy.mockRestore();
  });

  it("does not treat a resolved insert with a truthy error as success - never redirects on failure", async () => {
    const { supabase } = mockSupabaseWithInsertResult({ error: { code: "42501", message: "RLS violation" } });
    requireRoleMock.mockResolvedValue({ supabase });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await createCourse(initialState, buildFormData(validFields));

    expect(redirectMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("inserts, revalidates, and redirects on a successful course creation", async () => {
    const { supabase, from, insert } = mockSupabaseWithInsertResult({ error: null });
    requireRoleMock.mockResolvedValue({ supabase });

    await createCourse(initialState, buildFormData(validFields));

    expect(from).toHaveBeenCalledWith("courses");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "pmp", title_en: "PMP Certification Prep", is_published: true, order_index: 0 })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/courses");
    expect(redirectMock).toHaveBeenCalledWith("/admin/courses");
  });
});
