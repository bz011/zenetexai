import { describe, it, expect } from "vitest";
import { getUserCapabilities, hasCapability, getOwnedLearningResources } from "./entitlementService";

function buildSupabaseMock(config: {
  entitlements: { product_id: string; expires_at: string | null }[];
  capabilities: { product_id: string; capability: string }[];
  products?: { id: string; slug: string; type: string; title_en: string; title_ar: string }[];
  /** Defaults to "student" so every pre-existing test in this file, none of
   * which is about the admin bypass, keeps representing an ordinary user
   * unchanged. */
  role?: string;
  /** Every capability the system defines, regardless of who owns what -
   * only consulted for an admin caller (mirrors product_capabilities' own
   * "anyone can view" RLS policy - see migration 019). */
  allCapabilities?: string[];
  /** Ids of free, active, published products (migration 033). Defaults to none. */
  freeProductIds?: string[];
}) {
  return {
    from: (table: string) => {
      if (table === "entitlements") {
        return {
          select: () => ({
            eq: () => ({
              eq: async () => ({ data: config.entitlements, error: null }),
            }),
          }),
        };
      }
      if (table === "product_capabilities") {
        return {
          select: () => ({
            in: async () => ({ data: config.capabilities, error: null }),
            // getUserCapabilities() calls select("capability") with no
            // further filter for an admin caller - the query object itself
            // is awaited directly in that branch.
            then: (resolve: (v: { data: unknown; error: null }) => void) =>
              resolve({ data: (config.allCapabilities ?? []).map((capability) => ({ capability })), error: null }),
          }),
        };
      }
      if (table === "products") {
        return {
          select: () => ({
            in: async () => ({ data: config.products ?? [], error: null }),
            // getFreeProductIds(): .eq("is_free").eq("is_active").eq("is_published")
            eq: () => ({ eq: () => ({ eq: async () => ({ data: (config.freeProductIds ?? []).map((id) => ({ id })), error: null }) }) }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { role: config.role ?? "student" }, error: null }) }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("getUserCapabilities", () => {
  it("returns an empty set when the user has no active entitlements", async () => {
    const supabase = buildSupabaseMock({ entitlements: [], capabilities: [] });
    const result = await getUserCapabilities(supabase as never, "user-1");
    expect(result.size).toBe(0);
  });

  it("excludes entitlements that have expired", async () => {
    const supabase = buildSupabaseMock({
      entitlements: [{ product_id: "product-1", expires_at: "2020-01-01T00:00:00.000Z" }],
      capabilities: [{ product_id: "product-1", capability: "course:pmp" }],
    });
    const result = await getUserCapabilities(supabase as never, "user-1");
    expect(result.has("course:pmp")).toBe(false);
  });

  it("includes entitlements with no expiry (lifetime access)", async () => {
    const supabase = buildSupabaseMock({
      entitlements: [{ product_id: "product-1", expires_at: null }],
      capabilities: [{ product_id: "product-1", capability: "course:pmp" }],
    });
    const result = await getUserCapabilities(supabase as never, "user-1");
    expect(result.has("course:pmp")).toBe(true);
  });

  it("includes every capability from a bundle product", async () => {
    const supabase = buildSupabaseMock({
      entitlements: [{ product_id: "bundle-1", expires_at: "2099-01-01T00:00:00.000Z" }],
      capabilities: [
        { product_id: "bundle-1", capability: "course:pmp" },
        { product_id: "bundle-1", capability: "practice:pmp" },
        { product_id: "bundle-1", capability: "mock_exam:pmp" },
      ],
    });
    const result = await getUserCapabilities(supabase as never, "user-1");
    expect(result.has("course:pmp")).toBe(true);
    expect(result.has("practice:pmp")).toBe(true);
    expect(result.has("mock_exam:pmp")).toBe(true);
  });

  // --- Admin full-PMP-access requirement: admin gets every capability the
  // system defines, with ZERO entitlement rows - never via a fake purchase,
  // enrollment, or manually-inserted entitlement. Mirrors the database-layer
  // bypass in has_active_capability() (migration 026). ---

  it("an admin gets every capability the system defines, even with zero entitlements", async () => {
    const supabase = buildSupabaseMock({
      role: "admin",
      entitlements: [],
      capabilities: [],
      allCapabilities: ["course:pmp", "practice:pmp", "mock_exam:pmp"],
    });
    const result = await getUserCapabilities(supabase as never, "admin-1");
    expect(result.has("course:pmp")).toBe(true);
    expect(result.has("practice:pmp")).toBe(true);
    expect(result.has("mock_exam:pmp")).toBe(true);
  });

  it("an instructor (not admin) is NOT granted the bypass - only role='admin' qualifies", async () => {
    const supabase = buildSupabaseMock({ role: "instructor", entitlements: [], capabilities: [] });
    const result = await getUserCapabilities(supabase as never, "instructor-1");
    expect(result.size).toBe(0);
  });
});

describe("hasCapability", () => {
  it("returns false for a capability the user does not hold", async () => {
    const supabase = buildSupabaseMock({ entitlements: [], capabilities: [] });
    expect(await hasCapability(supabase as never, "user-1", "course:pmp")).toBe(false);
  });

  it("a course-only entitlement does not leak simulator capabilities", async () => {
    const supabase = buildSupabaseMock({
      entitlements: [{ product_id: "course-product", expires_at: null }],
      capabilities: [{ product_id: "course-product", capability: "course:pmp" }],
    });
    expect(await hasCapability(supabase as never, "user-1", "practice:pmp")).toBe(false);
    expect(await hasCapability(supabase as never, "user-1", "mock_exam:pmp")).toBe(false);
  });

  it("a simulator-only entitlement does not leak course capability", async () => {
    const supabase = buildSupabaseMock({
      entitlements: [{ product_id: "simulator-product", expires_at: null }],
      capabilities: [
        { product_id: "simulator-product", capability: "practice:pmp" },
        { product_id: "simulator-product", capability: "mock_exam:pmp" },
      ],
    });
    expect(await hasCapability(supabase as never, "user-1", "course:pmp")).toBe(false);
  });

  it("an admin has course:pmp, practice:pmp, and mock_exam:pmp with zero entitlements", async () => {
    const supabase = buildSupabaseMock({
      role: "admin",
      entitlements: [],
      capabilities: [],
      allCapabilities: ["course:pmp", "practice:pmp", "mock_exam:pmp"],
    });
    expect(await hasCapability(supabase as never, "admin-1", "course:pmp")).toBe(true);
    expect(await hasCapability(supabase as never, "admin-1", "practice:pmp")).toBe(true);
    expect(await hasCapability(supabase as never, "admin-1", "mock_exam:pmp")).toBe(true);
  });

  it("a student without any entitlement remains blocked from all three PMP capabilities", async () => {
    const supabase = buildSupabaseMock({ role: "student", entitlements: [], capabilities: [] });
    expect(await hasCapability(supabase as never, "student-1", "course:pmp")).toBe(false);
    expect(await hasCapability(supabase as never, "student-1", "practice:pmp")).toBe(false);
    expect(await hasCapability(supabase as never, "student-1", "mock_exam:pmp")).toBe(false);
  });

  it("a student WITH the correct entitlement remains allowed (admin bypass logic never interferes with real access)", async () => {
    const supabase = buildSupabaseMock({
      role: "student",
      entitlements: [{ product_id: "simulator-product", expires_at: null }],
      capabilities: [
        { product_id: "simulator-product", capability: "practice:pmp" },
        { product_id: "simulator-product", capability: "mock_exam:pmp" },
      ],
    });
    expect(await hasCapability(supabase as never, "student-1", "practice:pmp")).toBe(true);
    expect(await hasCapability(supabase as never, "student-1", "mock_exam:pmp")).toBe(true);
    expect(await hasCapability(supabase as never, "student-1", "course:pmp")).toBe(false);
  });
});

describe("getOwnedLearningResources", () => {
  it("returns an empty list when nothing is active", async () => {
    const supabase = buildSupabaseMock({ entitlements: [], capabilities: [] });
    expect(await getOwnedLearningResources(supabase as never, "user-1")).toEqual([]);
  });

  it("returns owned products with their capabilities and expiry, excluding expired ones", async () => {
    const supabase = buildSupabaseMock({
      entitlements: [
        { product_id: "product-1", expires_at: "2099-01-01T00:00:00.000Z" },
        { product_id: "product-2", expires_at: "2020-01-01T00:00:00.000Z" },
      ],
      capabilities: [{ product_id: "product-1", capability: "course:pmp" }],
      products: [{ id: "product-1", slug: "pmp-mastery-program", type: "course", title_en: "PMP Mastery Program", title_ar: "برنامج احتراف PMP" }],
    });

    const result = await getOwnedLearningResources(supabase as never, "user-1");
    expect(result).toHaveLength(1);
    expect(result[0].productSlug).toBe("pmp-mastery-program");
    expect(result[0].capabilities).toEqual(["course:pmp"]);
  });
});

describe("permanently free products (migration 033)", () => {
  const caps = [
    { product_id: "mastery", capability: "course:pmp" },
    { product_id: "simulator", capability: "practice:pmp" },
    { product_id: "simulator", capability: "mock_exam:pmp" },
    { product_id: "other-paid", capability: "course:other" },
  ];
  // The mock's .in() ignores ids, so capabilities are filtered per test to the
  // product ids the service actually asked for.
  function mockFor(entitled: string[], free: string[]) {
    const ids = new Set([...entitled, ...free]);
    return buildSupabaseMock({
      entitlements: entitled.map((product_id) => ({ product_id, expires_at: null })),
      capabilities: caps.filter((c) => ids.has(c.product_id)),
      products: [
        { id: "mastery", slug: "pmp-mastery-program", type: "course", title_en: "Mastery", title_ar: "Mastery" },
        { id: "simulator", slug: "pmp-exam-simulator", type: "simulator", title_en: "Simulator", title_ar: "Simulator" },
      ].filter((p) => ids.has(p.id)),
      freeProductIds: free,
    });
  }

  it("a signed-in student with no entitlement holds every free capability", async () => {
    const supabase = mockFor([], ["mastery", "simulator"]);
    for (const c of ["course:pmp", "practice:pmp", "mock_exam:pmp"]) {
      expect(await hasCapability(supabase as never, "student-a", c)).toBe(true);
    }
  });

  it("free access never extends to a paid product's capabilities", async () => {
    const supabase = mockFor([], ["mastery", "simulator"]);
    expect(await hasCapability(supabase as never, "student-a", "course:other")).toBe(false);
  });

  it("paid entitlements keep working alongside free products", async () => {
    const supabase = mockFor(["other-paid"], ["mastery"]);
    const result = await getUserCapabilities(supabase as never, "student-b");
    expect([...result].sort()).toEqual(["course:other", "course:pmp"]);
  });

  it("lists free products on the dashboard with no expiry", async () => {
    const supabase = mockFor([], ["mastery", "simulator"]);
    const owned = await getOwnedLearningResources(supabase as never, "student-a");
    expect(owned.map((o) => o.productSlug).sort()).toEqual(["pmp-exam-simulator", "pmp-mastery-program"]);
    expect(owned.every((o) => o.expiresAt === null)).toBe(true);
  });
});
