import { describe, it, expect, vi, beforeEach } from "vitest";

const checkRateLimitMock = vi.fn();
const getHashedClientIpMock = vi.fn(() => "hashed-ip");
vi.mock("@/lib/upstashRateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getHashedClientIp: () => getHashedClientIpMock(),
}));

const { POST } = await import("./route");

const VALID_BODY = {
  name: "Jane Tester",
  email: "jane@example.com",
  company: "Acme",
  inquiryType: "business",
  message: "We'd like to discuss an AI agent for lead qualification.",
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    checkRateLimitMock.mockReset();
    getHashedClientIpMock.mockClear();
    checkRateLimitMock.mockResolvedValue({ allowed: true, configured: true });
    vi.stubGlobal("fetch", vi.fn());
  });

  it("rejects with 429 and no upstream call when rate-limited", async () => {
    checkRateLimitMock.mockResolvedValue({ allowed: false, configured: true, retryAfterSeconds: 42 });

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400", async () => {
    const response = await POST(makeRequest("{not json"));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a missing required field with 400", async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, email: "" }));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects an invalid email with 400", async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, email: "not-an-email" }));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects an inquiryType outside the four allowed values", async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, inquiryType: "urgent" }));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a message over the length cap", async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, message: "x".repeat(5001) }));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("accepts a missing optional company field", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    const { company, ...withoutCompany } = VALID_BODY;
    void company;

    const response = await POST(makeRequest(withoutCompany));

    expect(response.status).toBe(200);
  });

  it("forwards valid input to the Apps Script destination and returns success", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const response = await POST(makeRequest(VALID_BODY));
    const json = (await response.json()) as { success: boolean };

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("script.google.com");
    expect(init.method).toBe("POST");
    const sentParams = init.body as URLSearchParams;
    expect(sentParams.get("name")).toBe(VALID_BODY.name);
    expect(sentParams.get("email")).toBe(VALID_BODY.email);
    expect(sentParams.get("inquiryType")).toBe(VALID_BODY.inquiryType);
    expect(sentParams.get("message")).toBe(VALID_BODY.message);
  });

  it("returns 502 without leaking upstream detail when the Apps Script rejects the request", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });

    const response = await POST(makeRequest(VALID_BODY));
    const json = (await response.json()) as { success: boolean; error: string };

    expect(response.status).toBe(502);
    expect(json.success).toBe(false);
    expect(json.error).toBe("upstream_error");
  });

  it("returns 502 when the upstream fetch throws (network failure, timeout, abort)", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(502);
  });
});
