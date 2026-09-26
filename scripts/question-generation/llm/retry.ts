/**
 * Shared retry/backoff wrapper for any provider call. Retries on transient
 * failures (rate limits, timeouts, 5xx) with exponential backoff + jitter;
 * does not retry on things that will never succeed (e.g. an auth error).
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 15000,
};

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number; statusCode?: number })?.status ??
    (err as { status?: number; statusCode?: number })?.statusCode;
  if (status === 429) return true; // rate limited
  if (status !== undefined && status >= 500) return true; // provider-side error
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return message.includes("timeout") || message.includes("econnreset") || message.includes("etimedout");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries || !isRetryable(err)) {
        throw err;
      }
      const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const jitter = Math.random() * exponential * 0.25;
      await sleep(exponential + jitter);
    }
  }
  throw lastError;
}
