/**
 * Route access classification for the middleware gate.
 *
 * Three classes, decided by pathname only (no session, no I/O), so the whole
 * policy is unit-testable and reviewable in one place:
 *
 *  - "public":  reachable without an account (marketing, product pages, auth
 *               pages, SEO files, /api which authorizes itself, ...).
 *  - "private": a real authenticated area. An anonymous visitor is sent to
 *               /login and brought back afterwards.
 *  - "unknown": matches neither list. There is nothing here for anyone, so an
 *               anonymous request gets a real 404 - NOT a login redirect. A
 *               mistyped or crawled URL must not look like a login wall.
 *
 * DEFAULT-DENY IS PRESERVED: "unknown" never reaches a page for an anonymous
 * visitor, so a newly added private route that is forgotten here fails
 * closed (404 for anonymous users) instead of exposed. tests/routeAccess.test.ts
 * scans every page.tsx under src/app and fails if a route is in neither list,
 * so a forgotten entry is caught in CI rather than in production.
 *
 * Role/authorization checks are NOT done in middleware; every protected page
 * and action still calls requireUser/requireRole (lib/auth/requireRole.ts).
 */

import { ARABIC_EQUIVALENT_PATHS, toArabicPath } from "@/lib/i18nRoutes";

export const PUBLIC_ROUTES: ReadonlySet<string> = new Set<string>([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/about",
  "/services",
  // "/services" is an exact match, not a prefix: every public sub-page needs its own entry.
  "/services/ai-agents-automation-uae",
  "/services/whatsapp-automation-uae",
  "/services/machine-learning-uae",
  "/services/data-analytics-uae",
  "/services/power-bi-consulting-uae",
  "/academy",
  "/resources",
  "/contact",
  "/enroll",
  // SEO infrastructure (Next metadata routes) - crawlers have no session.
  "/sitemap.xml",
  "/robots.txt",
  // Arabic pages, matched EXACTLY (no "/ar" prefix rule): only pages with a
  // real Arabic route are public; derived from the list that drives hreflang
  // and the sitemap.
  ...ARABIC_EQUIVALENT_PATHS.map(toArabicPath),
]);

/**
 * Public areas with dynamic sub-paths, matched on a path-SEGMENT boundary
 * ("/blog" and "/blog/x" match, "/blogger" does not).
 *  - /courses: storefront + product pages are browsable without an account;
 *    lesson/assessment pages under it still call requireUser() themselves.
 *  - /checkout: Ziina return flow; the pages call requireUser() themselves.
 *  - /verify: public certificate verification.
 *  - /auth, /api: auth callback and self-authorizing API routes.
 */
export const PUBLIC_PREFIXES: readonly string[] = ["/blog", "/auth", "/api", "/courses", "/checkout", "/verify"];

/** Authenticated application areas (segment-boundary prefixes). */
export const PRIVATE_PREFIXES: readonly string[] = ["/dashboard", "/certificate", "/pmp", "/admin"];

export type RouteAccess = "public" | "private" | "unknown";

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function classifyRoute(rawPathname: string): RouteAccess {
  const pathname = normalize(rawPathname);
  if (PUBLIC_ROUTES.has(pathname)) return "public";
  if (PUBLIC_PREFIXES.some((p) => matchesPrefix(pathname, p))) return "public";
  if (PRIVATE_PREFIXES.some((p) => matchesPrefix(pathname, p))) return "private";
  return "unknown";
}

/**
 * Internal paths an anonymous request for an unknown URL is rewritten to.
 * They match no real route, so they fall into the catch-all 404 page of the
 * right language while the browser keeps the original URL.
 */
export const NOT_FOUND_REWRITE_EN = "/__not_found__";
export const NOT_FOUND_REWRITE_AR = "/ar/__not_found__";

export function notFoundRewriteFor(pathname: string): string {
  const p = normalize(pathname);
  return p === "/ar" || p.startsWith("/ar/") ? NOT_FOUND_REWRITE_AR : NOT_FOUND_REWRITE_EN;
}
