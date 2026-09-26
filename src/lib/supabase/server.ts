/**
 * Supabase Server Client (For Server Components & API Routes)
 *
 * Use this in:
 * - Server Components (app router)
 * - API routes (route.ts)
 * - Server actions
 *
 * This authenticates using the request context, NOT the service role key.
 * RLS policies still apply here.
 *
 * Created using @supabase/ssr for Next.js App Router compatibility
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware handling cookies.
          }
        },
      },
    }
  );
}

