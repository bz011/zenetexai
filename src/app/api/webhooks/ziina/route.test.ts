import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";

const adminFromMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: (...args: unknown[]) => adminFromMock(...args) } }));

const reconcilePurchaseMock = vi.fn();
vi.mock("@/features/commerce/services/checkoutService", () => ({
  reconcilePurchase: (...args: unknown[]) => reconcilePurchaseMock(...args),
}));

const { POST } = await import("./route");

const SECRET = "test-webhook-secret";

function sign(body: string, secret = SECRET): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function makeRequest(body: string, signature?: string): Request {
  const headers = new Headers();
  if (signature !== undefined) headers.set("x-hmac-signature", signature);
  return new Request("http://localhost/api/webhooks/ziina", { method: "POST", body, headers });
}

/** Matches purchases.select("id").eq("provider","ziina").eq("provider_reference", id).maybeSingle() exactly. */
function mockPurchaseLookup(data: { id: string } | null) {
  adminFromMock.mockImplementation(() => ({
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data, error: null }) }) }) }),
  }));
}

describe("POST /api/webhooks/ziina", () => {
  beforeEach(() => {
    adminFromMock.mockReset();
    reconcilePurchaseMock.mockReset();
    process.env.ZIINA_WEBHOOK_SECRET = SECRET;
  });

  it("rejects with 503 when ZIINA_WEBHOOK_SECRET is not configured, rather than accepting unverifiable deliveries", async () => {
    delete process.env.ZIINA_WEBHOOK_SECRET;
    const body = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "intent-1" } });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(503);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("rejects a request with no signature header", async () => {
    const body = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "intent-1" } });

    const response = await POST(makeRequest(body));

    expect(response.status).toBe(401);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("rejects a request with a well-formed but incorrect signature", async () => {
    const body = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "intent-1" } });

    const response = await POST(makeRequest(body, "0".repeat(64)));

    expect(response.status).toBe(401);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("rejects a request signed with the wrong secret", async () => {
    const body = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "intent-1" } });

    const response = await POST(makeRequest(body, sign(body, "wrong-secret")));

    expect(response.status).toBe(401);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("rejects a signature computed over a DIFFERENT body than the one delivered (tamper detection)", async () => {
    const originalBody = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "intent-1" } });
    const tamperedBody = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "intent-2" } });

    const response = await POST(makeRequest(tamperedBody, sign(originalBody)));

    expect(response.status).toBe(401);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("handles a malformed JSON body safely after signature verification succeeds", async () => {
    const body = "{not valid json";

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(400);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("acknowledges with 2xx but ignores an event type it doesn't act on (e.g. refund.status.updated), so Ziina doesn't burn retries on it", async () => {
    const body = JSON.stringify({ event: "refund.status.updated", data: { id: "refund-1" } });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ignored).toBe(true);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("acknowledges but never calls reconcilePurchase when no local purchase matches the payment intent id", async () => {
    mockPurchaseLookup(null);
    const body = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "unknown-intent" } });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.matched).toBe(false);
    expect(reconcilePurchaseMock).not.toHaveBeenCalled();
  });

  it("looks up the purchase by provider_reference and reconciles it on a validly signed payment_intent.status.updated event", async () => {
    mockPurchaseLookup({ id: "purchase-1" });
    reconcilePurchaseMock.mockResolvedValue({ status: "completed" });
    const body = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "intent-1", status: "completed" } });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(reconcilePurchaseMock).toHaveBeenCalledWith("purchase-1");
    const json = await response.json();
    expect(json.status).toBe("completed");
  });

  it("never trusts the payload's own status/amount - only data.id is read before delegating to reconcilePurchase", async () => {
    mockPurchaseLookup({ id: "purchase-1" });
    reconcilePurchaseMock.mockResolvedValue({ status: "pending" });
    // A forged-looking payload claiming completed/full amount - since the
    // signature is valid here (this IS a genuine Ziina delivery in this
    // test), the point is that reconcilePurchase is called with only the
    // purchase id, never with this payload's status/amount fields.
    const body = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "intent-1", status: "completed", amount: 999999999 } });

    await POST(makeRequest(body, sign(body)));

    expect(reconcilePurchaseMock).toHaveBeenCalledWith("purchase-1");
    expect(reconcilePurchaseMock).toHaveBeenCalledTimes(1);
  });

  it("is safe under duplicate delivery of the same event (Ziina retries up to 3x on any non-2xx) - each delivery reconciles independently, which is idempotent by construction in reconcilePurchase itself", async () => {
    mockPurchaseLookup({ id: "purchase-1" });
    reconcilePurchaseMock.mockResolvedValue({ status: "completed" });
    const body = JSON.stringify({ event: "payment_intent.status.updated", data: { id: "intent-1" } });
    const signature = sign(body);

    const first = await POST(makeRequest(body, signature));
    const second = await POST(makeRequest(body, signature));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(reconcilePurchaseMock).toHaveBeenCalledTimes(2);
  });
});
