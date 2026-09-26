/**
 * Centralized server-side authorization guards.
 *
 * Every protected page should call one of these instead of writing its own
 * `supabase.auth.getUser()` + role query — that duplication is exactly what
 * lets pages drift out of sync with each other. Add new roles/checks here,
 * not in individual page.tsx files.
 */

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { UserRole } from "@/features/auth/context/AuthContext";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
}

interface GuardOptions {
  /** Path to send an unauthenticated visitor back to after login. */
  loginRedirectTo?: string;
  /** Path to send an authenticated-but-wrong-role user to. Defaults to /dashboard. */
  onDeniedRedirectTo?: string;
}

/**
 * Non-redirecting equivalent of requireUser() for genuinely public pages
 * (Sprint 10 storefront/product pages) that render differently for a
 * logged-out visitor vs. a logged-in one, but must never force a login.
 */
export async function getOptionalUser() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

/** Requires a logged-in user. Does not fetch or check the profile/role. */
export async function requireUser(options: GuardOptions = {}) {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = options.loginRedirectTo
      ? `/login?redirectTo=${encodeURIComponent(options.loginRedirectTo)}`
      : "/login";
    redirect(loginUrl);
  }

  return { supabase, user };
}

/** Requires a logged-in user and loads their profile. */
export async function requireProfile(options: GuardOptions = {}) {
  const { supabase, user } = await requireUser(options);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile: profile as Profile | null };
}

/**
 * Requires a logged-in user whose profile role is in `allowedRoles`.
 * Authenticated users with the wrong role are redirected (not shown an
 * error page) to `onDeniedRedirectTo` (default /dashboard).
 */
export async function requireRole(allowedRoles: UserRole[], options: GuardOptions = {}) {
  const { supabase, user, profile } = await requireProfile(options);

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect(options.onDeniedRedirectTo ?? "/dashboard");
  }

  return { supabase, user, profile };
}

/** Convenience wrapper: requires the 'admin' role. */
export async function requireAdmin(options: GuardOptions = {}) {
  return requireRole(["admin"], options);
}

export type ApiAuthResult =
  | { authorized: true; supabase: SupabaseClient; user: User; profile: Profile }
  | { authorized: false; status: 401 | 403 };

/**
 * Same authorization decision as requireRole() (same query, same role
 * check - one source of truth for "how do we determine role"), but for API
 * route handlers instead of pages: returns a 401/403 result instead of
 * calling redirect(), which would otherwise send a 307 HTML redirect back
 * to a JSON API caller instead of a proper status code.
 */
export async function requireApiRole(allowedRoles: UserRole[]): Promise<ApiAuthResult> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || !allowedRoles.includes((profile as Profile).role)) {
    return { authorized: false, status: 403 };
  }

  return { authorized: true, supabase, user, profile: profile as Profile };
}
