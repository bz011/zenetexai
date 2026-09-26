/**
 * Bilingual URL model. English lives at the existing URLs; a page that has a
 * COMPLETE Arabic equivalent also exists at "/ar" + its English path (the
 * homepage is "/ar"). A page appears in ARABIC_EQUIVALENT_PATHS only if a real
 * Arabic route exists for it - this list drives the language switcher, the
 * hreflang annotations, the sitemap, and the middleware public-route
 * allowlist, so a page can never be advertised as bilingual without an
 * Arabic page actually behind it. Pure module: safe in middleware, server
 * and client code.
 */

export type SiteLang = "en" | "ar";

export const AR_PREFIX = "/ar";

export const ARABIC_EQUIVALENT_PATHS = [
  "/",
  "/academy",
  "/courses",
  // PMP Exam Simulator product page (dedicated Arabic sales page).
  "/courses/pmp-exam-simulator",
  "/services",
  "/services/ai-agents-automation-uae",
  "/services/whatsapp-automation-uae",
  "/services/machine-learning-uae",
  "/services/data-analytics-uae",
  "/services/power-bi-consulting-uae",
] as const;

const EQUIVALENTS = new Set<string>(ARABIC_EQUIVALENT_PATHS);

function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

export function hasArabicVersion(enPath: string): boolean {
  return EQUIVALENTS.has(normalize(enPath));
}

export function toArabicPath(enPath: string): string {
  const p = normalize(enPath);
  return p === "/" ? AR_PREFIX : `${AR_PREFIX}${p}`;
}

export function isArabicPath(pathname: string): boolean {
  const p = normalize(pathname);
  return p === AR_PREFIX || p.startsWith(`${AR_PREFIX}/`);
}

export function toEnglishPath(pathname: string): string {
  const p = normalize(pathname);
  if (!isArabicPath(p)) return p;
  const rest = p.slice(AR_PREFIX.length);
  return rest === "" ? "/" : rest;
}

export interface RouteLocale {
  /** True when this URL has an English/Arabic pair (i.e. the URL itself fixes the language). */
  mirrored: boolean;
  locale: SiteLang;
  enPath: string;
}

/** Interprets a request pathname: which language the URL fixes, and its English counterpart. */
export function resolveRouteLocale(pathname: string | null | undefined): RouteLocale {
  const p = normalize(pathname ?? "/");
  const arabic = isArabicPath(p);
  const enPath = arabic ? toEnglishPath(p) : p;
  const mirrored = hasArabicVersion(enPath);
  return { mirrored, locale: arabic ? "ar" : "en", enPath };
}

/** The URL of `enPath` in `lang` (unchanged if there is no Arabic version). */
export function pathForLang(enPath: string, lang: SiteLang): string {
  return lang === "ar" && hasArabicVersion(enPath) ? toArabicPath(enPath) : normalize(enPath);
}

/** Rewrites an internal href for Arabic readers when its target has an Arabic page; anything else passes through untouched. */
export function localizeHref(href: string, lang: SiteLang): string {
  if (lang !== "ar" || !href.startsWith("/") || href.startsWith("//")) return href;
  const match = /^([^?#]*)(.*)$/.exec(href);
  const pathPart = match?.[1] ?? href;
  const suffix = match?.[2] ?? "";
  return hasArabicVersion(pathPart) ? `${toArabicPath(pathPart)}${suffix}` : href;
}

/** Absolute-path hreflang/canonical set for a page that exists in both languages. */
export function alternatesFor(enPath: string, lang: SiteLang) {
  const en = normalize(enPath);
  const ar = toArabicPath(en);
  return {
    canonical: lang === "ar" ? ar : en,
    languages: { en, ar, "x-default": en },
  };
}
