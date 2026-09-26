import { Manrope, Noto_Sans_Arabic } from "next/font/google";

/**
 * Self-hosted by Next at build time (no runtime request to Google Fonts,
 * no layout shift) - used for the logo wordmark/tagline specifically, per
 * the approved brand typography. Scoped via manrope.className, not applied
 * globally - this sprint is about the logo, not a site-wide font change.
 */
export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

/**
 * Arabic web font. Previously the RTL font stack named Noto Sans Arabic /
 * Cairo / Tajawal but never loaded any of them, so Arabic fell back to
 * whatever the visitor's device had. Self-hosted at build time, Arabic
 * subset only, and not preloaded (Latin pages should not pay for it); it is
 * applied only under [dir="rtl"] via the --font-arabic variable.
 */
export const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  preload: false,
  variable: "--font-arabic",
});
