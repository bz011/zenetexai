import { describe, it, expect, vi } from "vitest";
import { withRetry } from "./retry";

describe("withRetry", () => {
  it("returns the result on the first success without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on a 429 rate-limit error and eventually succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 429, message: "rate limited" })
      .mockResolvedValueOnce("ok");
    const result = await withRetry(fn, { baseDelayMs: 1, maxDelayMs: 2 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on a 5xx provider error", async () => {
    const fn = vi.fn().mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce("ok");
    const result = await withRetry(fn, { baseDelayMs: 1, maxDelayMs: 2 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry on a non-retryable error like a 401 auth failure", async () => {
    const fn = vi.fn().mockRejectedValue({ status: 401, message: "unauthorized" });
    await expect(withRetry(fn, { baseDelayMs: 1, maxDelayMs: 2 })).rejects.toMatchObject({ status: 401 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxRetries and surfaces the last error", async () => {
    const fn = vi.fn().mockRejectedValue({ status: 429 });
    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 2 })).rejects.toMatchObject({ status: 429 });
    expect(fn).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });
});
