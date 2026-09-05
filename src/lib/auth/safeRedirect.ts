/**
 * Single allow-list for every "where do we send the user after auth"
 * decision in the app (email-link callback `next`, login page `redirectTo`).
 *
 * Never redirect to a caller-supplied path without checking it against this
 * list first — an unchecked `next`/`redirectTo` param is an open redirect.
 *
 * Exact-match only on the PATHNAME (no prefix/startsWith matching on it).
 * When a new protected route is added, add its exact path here explicitly;
 * do not switch the pathname check to a prefix check, since prefix checks
 * are what allow bypasses like "/dashboard.evil.com" or "/dashboard/../../evil".
 *
 * The query string is a separate matter from that pathname check: a route
 * like /checkout/success needs to carry a dynamic, per-request value
 * (?purchase_id=...) that can never be enumerated in a static allow-list.
 * Once the pathname itself has passed the exact-match check above, its own
 * query string is safe to carry through unchanged - it can only ever
 * re-attach to that same allow-listed same-origin path, never change the
 * destination's host or path, so it creates no open-redirect risk.
 */

const ALLOWED_REDIRECTS = new Set<string>([
  "/dashboard",
  "/admin",
  "/profile",
  "/reset-password",
  "/checkout/success",
  "/checkout/cancel",
]);

const DEFAULT_REDIRECT = "/dashboard";

export function resolveSafeRedirect(next: string | null | undefined): string {
  if (!next) return DEFAULT_REDIRECT;

  const splitIndex = next.search(/[?#]/);
  const pathname = splitIndex === -1 ? next : next.slice(0, splitIndex);
  const suffix = splitIndex === -1 ? "" : next.slice(splitIndex);

  return ALLOWED_REDIRECTS.has(pathname) ? pathname + suffix : DEFAULT_REDIRECT;
}
