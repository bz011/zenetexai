import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const limitMock = vi.fn();
const ratelimitCtorMock = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation((config: unknown) => ({ __isFakeRedisClient: true, config })),
}));

vi.mock("@upstash/ratelimit", () => {
  class FakeRatelimit {
    constructor(config: unknown) {
      ratelimitCtorMock(config);
    }
    limit(identifier: string) {
      return limitMock(identifier);
    }
    static slidingWindow(requests: number, window: string) {
      return { type: "sliding-window", requests, window };
    }
  }
  return { Ratelimit: FakeRatelimit };
});

const ORIGINAL_ENV = { ...process.env };

async function freshModule() {
  vi.resetModules();
  return import("./upstashRateLimit");
}

describe("upstashRateLimit", () => {
  beforeEach(() => {
    limitMock.mockReset();
    ratelimitCtorMock.mockReset();
    process.env = { ...ORIGINAL_ENV };
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe("when Upstash is not configured", () => {
    it("isRateLimitingConfigured() is false", async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      const mod = await freshModule();
      expect(mod.isRateLimitingConfigured()).toBe(false);
    });

    it("checkRateLimit fails OPEN (allows the request) and reports configured: false, without calling the limiter", async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const mod = await freshModule();

      const result = await mod.checkRateLimit("checkout-create", "user-1");

      expect(result).toEqual({ allowed: true, configured: false });
      expect(limitMock).not.toHaveBeenCalled();
      // Fails open LOUDLY, not silently - see file header rationale.
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("NOT CONFIGURED"));
      warnSpy.mockRestore();
    });

    it("only one of the two vars set still counts as not configured", async () => {
      process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      const mod = await freshModule();
      expect(mod.isRateLimitingConfigured()).toBe(false);
    });
  });

  describe("when Upstash is configured", () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token-for-test";
    });

    it("a request below the limit is allowed", async () => {
      limitMock.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
      const mod = await freshModule();

      const result = await mod.checkRateLimit("practice-create", "user-1");

      expect(result.allowed).toBe(true);
      expect(result.configured).toBe(true);
      expect(result.retryAfterSeconds).toBeUndefined();
    });

    it("a request over the limit is rejected with a positive retryAfterSeconds", async () => {
      const resetAt = Date.now() + 12_000;
      limitMock.mockResolvedValue({ success: false, reset: resetAt });
      const mod = await freshModule();

      const result = await mod.checkRateLimit("mockexam-create", "user-1");

      expect(result.allowed).toBe(false);
      expect(result.configured).toBe(true);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("independent users do not share a quota - each gets its own limiter.limit(identifier) call", async () => {
      limitMock.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
      const mod = await freshModule();

      await mod.checkRateLimit("checkout-create", "user-a");
      await mod.checkRateLimit("checkout-create", "user-b");

      expect(limitMock).toHaveBeenNthCalledWith(1, "user-a");
      expect(limitMock).toHaveBeenNthCalledWith(2, "user-b");
    });

    it("different buckets are isolated - each bucket constructs its own Ratelimit with a distinct prefix and its own configured threshold", async () => {
      limitMock.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
      const mod = await freshModule();

      await mod.checkRateLimit("checkout-create", "user-1");
      await mod.checkRateLimit("free-enrollment", "user-1");

      expect(ratelimitCtorMock).toHaveBeenCalledTimes(2);
      const prefixes = ratelimitCtorMock.mock.calls.map((call) => (call[0] as { prefix: string }).prefix);
      expect(new Set(prefixes).size).toBe(2);
      expect(prefixes[0]).toContain("checkout-create");
      expect(prefixes[1]).toContain("free-enrollment");
    });

    it("reuses the same Ratelimit instance across repeated calls to the same bucket (does not reconstruct it every call)", async () => {
      limitMock.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
      const mod = await freshModule();

      await mod.checkRateLimit("answer-save", "user-1");
      await mod.checkRateLimit("answer-save", "user-2");
      await mod.checkRateLimit("answer-save", "user-3");

      expect(ratelimitCtorMock).toHaveBeenCalledTimes(1);
      expect(limitMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("hashIdentifier", () => {
    it("is deterministic and never returns the raw input", async () => {
      const mod = await freshModule();
      const a = mod.hashIdentifier("203.0.113.42");
      const b = mod.hashIdentifier("203.0.113.42");
      expect(a).toBe(b);
      expect(a).not.toContain("203.0.113.42");
    });

    it("different inputs produce different hashes", async () => {
      const mod = await freshModule();
      expect(mod.hashIdentifier("203.0.113.42")).not.toBe(mod.hashIdentifier("203.0.113.43"));
    });
  });

  describe("getHashedClientIp", () => {
    it("never throws and never returns a raw/plaintext value, even outside a real request scope (e.g. this test)", async () => {
      const mod = await freshModule();
      const result = mod.getHashedClientIp();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      // Should be the hash of "unknown" (no real request headers available here), not a raw IP or the literal word "unknown".
      expect(result).toBe(mod.hashIdentifier("unknown"));
    });
  });
});
