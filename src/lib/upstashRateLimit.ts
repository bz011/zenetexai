/**
 * Distributed, cross-instance rate limiting (Upstash Redis + @upstash/ratelimit).
 *
 * WHY THIS EXISTS: Vercel serverless functions do not share memory across
 * instances/regions/cold-starts, so the existing in-memory limiter
 * (src/lib/rateLimit.ts - untouched, still fine for its one existing use on
 * the two admin-only blog routes) cannot meaningfully protect a public or
 * per-user endpoint under real traffic. This module is the real, shared
 * counter, backed by Upstash's REST-based Redis (works from any serverless
 * runtime, no persistent connection needed).
 *
 * CONFIGURATION: requires UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN (server-only - never NEXT_PUBLIC_, never
 * printed/logged). Both must be set together for a real Upstash Redis
 * database (created at upstash.com or via the Vercel Marketplace Upstash
 * integration) - see isRateLimitingConfigured().
 *
 * FAIL-OPEN, LOUDLY, WHEN NOT CONFIGURED: if the env vars are absent,
 * checkRateLimit() returns { allowed: true, configured: false } and logs a
 * console.warn on every call naming the bucket - the request proceeds
 * completely unprotected, exactly as it did before this module existed.
 * This is a deliberate choice, not an oversight: failing CLOSED here would
 * take down checkout/enrollment/simulator-start for every real user the
 * moment this code ships, before anyone has had a chance to configure
 * Upstash in Vercel - an availability outage in the name of a security
 * fix. The distinction from "silently falling back to the in-memory
 * limiter" (explicitly disallowed) is that this fails open VISIBLY (a
 * warning on every single request, impossible to miss in Vercel's logs)
 * rather than pretending to protect anything. Callers must not claim rate
 * limiting is active based on this module alone - check `configured`.
 *
 * FAIL-CLOSED WHEN CONFIGURED AND OVER LIMIT: once Upstash is reachable,
 * exceeding a bucket's limit always returns { allowed: false, ... } and
 * every call site in this codebase treats that as a hard rejection for
 * the mutation in question (see checkoutService.ts, freeEnrollmentService.ts,
 * practiceSessionService.ts, examAttemptService.ts, progressService.ts,
 * noteService.ts, and the assessment submit route).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export function isRateLimitingConfigured(): boolean {
  return getRedis() !== null;
}

/**
 * Every protected bucket, with an explicit, individually-reasoned limit -
 * never one arbitrary global number. Window strings are @upstash/ratelimit's
 * own duration format ("<n> <s|m|h>").
 */
const BUCKET_LIMITS = {
  "checkout-create": { requests: 5, window: "5 m" },
  "checkout-create-ip": { requests: 15, window: "5 m" },
  "free-enrollment": { requests: 5, window: "10 m" },
  "free-enrollment-ip": { requests: 20, window: "10 m" },
  "practice-create": { requests: 10, window: "5 m" },
  "mockexam-create": { requests: 5, window: "10 m" },
  "assessment-submit": { requests: 10, window: "1 m" },
  "answer-save": { requests: 60, window: "1 m" },
  "progress-write": { requests: 60, window: "1 m" },
  "note-write": { requests: 30, window: "1 m" },
} as const;

export type RateLimitBucket = keyof typeof BUCKET_LIMITS;

const limiters = new Map<RateLimitBucket, Ratelimit>();

function getLimiter(bucket: RateLimitBucket, client: Redis): Ratelimit {
  const existing = limiters.get(bucket);
  if (existing) return existing;

  const { requests, window } = BUCKET_LIMITS[bucket];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `zentexai:ratelimit:${bucket}`,
    analytics: false,
  });
  limiters.set(bucket, limiter);
  return limiter;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Whether Upstash is actually configured - false means this result did not enforce anything. */
  configured: boolean;
  retryAfterSeconds?: number;
}

/**
 * `identifier` should already be a safe, non-reversible-enough key
 * component (a UUID like auth.uid(), or a hashed IP via hashIdentifier()
 * below) - never a raw email or token. See hashIdentifier().
 */
export async function checkRateLimit(bucket: RateLimitBucket, identifier: string): Promise<RateLimitResult> {
  const client = getRedis();
  if (!client) {
    console.warn(
      `[upstashRateLimit] NOT CONFIGURED (UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN missing) - ` +
        `request allowed WITHOUT distributed rate limiting. bucket=${bucket}`
    );
    return { allowed: true, configured: false };
  }

  const limiter = getLimiter(bucket, client);
  const { success, reset } = await limiter.limit(identifier);
  return {
    allowed: success,
    configured: true,
    retryAfterSeconds: success ? undefined : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
  };
}

/**
 * Non-reversible identifier for Redis keys - use for anything derived from
 * an IP address (or any value that could otherwise be considered PII).
 * Never used for auth.uid() (already an opaque UUID, safe as-is) or for
 * email/tokens (never put in a rate-limit key at all - see file header).
 */
export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

/**
 * The client's real IP as Vercel's edge determines it - NOT trusted from
 * an arbitrary client-supplied header. Per Vercel's own documentation
 * (vercel.com/docs/headers/request-headers): "If you are trying to use
 * Vercel behind a proxy, we currently overwrite the X-Forwarded-For header
 * and do not forward external IPs. This restriction is in place to
 * prevent IP spoofing." x-vercel-forwarded-for is documented as
 * equivalent and immune even to an *additional* proxy layer in front of
 * Vercel, so it is preferred when present. Returns a hashed identifier,
 * never the raw IP (see hashIdentifier()).
 */
export function getHashedClientIp(): string {
  let raw = "unknown";
  try {
    const h = headers();
    raw = h.get("x-vercel-forwarded-for") || h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown";
  } catch {
    // headers() throws outside a real request scope (e.g. a unit test, or
    // any call site not actually inside a Server Action/Route Handler
    // request lifecycle) - fall back to the "unknown" bucket rather than
    // crashing the caller. In real production traffic this always
    // succeeds; this only ever matters in tests/tooling.
  }
  const ip = raw.split(",")[0]!.trim();
  return hashIdentifier(ip);
}

export interface RateLimitedError {
  success: false;
  error: string;
  rateLimited: true;
  retryAfterSeconds?: number;
}

/** Shared, safe result shape for server actions (which cannot return a raw HTTP status) - see each call site's ERROR_MESSAGES-style user-facing copy. */
export function rateLimitedResult(retryAfterSeconds: number | undefined): RateLimitedError {
  return { success: false, error: "rate_limited", rateLimited: true, retryAfterSeconds };
}
