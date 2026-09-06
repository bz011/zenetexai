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
      delete process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
      delete process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
      const mod = await freshModule();
      expect(mod.isRateLimitingConfigured()).toBe(false);
    });

    it("checkRateLimit fails OPEN (allows the request) and reports configured: false, without calling the limiter", async () => {
      delete process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
      delete process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
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
      process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = "https://example.upstash.io";
      delete process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
      const mod = await freshModule();
      expect(mod.isRateLimitingConfigured()).toBe(false);
    });
  });

  describe("when Upstash is configured", () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = "https://example.upstash.io";
      process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = "fake-token-for-test";
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

  describe("realistic threshold enforcement (regression coverage for the 2026-09-06 production incident: 7 consecutive checkout attempts were all allowed)", () => {
    it("allows exactly the checkout-create bucket's configured 5 requests, then rejects request 6, using a fake Redis that actually counts calls per identifier instead of a scripted mock return value", async () => {
      process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = "https://example.upstash.io";
      process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = "fake-token-for-test";

      vi.resetModules();
      vi.doMock("@upstash/redis", () => ({ Redis: vi.fn().mockImplementation(() => ({})) }));
      vi.doMock("@upstash/ratelimit", () => {
        class StatefulFakeRatelimit {
          private counts = new Map<string, number>();
          private requestsAllowed: number;
          constructor(config: { limiter: { requests: number } }) {
            this.requestsAllowed = config.limiter.requests;
          }
          async limit(identifier: string) {
            const count = (this.counts.get(identifier) ?? 0) + 1;
            this.counts.set(identifier, count);
            return { success: count <= this.requestsAllowed, reset: Date.now() + 5 * 60_000 };
          }
          static slidingWindow(requests: number, window: string) {
            return { requests, window };
          }
        }
        return { Ratelimit: StatefulFakeRatelimit };
      });

      const mod = await import("./upstashRateLimit");

      const results: boolean[] = [];
      for (let i = 0; i < 7; i++) {
        // eslint-disable-next-line no-await-in-loop
        const result = await mod.checkRateLimit("checkout-create", "user-incident-repro");
        results.push(result.allowed);
      }

      // Requests 1-5 succeed, 6 and 7 (exactly what the real production
      // incident observed: 7 consecutive "Buy Now" clicks, all allowed)
      // must be rejected once the limiter is actually wired to a working
      // counter - this is the behavior that was missing in production.
      expect(results).toEqual([true, true, true, true, true, false, false]);

      vi.doUnmock("@upstash/redis");
      vi.doUnmock("@upstash/ratelimit");
    });

    it("a different user gets their own independent 5-request allowance in the same window - the incident account's abuse never consumes another user's quota", async () => {
      process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = "https://example.upstash.io";
      process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = "fake-token-for-test";

      vi.resetModules();
      vi.doMock("@upstash/redis", () => ({ Redis: vi.fn().mockImplementation(() => ({})) }));
      vi.doMock("@upstash/ratelimit", () => {
        class StatefulFakeRatelimit {
          private counts = new Map<string, number>();
          private requestsAllowed: number;
          constructor(config: { limiter: { requests: number } }) {
            this.requestsAllowed = config.limiter.requests;
          }
          async limit(identifier: string) {
            const count = (this.counts.get(identifier) ?? 0) + 1;
            this.counts.set(identifier, count);
            return { success: count <= this.requestsAllowed, reset: Date.now() + 5 * 60_000 };
          }
          static slidingWindow(requests: number, window: string) {
            return { requests, window };
          }
        }
        return { Ratelimit: StatefulFakeRatelimit };
      });

      const mod = await import("./upstashRateLimit");

      for (let i = 0; i < 6; i++) {
        // eslint-disable-next-line no-await-in-loop
        await mod.checkRateLimit("checkout-create", "user-a-exhausts-their-own-quota");
      }
      const otherUserResult = await mod.checkRateLimit("checkout-create", "user-b-untouched");

      expect(otherUserResult.allowed).toBe(true);

      vi.doUnmock("@upstash/redis");
      vi.doUnmock("@upstash/ratelimit");
    });
  });
});
