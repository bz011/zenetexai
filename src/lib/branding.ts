/**
 * Centralized branding config — the single place that knows about the
 * company's name, tagline, and asset paths. Approved logo assets (Sprint
 * 7.6.1, the "B2" concept) live under /public/brand/ and src/app/ (the
 * latter for Next's file-based favicon/icon/OG conventions). Every logo
 * usage in the app goes through <Logo /> (src/components/brand/Logo.tsx),
 * which reads this config — a future logo refresh means regenerating the
 * files at these same paths, not touching every page.
 *
 * logo-horizontal.png is a DARK-BACKGROUND variant: the approved artwork's
 * wordmark ink is near-black navy, designed for a white background, and is
 * barely legible on this site's dark theme. The brand blue (icon + "AI")
 * is untouched and identical to the approved artwork; only that ink color
 * was swapped for a light tone for contrast - the same practice as any
 * brand's separate light/dark logo exports. logo-horizontal-light.png is
 * the untouched original, kept for any future light-background context.
 */

export const BRAND = {
  name: "ZentexAI",
  legalName: "ZentexAI",
  shortName: "Zentex",
  tagline: "AI Solutions. Project Excellence. Professional Learning.",
  // Not yet live - no mailbox exists at this address yet. Deliberately not
  // rendered anywhere (Footer, Contact) per Sprint 7.6.1: no personal/Gmail
  // address should ever be shown publicly. Once info@zentexai.com is a
  // real, monitored inbox, wire this back into Footer.tsx and
  // contact.details in translations.ts.
  email: "info@zentexai.com",
} as const;

export const HAS_LOGO_ASSETS = true;

export const BRAND_ASSETS = {
  logoPrimary: "/brand/icon.png",
  logoHorizontal: "/brand/logo-horizontal.png",
  logoHorizontalLight: "/brand/logo-horizontal-light.png",
  icon: "/brand/icon.png",
  favicon: "/favicon.ico",
  ogImage: "/opengraph-image.png",
} as const;
