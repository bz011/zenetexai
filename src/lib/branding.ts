/**
 * Centralized branding config — the single place that knows about the
 * company's name, tagline, and asset paths. Approved logo assets (Sprint
 * 7.6.2 - the circular gradient "Z" mark, Manrope wordmark, "Intelligence.
 * Execution. Impact." tagline) live under /public/brand/ and src/app/ (the
 * latter for Next's file-based favicon/icon/OG conventions). Every logo
 * usage in the app goes through <Logo /> (src/components/brand/Logo.tsx),
 * which reads this config — a future logo refresh means regenerating the
 * files at these same paths, not touching every page.
 *
 * No vector source file existed for the approved design (it came from a
 * reference image, not an SVG/AI export) - the SVG/PNG assets here are a
 * faithful hand-built reconstruction (same mark, same colors, same
 * Manrope typography, real font rendering via a one-time build script),
 * not a redraw from memory. See public/brand/*.svg for the full kit
 * (primary, horizontal, icon, white, black, favicon variants).
 *
 * logo-horizontal.png and icon.png are DARK-BACKGROUND-safe renders: the
 * wordmark ink is a light tone instead of navy, since navy-on-navy is
 * illegible on this site's dark theme. The brand blue/teal gradient icon
 * is unchanged either way. logo-transparent.png (in /public/brand/) keeps
 * the original navy ink, for any future light-background use.
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
  // Rendered PNGs - what <Logo/> actually displays in-app (guaranteed
  // fidelity regardless of the viewer's installed fonts). All three are
  // dark-background-safe (light ink) - this site has no light theme today.
  logoPrimary: "/brand/logo-primary.png", // icon + wordmark + tagline (footer, large placements)
  logoHorizontal: "/brand/logo-horizontal.png", // icon + wordmark, no tagline (navbar)
  logoTransparent: "/brand/logo-transparent.png", // original navy ink, for future light-bg use
  icon: "/brand/icon.png", // simplified glyph alone (compact/mobile)
  favicon: "/favicon.ico",
  ogImage: "/opengraph-image.png",
  // Vector source kit - full brand deliverables (print, partners, future
  // redesign starting point). Not consumed by <Logo/> directly.
  svg: {
    primary: "/brand/logo-primary.svg",
    horizontal: "/brand/logo-horizontal.svg",
    icon: "/brand/logo-icon.svg",
    white: "/brand/logo-white.svg",
    black: "/brand/logo-black.svg",
    favicon: "/brand/favicon.svg",
  },
} as const;
