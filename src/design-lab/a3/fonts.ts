import { Hanken_Grotesk, IBM_Plex_Sans_Arabic } from "next/font/google";

// A3 only. Self-hosted by next/font (the production CSP allows fonts from 'self').
export const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--a3-sans",
});

export const plexArabicA3 = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--a3-arabic",
});
