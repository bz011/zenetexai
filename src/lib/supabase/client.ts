/**
 * Supabase Client (Browser/Client-Side)
 *
 * This is used in React components and browser-side code.
 * It uses the ANON_KEY for public operations.
 * RLS policies control what users can access.
 *
 * Created using @supabase/ssr for Next.js App Router compatibility
 *
 * Lazily initialized (see admin.ts for the full rationale): this module is
 * imported by AuthContext, which mounts at the root layout, so nearly
 * every page's server-side build/prerender pass previously risked the same
 * build-time throw as the admin client if these vars weren't scoped to a
 * given Vercel environment. NEXT_PUBLIC_* references are still statically
 * inlined by Next.js's build wherever they textually appear in the source,
 * regardless of being inside a lazily-invoked function - this doesn't
 * break that.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient as SupabaseJsClient } from "@supabase/supabase-js";

let cached: SupabaseJsClient | null = null;

function getSupabase(): SupabaseJsClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  cached = createBrowserClient(url, anonKey);
  return cached;
}

export const supabase: SupabaseJsClient = new Proxy({} as SupabaseJsClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabase() as object, prop, receiver);
  },
});

export type SupabaseClient = SupabaseJsClient;
