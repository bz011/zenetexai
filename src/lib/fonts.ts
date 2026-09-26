import { Manrope, Noto_Sans_Arabic } from "next/font/google";

/**
 * Brand typeface (Latin). Self-hosted by Next at build time - no runtime
 * request to Google Fonts. Loaded as ONE variable font file (no explicit
 * weights) so the logo wordmark and every site heading (600-800) share a
 * single ~25 KB download instead of one file per weight. Exposed both as a
 * className (logo wordmark) and as the --font-heading CSS variable (all
 * h1-h4 via globals.css and the `font-heading` utility). Arabic falls back
 * to Noto Sans Arabic per glyph (see tailwind.config.ts fontFamily.heading).
 */
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
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
