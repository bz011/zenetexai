/**
 * Supabase Client (Browser/Client-Side)
 *
 * This is used in React components and browser-side code.
 * It uses the ANON_KEY for public operations.
 * RLS policies control what users can access.
 *
 * Created using @supabase/ssr for Next.js App Router compatibility
 */

import { createBrowserClient } from "@supabase/ssr";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type SupabaseClient = typeof supabase;
