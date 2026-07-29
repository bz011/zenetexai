import { Manrope } from "next/font/google";

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
