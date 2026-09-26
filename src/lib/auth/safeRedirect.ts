/**
 * Single validator for every "where do we send the user after auth" decision
 * in the app (email-link callback `next`, login page `redirectTo`).
 *
 * Never redirect to a caller-supplied path without validating it first — an
 * unchecked `next`/`redirectTo` param is an open redirect.
 *
 * Previously this was an exact-match allow-list of 8 static paths, which
 * meant every dynamic protected route (a lesson, an assessment, a mock-exam
 * attempt, a practice session, the certificate page, any /admin sub-page)
 * never matched, so a logged-out visitor who followed a link to any of those
 * was silently dumped on /dashboard after logging in instead of back where
 * they started. Fixed by validating structurally instead of enumerating
 * every route by hand:
 *
 *  1. Resolve `next` against a fixed dummy origin with the real WHATWG URL
 *     parser (not a hand-rolled regex). This is what actually neutralizes
 *     every open-redirect trick in one step: an absolute URL
 *     ("https://evil.com/x"), a protocol-relative one ("//evil.com/x"), or a
 *     backslash trick ("/\evil.com") all resolve to a DIFFERENT `.host` than
 *     our dummy origin, and get rejected by the host check below. A `..`
 *     path-traversal segment ("/checkout/success/../../admin") is also
 *     resolved by the same parser, but - importantly - it can only ever
 *     collapse to another same-origin, already-normal path (here, "/admin"),
 *     never off-site: ".." cannot cross the host boundary in a relative URL,
 *     so it is not an open-redirect vector at all, just path arithmetic.
 *  2. Once same-origin is confirmed, check the *normalized* pathname against
 *     a small set of known section prefixes below, so new dynamic routes
 *     under an already-listed section (a new lesson id, a new admin page)
 *     are covered automatically instead of needing a new exact-match entry
 *     every time.
 */

// Two paths outside every prefix below that still need to be reachable by
// exact match: the PMP Exam Simulator's own Arabic URL (its English twin is
// already covered by the "/courses" prefix) and the bare corporate homepage
// login return (rare, but same-origin and harmless to allow explicitly).
const ALLOWED_EXACT = new Set<string>(["/ar/courses/pmp-exam-simulator", "/"]);

// Section roots covering every real protected/return destination in the app:
// dashboard, admin (all sub-pages), profile, password reset, the two Ziina
// return routes, the courses area (storefront, product pages, lessons,
// assessments), PMP practice + mock exam, and the certificate page.
const ALLOWED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/profile",
  "/reset-password",
  "/checkout/success",
  "/checkout/cancel",
  "/courses",
  "/pmp",
  "/certificate",
];

const DEFAULT_REDIRECT = "/dashboard";

function isKnownAppPath(pathname: string): boolean {
  if (ALLOWED_EXACT.has(pathname)) return true;
  return ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveSafeRedirect(next: string | null | undefined): string {
  if (!next) return DEFAULT_REDIRECT;

  let url: URL;
  try {
    url = new URL(next, "http://localhost");
  } catch {
    return DEFAULT_REDIRECT;
  }

  // Only a genuinely same-origin relative path keeps this dummy host/scheme;
  // any absolute, protocol-relative, or non-http(s) value (including
  // "javascript:...") resolves to something else here and is rejected.
  if (url.host !== "localhost" || url.protocol !== "http:") return DEFAULT_REDIRECT;

  return isKnownAppPath(url.pathname) ? url.pathname + url.search + url.hash : DEFAULT_REDIRECT;
}
