/**
 * Centralized branding config — the single place that knows about the
 * company's name, tagline, and (as of Sprint 7.6.4) the static brand-kit
 * asset paths.
 *
 * <Logo/> (src/components/brand/Logo.tsx) no longer reads BRAND_ASSETS for
 * its own in-app rendering — it renders the icon as inline SVG
 * (src/components/brand/LogoIcon.tsx, exact approved geometry hardcoded)
 * plus real HTML text set in Manrope (src/lib/fonts.ts, self-hosted via
 * next/font). That switch is what makes the arrow's shimmer animation
 * possible at all: a flat PNG can't animate one internal element while
 * the rest stays static, and inline SVG stays crisp at any size/DPI.
 *
 * BRAND_ASSETS below still matters for: the favicon (src/app/favicon.ico),
 * the app icon (src/app/icon.png), the Open Graph image
 * (src/app/opengraph-image.png), and the standalone brand-kit files in
 * /public/brand/ (print, partners, anything outside this Next app). Those
 * are still static exports of the same approved mark, regenerated from
 * the same geometry as LogoIcon.tsx - see /public/brand/preview.html for
 * a visual reference sheet of the full kit.
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

export const BRAND_ASSETS = {
  // Static brand-kit renders - NOT what <Logo/> renders in-app (see file
  // header). Kept in sync with LogoIcon.tsx's geometry for anything that
  // needs a plain image file: favicon, app icon, OG image, print/partners.
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
