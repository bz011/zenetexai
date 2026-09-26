import { describe, it, expect, vi, beforeEach } from "vitest";

const adminFromMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: (...args: unknown[]) => adminFromMock(...args) } }));

const reconcilePurchaseMock = vi.fn();
vi.mock("@/features/commerce/services/checkoutService", () => ({
  reconcilePurchase: (...args: unknown[]) => reconcilePurchaseMock(...args),
}));

const { GET } = await import("./route");

const SECRET = "test-cron-secret";

function makeRequest(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("http://localhost/api/cron/reconcile-purchases", { headers });
}

/** Matches purchases.select("id").eq("provider","ziina").eq("status","pending").not("provider_reference","is",null).lt("created_at", ...).limit(...) exactly. */
function mockStalePurchases(rows: { id: string }[]) {
  adminFromMock.mockImplementation(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          not: () => ({
            lt: () => ({
              limit: async () => ({ data: rows, error: null }),
            }),
          }),
        }),
      }),
    }),
  }));
}

describe("GET /api/cron/reconcile-purchases", () => {
  beforeEach(() => {
    adminFromMock.mockReset();
    reconcilePurchaseMock.mockReset();
    process.env.CRON_SECRET = SECRET;
  });

  it("refuses to run (503) when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(makeRequest(`Bearer ${SECRET}`));

    expect(response.status).toBe(503);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("rejects a request with no Authorization header", async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("rejects a request with the wrong bearer secret", async () => {
    const response = await GET(makeRequest("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("reconciles every stale pending purchase found and summarizes the outcomes", async () => {
    mockStalePurchases([{ id: "purchase-1" }, { id: "purchase-2" }, { id: "purchase-3" }]);
    reconcilePurchaseMock
      .mockResolvedValueOnce({ status: "completed" })
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValueOnce({ status: "failed" });

    const response = await GET(makeRequest(`Bearer ${SECRET}`));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ ok: true, checked: 3, completed: 1, pending: 1, failed: 1, cancelled: 0, errors: 0 });
    expect(reconcilePurchaseMock).toHaveBeenCalledTimes(3);
  });

  it("counts a reconcilePurchase rejection as an error without failing the whole sweep", async () => {
    mockStalePurchases([{ id: "purchase-1" }, { id: "purchase-2" }]);
    reconcilePurchaseMock.mockResolvedValueOnce({ status: "completed" }).mockRejectedValueOnce(new Error("Ziina API unavailable"));

    const response = await GET(makeRequest(`Bearer ${SECRET}`));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ checked: 2, completed: 1, errors: 1 });
  });

  it("is safe to invoke concurrently for an overlapping set of stale purchases - reconcilePurchase's own compare-and-swap (tested in checkoutService.test.ts) is what makes double-completion impossible, not this route", async () => {
    mockStalePurchases([{ id: "purchase-1" }]);
    reconcilePurchaseMock.mockResolvedValue({ status: "completed" });

    const [first, second] = await Promise.all([GET(makeRequest(`Bearer ${SECRET}`)), GET(makeRequest(`Bearer ${SECRET}`))]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(reconcilePurchaseMock).toHaveBeenCalledTimes(2);
  });

  it("returns an empty, successful summary when there are no stale purchases", async () => {
    mockStalePurchases([]);

    const response = await GET(makeRequest(`Bearer ${SECRET}`));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ ok: true, checked: 0 });
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });
});
