/**
 * Canvas text must use a font that is already loaded. The site's heading face
 * (Manrope) is exposed by next/font as the --font-heading CSS variable; read it
 * and wait for the weights we draw with, falling back to the system UI font.
 */
export interface UiFont {
  family: string;
}

export async function loadUiFont(): Promise<UiFont> {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-heading").trim();
  const family = v ? `${v}, ui-sans-serif, system-ui, sans-serif` : "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
  try {
    await Promise.all([500, 600, 700].map((w) => document.fonts.load(`${w} 40px ${family}`)));
  } catch {
    /* fall back silently: the system font is used */
  }
  return { family };
}
