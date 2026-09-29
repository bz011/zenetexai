import type { Lang } from "@/lib/translations";

/**
 * Canvas text must use a font that is already loaded. The site's heading face
 * (Manrope) is exposed by next/font as the --font-heading CSS variable, and its
 * Arabic counterpart (Noto Sans Arabic, self-hosted - see src/lib/fonts.ts) as
 * --font-arabic; read both, wait for the weights each scene draws with, and
 * hand back the one the current language actually needs. Arabic never falls
 * back to Manrope (which has no Arabic glyphs) or an unpredictable system
 * font - only to the generic "sans-serif" the browser is guaranteed to have.
 */
export interface UiFont {
  family: string;
  /** true when `family` is the Arabic face: canvas text drawing sets ctx.direction accordingly */
  rtl: boolean;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export async function loadUiFont(lang: Lang = "en"): Promise<UiFont> {
  const latin = cssVar("--font-heading");
  const arabic = cssVar("--font-arabic");
  const rtl = lang === "ar";
  const family = rtl
    ? arabic
      ? `${arabic}, sans-serif`
      : "sans-serif" // no Arabic web font loaded on this page: never fall back to the Latin-only heading face
    : latin
      ? `${latin}, ui-sans-serif, system-ui, sans-serif`
      : "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
  try {
    await Promise.all([500, 600, 700].map((w) => document.fonts.load(`${w} 40px ${family}`)));
  } catch {
    /* fall back silently: the system font is used */
  }
  return { family, rtl };
}
