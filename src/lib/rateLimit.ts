/**
 * Minimal in-memory sliding-window rate limiter. There is no existing
 * rate-limiting infrastructure in this project (no Redis/Upstash) - adding
 * one is a bigger infra decision than this task warrants, so this is a
 * proportionate, zero-dependency guard instead.
 *
 * Known limitation, stated plainly: this is per-serverless-instance state.
 * On Vercel it resets on cold start and is not shared across concurrent
 * instances, so it is a best-effort abuse deterrent for an already
 * admin-authenticated endpoint, not a hard distributed rate limit. Good
 * enough to blunt an accidental retry loop or a compromised admin session
 * being scripted; not a substitute for real distributed rate limiting if
 * these endpoints ever need one.
 */

const buckets = new Map<string, number[]>();

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  buckets.set(key, timestamps);
  return timestamps.length > maxRequests;
}
