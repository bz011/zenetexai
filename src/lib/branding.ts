/**
 * Centralized branding config — the single place that knows about the
 * company's name, tagline, and asset paths. Approved logo/brand assets are
 * "provided later" (per Sprint 7.6); until then every surface renders a
 * text wordmark derived from BRAND.name so nothing depends on files that
 * don't exist yet.
 *
 * To go live with real assets later:
 *   1. Drop the files into /public/brand/ using the exact names below.
 *   2. Flip HAS_LOGO_ASSETS to true.
 * Nothing else in the app needs to change — every logo usage goes through
 * <Logo /> (src/components/brand/Logo.tsx), which reads this config.
 */

export const BRAND = {
  name: "ZentexAI",
  legalName: "ZentexAI",
  shortName: "Zentex",
  tagline: "AI Solutions. Project Excellence. Professional Learning.",
  email: "hello@zenetexai.com",
} as const;

/** Flip to true once real files exist at the paths below. */
export const HAS_LOGO_ASSETS = false;

/**
 * Expected asset paths under /public/brand/ — referenced by name only so
 * <Logo /> and metadata config never hardcode a path inline. Drop files in
 * with these exact names and nothing else needs to change.
 */
export const BRAND_ASSETS = {
  logoPrimary: "/brand/logo-primary.svg",
  logoHorizontal: "/brand/logo-horizontal.svg",
  icon: "/brand/icon.svg",
  favicon: "/favicon.ico",
  // No generated OG image today: Next's dynamic ImageResponse (next/og)
  // crashes on this specific build environment (a @vercel/og bug with
  // Windows paths containing spaces, e.g. "zenetexai project\..." -
  // unrelated to app code, unfixable from here). Once a real image exists,
  // drop a STATIC file at src/app/opengraph-image.png (or .jpg) - Next's
  // static file convention picks it up automatically without touching
  // ImageResponse at all, avoiding this bug entirely.
  ogImage: "/brand/og-image.png",
} as const;
