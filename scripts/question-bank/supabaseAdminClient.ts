/**
 * Standalone service-role Supabase client for this script context.
 *
 * Deliberately NOT importing from `@/lib/supabase/admin` - that module is
 * built for the Next.js runtime (automatic .env.local loading, path-alias
 * resolution via the Next.js bundler). A script invoked directly via `tsx`
 * runs outside that runtime, so env vars are loaded explicitly here instead
 * of assuming they're already present.
 *
 * Lazily initialized (dotenv load included) - this module is also reachable
 * from a real Next.js Server Action chain (aiGenerationReviseService.ts ->
 * reviseQuestion.ts -> here, for the AI regenerate/repair flow), and
 * Next.js evaluates that chain during build-time page-data collection even
 * though the action body never runs then. A top-level throw here previously
 * failed the whole build on any environment where these vars weren't set
 * yet. See src/lib/supabase/admin.ts for the same pattern and full
 * rationale.
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (checked zenetexai/.env.local)");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (checked zenetexai/.env.local)");
  }

  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdmin() as object, prop, receiver);
  },
});
