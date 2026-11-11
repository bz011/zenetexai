import {
  Alexandria,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Newsreader,
  Noto_Naskh_Arabic,
  Schibsted_Grotesk,
} from "next/font/google";

/**
 * Experimental faces for the design-lab prototypes only. Self-hosted by
 * next/font at build time (the production CSP allows fonts from 'self' only).
 * Not preloaded: each prototype pays only for the faces its CSS uses.
 */

// A — editorial serif, Latin + Arabic Naskh.
export const newsreader = Newsreader({ subsets: ["latin"], axes: ["opsz"], style: ["normal"], display: "swap", preload: false, adjustFontFallback: false, variable: "--lab-serif" });
export const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], display: "swap", preload: false, variable: "--lab-naskh" });

// B — heavy grotesk, Latin + Arabic.
export const schibsted = Schibsted_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--lab-grotesk" });
export const alexandria = Alexandria({ subsets: ["arabic", "latin"], display: "swap", preload: false, variable: "--lab-alexandria" });

// C — one family for both scripts.
export const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", preload: false, variable: "--lab-plex" });
export const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], display: "swap", preload: false, variable: "--lab-plex-ar" });

export const labFontVariables = [newsreader, naskh, schibsted, alexandria, plex, plexArabic].map((f) => f.variable).join(" ");
