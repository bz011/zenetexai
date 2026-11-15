import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

type Verdict = { ok: boolean; saved: boolean; emailed: boolean; duplicate?: boolean; error?: string | null };
const DELIVERED: Verdict = { ok: true, saved: true, emailed: true, duplicate: false, error: null };

/** What the Apps Script web app answers: a fresh Response per call (bodies are single-use). */
function scriptReply(body: Verdict | string, init: { status?: number; contentType?: string } = {}) {
  return () =>
    Promise.resolve(
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status: init.status ?? 200,
        headers: { "Content-Type": init.contentType ?? "application/json; charset=utf-8" },
      })
    );
}

const fetchMock = () => fetch as unknown as ReturnType<typeof vi.fn>;
const sentParams = (call = 0) => (fetchMock().mock.calls[call][1] as RequestInit).body as URLSearchParams;

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
    // These cases describe the live project's Production deployment, the only one that forwards.
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "zentexai.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
    fetchMock().mockImplementation(scriptReply(DELIVERED));
    const { company, ...withoutCompany } = VALID_BODY;
    void company;

    const response = await POST(makeRequest(withoutCompany));

    expect(response.status).toBe(200);
  });

  it("forwards valid input to the Apps Script destination and returns success", async () => {
    fetchMock().mockImplementation(scriptReply(DELIVERED));

    const response = await POST(makeRequest(VALID_BODY));
    const json = (await response.json()) as { success: boolean };

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("script.google.com");
    expect(init.method).toBe("POST");
    const params = init.body as URLSearchParams;
    expect(params.get("name")).toBe(VALID_BODY.name);
    expect(params.get("email")).toBe(VALID_BODY.email);
    expect(params.get("inquiryType")).toBe(VALID_BODY.inquiryType);
    expect(params.get("message")).toBe(VALID_BODY.message);
  });

  it("returns 502 without leaking upstream detail when the Apps Script rejects the request", async () => {
    fetchMock().mockImplementation(scriptReply("Internal error", { status: 500, contentType: "text/plain" }));

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

describe("POST /api/contact outside Production", () => {
  beforeEach(() => {
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ allowed: true, configured: true });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(scriptReply(DELIVERED)));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  for (const env of ["preview", "development", "", undefined]) {
    it(`never calls the Apps Script when VERCEL_ENV is ${env === undefined ? "unset" : JSON.stringify(env)}`, async () => {
      if (env === undefined) vi.stubEnv("VERCEL_ENV", undefined as unknown as string);
      else vi.stubEnv("VERCEL_ENV", env);

      const response = await POST(makeRequest(VALID_BODY));
      const json = (await response.json()) as { success: boolean; error: string };

      expect(response.status).toBe(503);
      expect(json).toEqual({ success: false, error: "contact_disabled" });
      expect(fetch).not.toHaveBeenCalled();
    });
  }

  it("still validates input before refusing (400, no upstream call)", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const response = await POST(makeRequest({ ...VALID_BODY, email: "not-an-email" }));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("treats a near-miss value as non-production", async () => {
    vi.stubEnv("VERCEL_ENV", "Production");
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact on other Vercel projects", () => {
  beforeEach(() => {
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ allowed: true, configured: true });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(scriptReply(DELIVERED)));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  for (const host of ["zentexai-staging.vercel.app", "zenetexai-git-integration-site-v5.vercel.app", "zentexai.com.evil.example", "", undefined]) {
    it(`never forwards from a production build whose project domain is ${host === undefined ? "unset" : JSON.stringify(host)}`, async () => {
      vi.stubEnv("VERCEL_ENV", "production");
      vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", host as string);
      const response = await POST(makeRequest(VALID_BODY));
      expect(response.status).toBe(503);
      expect(fetch).not.toHaveBeenCalled();
    });
  }

  it("forwards from the live project on its www domain too", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "www.zentexai.com");
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("never forwards from a Preview of the live project", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "zentexai.com");
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact checks the Apps Script's verdict, not just HTTP 200", () => {
  let errorLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ allowed: true, configured: true });
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "www.zentexai.com");
    errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    errorLog.mockRestore();
  });

  async function submit(body: unknown = VALID_BODY) {
    const response = await POST(makeRequest(body));
    return { status: response.status, json: (await response.json()) as { success: boolean; error?: string } };
  }

  function expectNoPersonalDataLogged() {
    const logged = errorLog.mock.calls.flat().map(String).join("\n");
    for (const value of [VALID_BODY.name, VALID_BODY.email, VALID_BODY.company, VALID_BODY.message]) {
      expect(logged).not.toContain(value);
    }
  }

  it("reports success only when the row was saved and the email was sent", async () => {
    fetchMock().mockImplementation(scriptReply(DELIVERED));
    expect(await submit()).toEqual({ status: 200, json: { success: true } });
    expect(errorLog).not.toHaveBeenCalled();
  });

  it("never reports success when the row was saved but the email failed", async () => {
    fetchMock().mockImplementation(scriptReply({ ok: false, saved: true, emailed: false, error: "email_failed" }));
    const { status, json } = await submit();
    expect(status).toBe(502);
    expect(json).toEqual({ success: false, error: "notification_failed" });
    expect(String(errorLog.mock.calls[0][0])).toContain("code=email_failed");
    expectNoPersonalDataLogged();
  });

  it("treats an exhausted email quota as a failed notification", async () => {
    fetchMock().mockImplementation(scriptReply({ ok: false, saved: true, emailed: false, error: "email_quota" }));
    expect((await submit()).json.error).toBe("notification_failed");
  });

  it("returns a generic failure when the row was not saved", async () => {
    fetchMock().mockImplementation(scriptReply({ ok: false, saved: false, emailed: false, error: "save_failed" }));
    expect(await submit()).toEqual({ status: 502, json: { success: false, error: "upstream_error" } });
    expectNoPersonalDataLogged();
  });

  const invalidReplies: [string, string, string][] = [
    ["an HTML error page served with 200", "<!DOCTYPE html><html><body>TypeError: Cannot read properties of null</body></html>", "text/html"],
    ["a Google sign-in page served with 200", "<html><title>Sign in - Google Accounts</title></html>", "text/html"],
    ["plain text 'Success' (the old script)", "Success", "text/plain"],
    ["the legacy {result: success} shape", JSON.stringify({ result: "success" }), "application/json"],
    ["JSON with a field of the wrong type", JSON.stringify({ ok: "yes", saved: true, emailed: true }), "application/json"],
    ["a self-contradicting verdict", JSON.stringify({ ok: true, saved: true, emailed: false }), "application/json"],
    ["an empty body", "", "application/json"],
    ["an oversized body", JSON.stringify({ ...DELIVERED, error: "x".repeat(5000) }), "application/json"],
  ];
  for (const [label, body, contentType] of invalidReplies) {
    it(`rejects ${label}`, async () => {
      fetchMock().mockImplementation(scriptReply(body, { contentType }));
      expect(await submit()).toEqual({ status: 502, json: { success: false, error: "upstream_error" } });
      expect(String(errorLog.mock.calls[0][0])).toContain("unconfirmed upstream response");
      expectNoPersonalDataLogged();
    });
  }

  it("never logs the script's own error text, only a known-safe code", async () => {
    fetchMock().mockImplementation(scriptReply({ ok: false, saved: true, emailed: false, error: `failed for ${VALID_BODY.email}` }));
    await submit();
    expect(String(errorLog.mock.calls[0][0])).toContain("code=unknown");
    expectNoPersonalDataLogged();
  });

  it("logs no personal data when the upstream cannot be reached", async () => {
    fetchMock().mockRejectedValue(new Error(`socket hang up for ${VALID_BODY.email}`));
    expect((await submit()).status).toBe(502);
    expectNoPersonalDataLogged();
  });

  describe("duplicate submissions", () => {
    const ID = "3f1c2b9e-8d4a-4f6b-9c2e-1a7b5d0e6f42";

    it("forwards the form's submissionId unchanged", async () => {
      fetchMock().mockImplementation(scriptReply(DELIVERED));
      await submit({ ...VALID_BODY, submissionId: ID });
      expect(sentParams().get("submissionId")).toBe(ID);
    });

    it("sends the same id on every retry of the same enquiry", async () => {
      fetchMock()
        .mockImplementationOnce(scriptReply({ ok: false, saved: true, emailed: false, error: "email_failed" }))
        .mockImplementationOnce(scriptReply({ ok: true, saved: true, emailed: true, duplicate: true, error: null }));
      expect((await submit({ ...VALID_BODY, submissionId: ID })).json.error).toBe("notification_failed");
      expect(await submit({ ...VALID_BODY, submissionId: ID })).toEqual({ status: 200, json: { success: true } });
      expect(sentParams(0).get("submissionId")).toBe(ID);
      expect(sentParams(1).get("submissionId")).toBe(ID);
    });

    it("reports success for a retry the script recognises as already delivered", async () => {
      fetchMock().mockImplementation(scriptReply({ ...DELIVERED, duplicate: true }));
      expect((await submit({ ...VALID_BODY, submissionId: ID })).json.success).toBe(true);
    });

    it("generates a valid id for callers that send none", async () => {
      fetchMock().mockImplementation(scriptReply(DELIVERED));
      await submit();
      await submit();
      const first = sentParams(0).get("submissionId");
      expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(sentParams(1).get("submissionId")).not.toBe(first);
    });

    it("rejects a malformed submissionId before forwarding", async () => {
      const { status } = await submit({ ...VALID_BODY, submissionId: "1; DROP TABLE" });
      expect(status).toBe(400);
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
