import { describe, it, expect } from "vitest";
import { getUserCapabilities, hasCapability, getOwnedLearningResources } from "./entitlementService";

function buildSupabaseMock(config: {
  entitlements: { product_id: string; expires_at: string | null }[];
  capabilities: { product_id: string; capability: string }[];
  products?: { id: string; slug: string; type: string; title_en: string; title_ar: string }[];
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
        return { select: () => ({ in: async () => ({ data: config.capabilities, error: null }) }) };
      }
      if (table === "products") {
        return { select: () => ({ in: async () => ({ data: config.products ?? [], error: null }) }) };
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
