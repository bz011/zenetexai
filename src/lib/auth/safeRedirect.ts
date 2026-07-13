/**
 * Single allow-list for every "where do we send the user after auth"
 * decision in the app (email-link callback `next`, login page `redirectTo`).
 *
 * Never redirect to a caller-supplied path without checking it against this
 * list first — an unchecked `next`/`redirectTo` param is an open redirect.
 *
 * Exact-match only (no prefix/startsWith matching). When a new protected
 * route is added, add its exact path here explicitly; do not switch this to
 * a prefix check, since prefix checks are what allow bypasses like
 * "/dashboard.evil.com" or "/dashboard/../../evil".
 */

const ALLOWED_REDIRECTS = new Set<string>([
  "/dashboard",
  "/admin",
  "/profile",
  "/reset-password",
]);

const DEFAULT_REDIRECT = "/dashboard";

export function resolveSafeRedirect(next: string | null | undefined): string {
  if (!next) return DEFAULT_REDIRECT;
  return ALLOWED_REDIRECTS.has(next) ? next : DEFAULT_REDIRECT;
}
