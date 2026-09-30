import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ getPool: () => ({ query: queryMock }) }));

const { default: BlogPostPage, generateMetadata } = await import("./page");

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

/** next/navigation's notFound() throws an error carrying this digest. */
async function expectNotFound(promise: Promise<unknown>) {
  await expect(promise).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_NOT_FOUND") });
}

describe("blog post page - removed-slug exclusion (Master Audit Wave 0-B)", () => {
  beforeEach(() => queryMock.mockReset());

  it.each([
    "transforming-learning-how-ai-is-enhancing-education-in-mena-businesses",
    "transforming-learning-how-ai-is-enhancing-employee-development-in-mena-businesses",
  ])("404s a removed slug (%s) without ever querying the database", async (slug) => {
    await expectNotFound(BlogPostPage(params(slug)));
    expect(queryMock).not.toHaveBeenCalled();
  });

  it.each([
    "transforming-learning-how-ai-is-enhancing-education-in-mena-businesses",
    "transforming-learning-how-ai-is-enhancing-employee-development-in-mena-businesses",
  ])("returns noindex metadata for a removed slug (%s), same as any nonexistent post", async (slug) => {
    const meta = await generateMetadata(params(slug));
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("still 404s a genuinely nonexistent slug that was never on the removed list (query runs, finds nothing)", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await expectNotFound(BlogPostPage(params("this-was-never-a-real-post")));
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
