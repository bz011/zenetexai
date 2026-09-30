/**
 * Supabase Admin Client (Server-Side Only)
 *
 * This uses SERVICE_ROLE_KEY and should ONLY be used server-side.
 * Never expose the service role key to the browser.
 *
 * Use this for:
 * - Creating user profiles after signup
 * - Admin operations
 * - Bulk imports
 * - System tasks
 *
 * Lazily initialized: the env-var check and client construction only run
 * on first actual use (the Proxy's `get` trap), not at module import time.
 * Next.js evaluates this module during build-time "Collecting page data"
 * for every route that imports it, even though the route handler body
 * never runs then - a top-level throw here previously failed the entire
 * build on any environment (e.g. a Vercel Preview deployment) where these
 * vars weren't scoped to that environment, even though no request had
 * actually happened yet. This still fails securely: a real request that
 * reaches `.from(...)`/`.rpc(...)` etc. with the vars genuinely missing
 * throws the same clear error as before, just at request time instead of
 * build time - no placeholder credentials, no silent fallback.
 *
 * NOT added (Master Audit Wave 0-D, 2026-09-30): the "server-only" hardening
 * package was tried here and reverted. Its guard works by resolving to a
 * no-op under Next.js's own "react-server" export condition and to an
 * unconditional throw otherwise - that's correct inside Next.js's real
 * build, but this project's Vitest config (vitest.config.ts) has no
 * "react-server" resolution condition, so under test every import of this
 * module - including from entirely legitimate server-side service/route
 * tests - hit the unconditional throw. Confirmed by trying it: it broke
 * batchDiversityService.test.ts, coverageIntelligenceService.test.ts,
 * examAttemptService.test.ts, and BuyNowButton.test.ts. Making it safe would
 * need a `resolve.conditions: ["react-server"]` change to vitest.config.ts,
 * which risks changing how other packages resolve under test in ways this
 * pass did not have room to fully verify - left for a dedicated follow-up
 * rather than shipped partially tested. No client component imports this
 * module today (verified directly), so the risk this package would have
 * guarded against remains theoretical, not live.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (should be server-side only)");
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdmin() as object, prop, receiver);
  },
});

export type SupabaseAdmin = SupabaseClient;
