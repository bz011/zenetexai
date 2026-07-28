import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
const getPoolMock = vi.fn(() => ({ query: queryMock }));
vi.mock("@/lib/db", () => ({ getPool: () => getPoolMock() }));

const { fetchPublishedPosts } = await import("./posts");

describe("fetchPublishedPosts", () => {
  beforeEach(() => {
    queryMock.mockReset();
    getPoolMock.mockReset().mockReturnValue({ query: queryMock });
  });

  it("queries without a LIMIT clause when no limit is passed", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await fetchPublishedPosts();

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).not.toMatch(/LIMIT/);
    expect(params).toEqual([]);
  });

  it("queries with a LIMIT clause and the limit as a parameter when a limit is passed", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await fetchPublishedPosts(3);

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/LIMIT \$1/);
    expect(params).toEqual([3]);
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
