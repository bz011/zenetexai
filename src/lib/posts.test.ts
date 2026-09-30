import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
const getPoolMock = vi.fn(() => ({ query: queryMock }));
vi.mock("@/lib/db", () => ({ getPool: () => getPoolMock() }));

const { fetchPublishedPosts, REMOVED_SLUGS } = await import("./posts");

describe("fetchPublishedPosts", () => {
  beforeEach(() => {
    queryMock.mockReset();
    getPoolMock.mockReset().mockReturnValue({ query: queryMock });
  });

  it("queries without a LIMIT clause when no limit is passed, always excluding removed slugs", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await fetchPublishedPosts();

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).not.toMatch(/LIMIT/);
    expect(sql).toMatch(/!= ALL\(\$1/);
    expect(params).toEqual([REMOVED_SLUGS]);
  });

  it("queries with a LIMIT clause and the limit as a second parameter when a limit is passed", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await fetchPublishedPosts(3);

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/LIMIT \$2/);
    expect(params).toEqual([REMOVED_SLUGS, 3]);
  });

  it("passes exactly the two audited-removed slugs to the exclusion filter, no more and no fewer", async () => {
    expect(REMOVED_SLUGS).toEqual([
      "transforming-learning-how-ai-is-enhancing-education-in-mena-businesses",
      "transforming-learning-how-ai-is-enhancing-employee-development-in-mena-businesses",
    ]);
  });

  it("returns the rows from the query on success", async () => {
    const rows = [{ id: "1", title: "Post", slug: "post", body: "body", published_at: "2026-01-01" }];
    queryMock.mockResolvedValue({ rows });

    const result = await fetchPublishedPosts();
    expect(result).toEqual(rows);
  });

  it("returns an empty array instead of throwing when the pool is unavailable (e.g. DATABASE_URL unset)", async () => {
    getPoolMock.mockImplementation(() => {
      throw new Error("DATABASE_URL environment variable is not set");
    });

    const result = await fetchPublishedPosts();
    expect(result).toEqual([]);
  });
});
