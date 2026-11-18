import { describe, it, expect, vi, beforeEach } from "vitest";

const getProductBySlugMock = vi.fn();
const getCourseProductSlugMock = vi.fn();
vi.mock("@/features/commerce/services/productService", () => ({
  getProductBySlug: (...a: unknown[]) => getProductBySlugMock(...a),
  getCourseProductSlug: (...a: unknown[]) => getCourseProductSlugMock(...a),
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServer: () => ({}) }));
vi.mock("./ProductPageBody", () => ({ default: () => null }));

const { generateMetadata } = await import("./page");

const params = (slug: string) => ({ params: Promise.resolve({ courseSlug: slug }) });

/** next/navigation's notFound() throws an error carrying this digest. */
async function expectNotFound(promise: Promise<unknown>) {
  await expect(promise).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_NOT_FOUND") });
}

describe("product page metadata (drives the HTTP status)", () => {
  beforeEach(() => {
    getProductBySlugMock.mockReset();
    getCourseProductSlugMock.mockReset().mockResolvedValue(null);
  });

  it("permanently redirects a course slug (/courses/pmp) to its product page instead of a 404", async () => {
    getProductBySlugMock.mockResolvedValue(null);
    getCourseProductSlugMock.mockResolvedValue("pmp-mastery-program");
    await expect(generateMetadata(params("pmp"))).rejects.toMatchObject({
      digest: expect.stringMatching(/NEXT_REDIRECT;[^;]*;\/courses\/pmp-mastery-program;308/),
    });
  });

  it("404s a slug that does not exist instead of returning a 200 soft-404", async () => {
    getProductBySlugMock.mockResolvedValue(null);
    await expectNotFound(generateMetadata(params("does-not-exist")));
  });

  it("404s a product that exists but is not published", async () => {
    getProductBySlugMock.mockResolvedValue({ slug: "draft", is_published: false, title_en: "Draft", description_en: "x" });
    await expectNotFound(generateMetadata(params("draft")));
  });

  it("still returns metadata for a published product", async () => {
    getProductBySlugMock.mockResolvedValue({ slug: "pmp-mastery-program", is_published: true, is_free: false, title_en: "PMP Mastery Program", description_en: "A course." });
    const meta = await generateMetadata(params("pmp-mastery-program"));
    expect(meta.title).toContain("PMP Mastery Program");
    expect(meta.alternates?.canonical).toBe("/courses/pmp-mastery-program");
  });
});
