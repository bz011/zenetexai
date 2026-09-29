import type { UiFont } from "./uiFont";

/**
 * Shared canvas-drawing primitives for showcase scene UI textures: the same
 * "dark glass card" language established for AI Agents, authored once here so
 * every later scene (Data & Analytics, Machine Learning, Academy) reuses it
 * instead of re-inventing a material look per scene. AI Agents' own canvas
 * file (scenes/agentsUi.ts) keeps its own private copies of these - it is
 * locked and not touched by this module existing.
 */

export const INK = "#f1f5f9";
export const MUTED = "rgba(148,163,184,0.92)";
export const LINE = "rgba(255,255,255,0.07)";

export function font(f: UiFont, weight: number, px: number): string {
  return `${weight} ${px}px ${f.family}`;
}

export function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

export function wrapText(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (g.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Shrinks `weight`-weighted text down from `startPx` (in 1px steps, never below
 * `minPx`) until it fits `maxW`, sets `g.font` to the result, and returns the
 * chosen size. Arabic strings are frequently a different length than their
 * English source at the same visual weight, so every fixed-width label in the
 * showcase that isn't already safely short should be measured this way rather
 * than assumed to fit.
 */
export function fitFontSize(g: CanvasRenderingContext2D, f: UiFont, weight: number, startPx: number, text: string, maxW: number, minPx = 22): number {
  let px = startPx;
  g.font = font(f, weight, px);
  while (g.measureText(text).width > maxW && px > minPx) {
    px -= 1;
    g.font = font(f, weight, px);
  }
  return px;
}

/**
 * Draws one line of text anchored to a box [x, x+w]: left-anchored and
 * left-to-right for English, right-anchored and right-to-left for Arabic - the
 * box itself (and everything else on the card) does not move. `g.direction`
 * only affects how this one call resolves "start"/mixed-direction runs inside
 * the string (e.g. Latin digits or acronyms embedded in an Arabic subtitle);
 * it is reset immediately after, so it never leaks into a sibling draw call
 * that assumes the canvas's default direction.
 */
export function drawInBox(g: CanvasRenderingContext2D, text: string, x: number, w: number, y: number, rtl: boolean): void {
  g.direction = rtl ? "rtl" : "ltr";
  g.textAlign = rtl ? "right" : "left";
  g.fillText(text, rtl ? x + w : x, y);
  g.direction = "ltr";
  g.textAlign = "left";
}

const GLASS_TOP = "#0b1220";
const GLASS_BOTTOM = "#05080f";

/** The dark translucent "glass" fill shared by every card: gradient base, accent inner glow, diagonal sheen, grazing top-edge highlight. */
export function glassPanel(g: CanvasRenderingContext2D, w: number, h: number, r: number, accent: string): void {
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, GLASS_TOP);
  bg.addColorStop(1, GLASS_BOTTOM);
  g.fillStyle = bg;
  rr(g, 0, 0, w, h, r);
  g.fill();
  const glow = g.createRadialGradient(w * 0.2, h * 0.8, 0, w * 0.2, h * 0.8, w * 0.5);
  glow.addColorStop(0, `${accent}26`);
  glow.addColorStop(1, `${accent}00`);
  g.fillStyle = glow;
  rr(g, 0, 0, w, h, r);
  g.fill();
  g.save();
  rr(g, 0, 0, w, h, r);
  g.clip();
  const sheen = g.createLinearGradient(-w * 0.2, 0, w * 0.75, h);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.42, "rgba(255,255,255,0)");
  sheen.addColorStop(0.52, "rgba(210,225,255,0.06)");
  sheen.addColorStop(0.62, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, w, h);
  g.restore();
  g.strokeStyle = "rgba(255,255,255,0.22)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(r, 1);
  g.lineTo(w - r, 1);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.06)";
  g.lineWidth = 1;
  rr(g, 0.75, 0.75, w - 1.5, h - 1.5, r - 0.75);
  g.stroke();
  // a low, even accent-tinted glow around the whole outer edge, so the shell
  // itself reads as illuminated glass rather than a plain dark panel
  g.strokeStyle = `${accent}55`;
  g.lineWidth = 2.5;
  rr(g, 1.5, 1.5, w - 3, h - 3, r - 1.5);
  g.stroke();
}

export function checkMark(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, w = 6): void {
  g.strokeStyle = color;
  g.lineWidth = w;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(cx - s * 0.5, cy + s * 0.02);
  g.lineTo(cx - s * 0.1, cy + s * 0.4);
  g.lineTo(cx + s * 0.55, cy - s * 0.38);
  g.stroke();
}

/**
 * The reusable [ICON AREA][TEXT AREA] row layout established for AI Agents'
 * final polish pass: icon left, vertically centred, text starts well clear of
 * the icon's right edge - so no icon can ever collide with its title no
 * matter which shape is drawn. Same constants for every card that uses it.
 */
export const ROW_PAD = 52;
export const ROW_ICON_R = 70;
export const ROW_ICON_TEXT_GAP = 36;
export const ROW_TEXT_X = ROW_PAD + ROW_ICON_R * 2 + ROW_ICON_TEXT_GAP;

export function drawIconTextRow(
  g: CanvasRenderingContext2D,
  f: UiFont,
  cardW: number,
  rowCy: number,
  title: string,
  subtitle: string,
  drawIcon: (g: CanvasRenderingContext2D) => void,
): void {
  // RTL: the icon moves to the right edge and the text column fills the
  // remaining space to its left, so an Arabic title/subtitle reads from the
  // icon outward instead of anchoring at a left edge that no longer means
  // "the start of the line" - the row's own composition (icon + two lines of
  // text), not the card's position in the scene, is what mirrors here.
  const rtl = f.rtl;
  const iconCx = rtl ? cardW - ROW_PAD - ROW_ICON_R : ROW_PAD + ROW_ICON_R;
  const textX = rtl ? ROW_PAD : ROW_TEXT_X;
  const textW = cardW - ROW_TEXT_X - ROW_PAD;
  g.save();
  g.translate(iconCx, rowCy);
  drawIcon(g);
  g.restore();

  // Auto-fit the title down from 70px rather than letting a long title (e.g.
  // "Interactive Dashboards") silently overflow the canvas and get truncated -
  // the exact objective clipping bug the typography QA pass exists to catch.
  fitFontSize(g, f, 700, 70, title, textW, 38);
  g.fillStyle = INK;
  g.textBaseline = "alphabetic";
  drawInBox(g, title, textX, textW, rowCy - 20, rtl);
  g.fillStyle = MUTED;
  fitFontSize(g, f, 500, 46, subtitle, textW, 26);
  drawInBox(g, subtitle, textX, textW, rowCy + 46, rtl);
}
