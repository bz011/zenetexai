import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const requireUserMock = vi.fn();
vi.mock("@/lib/auth/requireRole", () => ({ requireUser: (...args: unknown[]) => requireUserMock(...args) }));

const { enrollFreeInProduct } = await import("./freeEnrollmentService");

function buildSupabaseMock(rpcResult: { data?: unknown; error?: { message: string } | null }) {
  return { rpc: vi.fn(async () => rpcResult) };
}

describe("enrollFreeInProduct", () => {
  beforeEach(() => requireUserMock.mockReset());

  it("calls the grant_free_enrollment RPC with only the product slug - no price/free flag from the caller", async () => {
    const supabase = buildSupabaseMock({ data: { success: true, already_enrolled: false, expires_at: "2027-01-01T00:00:00.000Z" } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollFreeInProduct("pmp-mastery-program");

    expect(supabase.rpc).toHaveBeenCalledWith("grant_free_enrollment", { p_product_slug: "pmp-mastery-program" });
    expect(result).toEqual({ success: true, alreadyEnrolled: false, expiresAt: "2027-01-01T00:00:00.000Z" });
  });

  it("is idempotent: a second call for an already-owned product reports alreadyEnrolled without erroring", async () => {
    const supabase = buildSupabaseMock({ data: { success: true, already_enrolled: true } });
    requireUserMock.mockResolvedValue({ supabase, user: { id: "user-1" } });

    const result = await enrollFreeInProduct("pmp-mastery-program");
    expect(result).toEqual({ success: true, alreadyEnrolled: true, expiresAt: null });
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
});
