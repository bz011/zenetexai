/**
 * Standalone service-role Supabase client for this script context.
 *
 * Deliberately NOT importing from `@/lib/supabase/admin` - that module is
 * built for the Next.js runtime (automatic .env.local loading, path-alias
 * resolution via the Next.js bundler). A script invoked directly via `tsx`
 * runs outside that runtime, so env vars are loaded explicitly here instead
 * of assuming they're already present.
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (checked zenetexai/.env.local)");
}
if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (checked zenetexai/.env.local)");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
