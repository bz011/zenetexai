import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const requireUserMock = vi.fn();
vi.mock("@/lib/auth/requireRole", () => ({ requireUser: (...args: unknown[]) => requireUserMock(...args) }));

const checkRateLimitMock = vi.fn();
vi.mock("@/lib/upstashRateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getHashedClientIp: () => "hashed-test-ip",
}));

const { enrollFreeInProduct } = await import("./freeEnrollmentService");

interface LessonLookupConfig {
  product?: { id: string } | null;
  capabilities?: { capability: string }[];
  course?: { id: string } | null;
  modules?: { id: string }[];
  lessons?: { id: string; module_id: string; order_index: number }[];
}

/** Default: no course capability found, so findFirstLessonUrl short-circuits
 * to null - matches every test that isn't specifically exercising the
 * redirect computation. */
function buildSupabaseMock(rpcResult: { data?: unknown; error?: { message: string } | null }, lookup: LessonLookupConfig = {}) {
  const { product = null, capabilities = [], course = null, modules = [], lessons = [] } = lookup;

  return {
    rpc: vi.fn(async () => rpcResult),
    from: (table: string) => {
      if (table === "products") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: product }) }) }) };
      }
      if (table === "product_capabilities") {
        return { select: () => ({ eq: async () => ({ data: capabilities }) }) };
      }
      if (table === "courses") {
        return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: course }) }) }) }) };
      }
      if (table === "modules") {
        return { select: () => ({ eq: () => ({ eq: () => ({ order: async () => ({ data: modules }) }) }) }) };
      }
      if (table === "lessons") {
        return { select: () => ({ in: () => ({ eq: async () => ({ data: lessons }) }) }) };
      }
      throw new Error(`Unexpected table in test mock: ${table}`);
    },
  };
}

describe("enrollFreeInProduct", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ allowed: true, configured: true });
  });

  it("rejects BEFORE calling grant_free_enrollment when rate limited, without breaking the RPC's own idempotency guarantee (it is simply never reached)", async () => {
    const supabase = buildSupabaseMock({ data: { success: true, already_enrolled: false } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });
    checkRateLimitMock.mockResolvedValue({ allowed: false, configured: true, retryAfterSeconds: 30 });

    const result = await enrollFreeInProduct("pmp-mastery-program");

    expect(result.success).toBe(false);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("calls the grant_free_enrollment RPC with only the product slug - no price/free flag from the caller", async () => {
    const supabase = buildSupabaseMock({ data: { success: true, already_enrolled: false, expires_at: "2027-01-01T00:00:00.000Z" } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollFreeInProduct("pmp-mastery-program");

    expect(supabase.rpc).toHaveBeenCalledWith("grant_free_enrollment", { p_product_slug: "pmp-mastery-program" });
    expect(result).toEqual({ success: true, alreadyEnrolled: false, expiresAt: "2027-01-01T00:00:00.000Z", redirectTo: null });
  });

  it("is idempotent: a second call for an already-owned product reports alreadyEnrolled without erroring", async () => {
    const supabase = buildSupabaseMock({ data: { success: true, already_enrolled: true } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollFreeInProduct("pmp-mastery-program");
    expect(result).toEqual({ success: true, alreadyEnrolled: true, expiresAt: null, redirectTo: null });
  });

  it("surfaces a friendly error when no active free promotion exists (e.g. expired or not yet started)", async () => {
    const supabase = buildSupabaseMock({ data: { success: false, error: "no_active_free_promotion" } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollFreeInProduct("pmp-mastery-program");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not currently free/i);
  });

  it("fails closed on a transport/RPC error rather than granting access", async () => {
    const supabase = buildSupabaseMock({ error: { message: "connection reset" } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollFreeInProduct("pmp-mastery-program");
    expect(result.success).toBe(false);
  });

  it("redirects to the first published lesson (lowest module order, then lowest lesson order) after a successful enrollment", async () => {
    const supabase = buildSupabaseMock(
      { data: { success: true, already_enrolled: false, expires_at: "2027-01-01T00:00:00.000Z" } },
      {
        product: { id: "product-1" },
        capabilities: [{ capability: "course:pmp" }],
        course: { id: "course-1" },
        modules: [{ id: "module-1" }, { id: "module-2" }],
        lessons: [
          { id: "lesson-2b", module_id: "module-2", order_index: 0 },
          { id: "lesson-1b", module_id: "module-1", order_index: 1 },
          { id: "lesson-1a", module_id: "module-1", order_index: 0 },
        ],
      }
    );
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollFreeInProduct("pmp-mastery-program");
    expect(result.redirectTo).toBe("/courses/pmp/lessons/lesson-1a");
  });

  it("returns a null redirect (not an error) when the course has no published lessons yet", async () => {
    const supabase = buildSupabaseMock(
      { data: { success: true, already_enrolled: false } },
      { product: { id: "product-1" }, capabilities: [{ capability: "course:pmp" }], course: { id: "course-1" }, modules: [], lessons: [] }
    );
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollFreeInProduct("pmp-mastery-program");
    expect(result.success).toBe(true);
    expect(result.redirectTo).toBeNull();
  });
});
