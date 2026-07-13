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
 */

import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY (should be server-side only)"
  );
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type SupabaseAdmin = typeof supabaseAdmin;
