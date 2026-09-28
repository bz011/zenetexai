import { canvasTexture, dither, makeCanvas } from "../kit";
import { INK, MUTED, ROW_ICON_R, checkMark, drawIconTextRow, font, glassPanel, rr } from "../cardUi";
import type { UiFont } from "../uiFont";

/**
 * Canvas drawings for the Data & Analytics scene. Illustrative demo UI only -
 * generic icons (no trademarked service marks), neutral labels, and sample
 * values that read as placeholder data, not a real customer's numbers.
 */

export type SourceKind = "spreadsheet" | "database" | "cloud" | "document" | "api";
export type StageKind = "extract" | "clean" | "transform" | "unify";
export type OutputKind = "insights" | "dashboards" | "reports";

/** Generic line icons - no third-party marks. Drawn centred at (0,0), radius ~s. */
function drawSourceIcon(g: CanvasRenderingContext2D, kind: SourceKind, s: number, color: string): void {
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = s * 0.1;
  g.lineCap = "round";
  g.lineJoin = "round";
  switch (kind) {
    case "spreadsheet":
      rr(g, -s, -s * 0.78, s * 2, s * 1.56, s * 0.2);
      g.stroke();
      g.beginPath();
      g.moveTo(-s * 0.28, -s * 0.78);
      g.lineTo(-s * 0.28, s * 0.78);
      g.moveTo(s * 0.34, -s * 0.78);
      g.lineTo(s * 0.34, s * 0.78);
      [-s * 0.32, s * 0.14, s * 0.6].forEach((y) => {
        g.moveTo(-s, y);
        g.lineTo(s, y);
      });
      g.stroke();
      break;
    case "database": {
      const rx = s * 0.92;
      const ry = s * 0.32;
      const top = -s * 0.7;
      const bottom = s * 0.7;
      g.beginPath();
      g.ellipse(0, top, rx, ry, 0, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(-rx, top);
      g.lineTo(-rx, bottom);
      g.moveTo(rx, top);
      g.lineTo(rx, bottom);
      g.stroke();
      [0, bottom].forEach((cy) => {
        g.beginPath();
        g.ellipse(0, cy, rx, ry, 0, 0, Math.PI, false);
        g.stroke();
      });
      break;
    }
    case "cloud":
      g.beginPath();
      g.arc(-s * 0.42, s * 0.12, s * 0.46, Math.PI * 0.5, Math.PI * 1.55);
      g.arc(-s * 0.02, -s * 0.28, s * 0.4, Math.PI * 1.0, Math.PI * 1.92);
      g.arc(s * 0.46, s * 0.0, s * 0.5, Math.PI * 1.28, Math.PI * 0.42);
      g.lineTo(-s * 0.42, s * 0.58);
      g.closePath();
      g.stroke();
      break;
    case "document":
      g.beginPath();
      g.moveTo(-s * 0.58, -s);
      g.lineTo(s * 0.22, -s);
      g.lineTo(s * 0.58, -s * 0.64);
      g.lineTo(s * 0.58, s);
      g.lineTo(-s * 0.58, s);
      g.closePath();
      g.stroke();
      g.beginPath();
      g.moveTo(s * 0.22, -s);
      g.lineTo(s * 0.22, -s * 0.64);
      g.lineTo(s * 0.58, -s * 0.64);
      g.stroke();
      [-s * 0.32, -s * 0.02, s * 0.28].forEach((y) => {
        g.beginPath();
        g.moveTo(-s * 0.3, y);
        g.lineTo(s * 0.3, y);
        g.stroke();
      });
      break;
    case "api":
      [-1, 1].forEach((dx) => {
        [-1, 1].forEach((dy) => {
          rr(g, dx * s * 0.5 - s * 0.34, dy * s * 0.5 - s * 0.34, s * 0.68, s * 0.68, s * 0.16);
          g.fill();
        });
      });
      break;
  }
}

function drawStageIcon(g: CanvasRenderingContext2D, kind: StageKind, s: number, color: string): void {
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = s * 0.14;
  g.lineCap = "round";
  g.lineJoin = "round";
  switch (kind) {
    case "extract": {
      const rx = s * 0.85;
      const ry = s * 0.3;
      g.beginPath();
      g.ellipse(0, -s * 0.55, rx, ry, 0, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(-rx, -s * 0.55);
      g.lineTo(-rx, s * 0.4);
      g.moveTo(rx, -s * 0.55);
      g.lineTo(rx, s * 0.4);
      g.stroke();
      g.beginPath();
      g.ellipse(0, s * 0.4, rx, ry, 0, 0, Math.PI, false);
      g.stroke();
      break;
    }
    case "clean": {
      const teeth = 8;
      const rOuter = s * 0.88;
      const rInner = s * 0.62;
      g.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const a = (i / (teeth * 2)) * Math.PI * 2;
        const rad = i % 2 === 0 ? rOuter : rInner;
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
      g.fillStyle = "#0b1220";
      g.beginPath();
      g.arc(0, 0, s * 0.32, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "transform":
      g.beginPath();
      g.arc(0, 0, s * 0.62, Math.PI * 1.15, Math.PI * 2.05);
      g.stroke();
      g.beginPath();
      g.moveTo(s * 0.62, -s * 0.42);
      g.lineTo(s * 0.9, -s * 0.14);
      g.lineTo(s * 0.5, -s * 0.06);
      g.closePath();
      g.fill();
      g.beginPath();
      g.arc(0, 0, s * 0.62, Math.PI * 0.15, Math.PI * 1.05);
      g.stroke();
      g.beginPath();
      g.moveTo(-s * 0.62, s * 0.42);
      g.lineTo(-s * 0.9, s * 0.14);
      g.lineTo(-s * 0.5, s * 0.06);
      g.closePath();
      g.fill();
      break;
    case "unify":
      [-0.42, 0, 0.42].forEach((dy, i) => {
        g.globalAlpha = i === 1 ? 1 : 0.55;
        g.beginPath();
        g.moveTo(0, dy * s - s * 0.32);
        g.lineTo(s * 0.78, dy * s);
        g.lineTo(0, dy * s + s * 0.32);
        g.lineTo(-s * 0.78, dy * s);
        g.closePath();
        g.fill();
      });
      g.globalAlpha = 1;
      break;
  }
}

function drawOutputIcon(g: CanvasRenderingContext2D, kind: OutputKind, s: number, color: string): void {
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = s * 0.12;
  g.lineCap = "round";
  g.lineJoin = "round";
  switch (kind) {
    case "insights": {
      g.beginPath();
      g.moveTo(-s * 0.85, s * 0.5);
      g.lineTo(-s * 0.28, -s * 0.05);
      g.lineTo(s * 0.12, s * 0.28);
      g.lineTo(s * 0.85, -s * 0.62);
      g.stroke();
      g.beginPath();
      g.moveTo(s * 0.4, -s * 0.62);
      g.lineTo(s * 0.85, -s * 0.62);
      g.lineTo(s * 0.85, -s * 0.18);
      g.stroke();
      break;
    }
    case "dashboards":
      rr(g, -s * 0.85, -s * 0.7, s * 1.7, s * 1.4, s * 0.2);
      g.stroke();
      [-s * 0.5, -s * 0.05, s * 0.4].forEach((x, i) => {
        const h = s * (0.4 + i * 0.28);
        g.fillRect(x, s * 0.5 - h, s * 0.32, h);
      });
      break;
    case "reports":
      g.beginPath();
      g.moveTo(-s * 0.58, -s);
      g.lineTo(s * 0.22, -s);
      g.lineTo(s * 0.58, -s * 0.64);
      g.lineTo(s * 0.58, s);
      g.lineTo(-s * 0.58, s);
      g.closePath();
      g.stroke();
      checkMarkSmall(g, -s * 0.28, s * 0.18, s * 0.42, color);
      [s * 0.5].forEach((y) => {
        g.beginPath();
        g.moveTo(-s * 0.3, y);
        g.lineTo(s * 0.3, y);
        g.stroke();
      });
      break;
  }
}

function checkMarkSmall(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string): void {
  checkMark(g, cx, cy, s, color, Math.max(2, s * 0.16));
}

export const CARD_W = 920;
export const CARD_H = 560;

/** 920 x 560: a raw-data source card - same reusable icon/text row as AI Agents' input cards, sized up for real visual weight. */
export function drawSourceCard(f: UiFont, kind: SourceKind, title: string, subtitle: string, accent: string): HTMLCanvasElement {
  const W = CARD_W;
  const H = CARD_H;
  const { c, g } = makeCanvas(W, H);
  glassPanel(g, W, H, 52, accent);
  drawIconTextRow(g, f, W, H / 2, title, subtitle, (gg) => drawSourceIcon(gg, kind, ROW_ICON_R, accent));
  dither(g, W, H, 1.4);
  return c;
}

/** 920 x 560: a business-output card - same layout family as the sources, so left/right read as one system. */
export function drawOutputCard(f: UiFont, kind: OutputKind, title: string, subtitle: string, accent: string): HTMLCanvasElement {
  const W = CARD_W;
  const H = CARD_H;
  const { c, g } = makeCanvas(W, H);
  glassPanel(g, W, H, 52, accent);
  drawIconTextRow(g, f, W, H / 2, title, subtitle, (gg) => drawOutputIcon(gg, kind, ROW_ICON_R, accent));
  dither(g, W, H, 1.4);
  return c;
}

export const PROC_W = 1000;
export const PROC_H = 2480;
/** vertical centre of each of the four stage rows, in this canvas's own pixel space - used to place local highlight/overlay meshes in world space if ever needed. */
export const PROC_ROW_CY = [370, 950, 1530, 2110] as const;

const PROC_STAGES: { kind: StageKind; label: string }[] = [
  { kind: "extract", label: "Extract" },
  { kind: "clean", label: "Clean" },
  { kind: "transform", label: "Transform" },
  { kind: "unify", label: "Unify" },
];

function drawDownArrow(g: CanvasRenderingContext2D, x: number, y0: number, y1: number, color: string): void {
  // a soft glow behind the shaft so the connector reads as a luminous data
  // path, not a flat UI line - matches the brief's "immediately readable"
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 18;
  g.strokeStyle = color;
  g.lineWidth = 11;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x, y0);
  g.lineTo(x, y1 - 30);
  g.stroke();
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x - 22, y1 - 30);
  g.lineTo(x + 22, y1 - 30);
  g.lineTo(x, y1);
  g.closePath();
  g.fill();
  g.restore();
}

/**
 * ONE large vertical glass module containing all four transformation stages
 * (Extract -> Clean -> Transform -> Unify) as internal rows with a single
 * outer silhouette - not four independent cards. A clear, controlled cyan
 * arrow connects each row to the next, deliberately distinct from the
 * organic curved data trails outside the module (section F of the brief).
 */
export function drawProcessingModule(f: UiFont): HTMLCanvasElement {
  const W = PROC_W;
  const H = PROC_H;
  const { c, g } = makeCanvas(W, H);
  glassPanel(g, W, H, 60, "#7c8cf8");
  // a brighter internal wash top-to-bottom (blue -> violet), so the shell
  // itself reads as illuminated glass rather than a plain dark panel
  const wash = g.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, "rgba(96,165,250,0.1)");
  wash.addColorStop(0.5, "rgba(56,214,238,0.05)");
  wash.addColorStop(1, "rgba(167,139,250,0.1)");
  g.fillStyle = wash;
  rr(g, 0, 0, W, H, 60);
  g.fill();

  const rowH = 380;
  const rowW = W - 100;
  const rowX = 50;
  const iconR = 66;
  const accents = ["#60a5fa", "#38d6ee", "#818cf8", "#a78bfa"];

  PROC_STAGES.forEach((stage, i) => {
    const cy = PROC_ROW_CY[i];
    const accent = accents[i];
    // this stage's own row, subtly separated but clearly inside the outer shell
    g.fillStyle = "rgba(255,255,255,0.05)";
    rr(g, rowX, cy - rowH / 2, rowW, rowH, 32);
    g.fill();
    g.strokeStyle = `${accent}40`;
    g.lineWidth = 1.5;
    rr(g, rowX + 0.5, cy - rowH / 2 + 0.5, rowW - 1, rowH - 1, 31.5);
    g.stroke();

    g.save();
    g.translate(rowX + 46 + iconR, cy);
    drawStageIcon(g, stage.kind, iconR, accent);
    g.restore();

    g.fillStyle = INK;
    g.font = font(f, 700, 84);
    g.textBaseline = "middle";
    g.fillText(stage.label, rowX + 46 + iconR * 2 + 40, cy);

    if (i < PROC_STAGES.length - 1) {
      drawDownArrow(g, W / 2, cy + rowH / 2 + 16, PROC_ROW_CY[i + 1] - rowH / 2 - 16, "#5fd8f2");
    }
  });

  dither(g, W, H, 1.4);
  return c;
}

const DASH_W = 1440;
const DASH_H = 1100;

/** How far each animated part of the dashboard has been "populated", 0..1. */
export interface DashProgress {
  kpi: number;
  bars: number;
  channels: number;
  forecast: number;
  donut: number;
}
export const DASH_FULL: DashProgress = { kpi: 1, bars: 1, channels: 1, forecast: 1, donut: 1 };
export const DASH_EMPTY: DashProgress = { kpi: 0, bars: 0, channels: 0, forecast: 0, donut: 0 };

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const smooth = (t: number): number => t * t * (3 - 2 * t);
/** Item i of n starts after the previous one, staggered across the first `spread` of the timeline; 1 once p reaches 1. */
const stagger = (p: number, i: number, n: number, spread: number): number => clamp01(p * (1 + spread) - (n <= 1 ? 0 : (i / (n - 1)) * spread));

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const TREND_VALUES = [0.32, 0.4, 0.36, 0.5, 0.46, 0.58, 0.52, 0.66, 0.6, 0.74, 0.7, 0.86];
const DONUT_SEGS: [number, string][] = [
  [0.46, "#3b82f6"],
  [0.3, "#22d3ee"],
  [0.24, "#8b5cf6"],
];
const CHANNEL_VALUES = [0.9, 0.68, 0.5, 0.34];
const SPARK_VALUES = [0.3, 0.42, 0.38, 0.55, 0.5, 0.64, 0.6, 0.72, 0.68, 0.8];

function dashLayout() {
  const railW = 108;
  const padL = railW + 56;
  const padR = 56;
  const contentW = DASH_W - padL - padR;
  const kpiY = 150;
  const kpiH = 132;
  const kpiGap = 28;
  const kpiW = (contentW - kpiGap * (KPIS.length - 1)) / KPIS.length;
  const row2Y = kpiY + kpiH + 34;
  const row2H = 340;
  const trendW = contentW * 0.6;
  const donutW = contentW - trendW - 28;
  const donutX = padL + trendW + 28;
  const row3Y = row2Y + row2H + 28;
  const row3H = DASH_H - row3Y - 56;
  const barsW = contentW * 0.56;
  const sparkW = contentW - barsW - 28;
  const sparkX = padL + barsW + 28;
  const trend: Rect = { x: padL + 28, y: row2Y + 74, w: trendW - 56, h: row2H - 108 };
  const donut = { cx: donutX + donutW * 0.34, cy: row2Y + row2H * 0.62, r: Math.min(donutW * 0.24, 78) };
  const channels: Rect = { x: padL + 28, y: row3Y + 66, w: barsW - 56, h: row3H - 100 };
  const spark: Rect = { x: sparkX + 24, y: row3Y + 60, w: sparkW - 48, h: row3H - 92 };
  return { railW, padL, padR, contentW, kpiY, kpiH, kpiGap, kpiW, row2Y, row2H, trendW, donutW, donutX, row3Y, row3H, barsW, sparkW, sparkX, trend, donut, channels, spark };
}

interface Kpi {
  label: string;
  target: number;
  prefix: string;
  suffix: string;
}

// No delta/trend indicators here on purpose: this is illustrative sample
// data (see the stage's accessible description), not a claimed result.
const KPIS: Kpi[] = [
  { label: "Revenue", target: 186, prefix: "$", suffix: "K" },
  { label: "Projects", target: 24, prefix: "", suffix: "" },
  { label: "Margin", target: 31, prefix: "", suffix: "%" },
  { label: "Delivery", target: 97, prefix: "", suffix: "%" },
];

/** Static ghost of the charts (grid, tracks, baselines): what an empty dashboard looks like before data arrives. */
function drawChartGhosts(g: CanvasRenderingContext2D, L: ReturnType<typeof dashLayout>): void {
  // revenue trend: faint gridlines + baseline
  g.strokeStyle = "rgba(255,255,255,0.06)";
  g.lineWidth = 1.5;
  for (let i = 0; i <= 3; i++) {
    const gy = L.trend.y + (L.trend.h * i) / 3;
    g.beginPath();
    g.moveTo(L.trend.x, gy);
    g.lineTo(L.trend.x + L.trend.w, gy);
    g.stroke();
  }
  // donut track
  const thickness = L.donut.r * 0.34;
  g.strokeStyle = "rgba(255,255,255,0.06)";
  g.lineWidth = thickness;
  g.beginPath();
  g.arc(L.donut.cx, L.donut.cy, L.donut.r - thickness / 2, 0, Math.PI * 2);
  g.stroke();
  // channel tracks
  const rowH = L.channels.h / CHANNEL_VALUES.length;
  const pad = rowH * 0.28;
  CHANNEL_VALUES.forEach((_, i) => {
    const ry = L.channels.y + i * rowH + pad / 2;
    const rh = rowH - pad;
    g.fillStyle = "rgba(255,255,255,0.07)";
    rr(g, L.channels.x, ry, L.channels.w, rh, rh / 2);
    g.fill();
  });
  // forecast baseline
  g.strokeStyle = "rgba(167,139,250,0.22)";
  g.lineWidth = 2;
  g.setLineDash([10, 10]);
  g.beginPath();
  g.moveTo(L.spark.x, L.spark.y + L.spark.h);
  g.lineTo(L.spark.x + L.spark.w, L.spark.y + L.spark.h);
  g.stroke();
  g.setLineDash([]);
}

function trendLive(g: CanvasRenderingContext2D, { x, y, w, h }: Rect, p: number): void {
  const n = TREND_VALUES.length;
  const gap = w * 0.018;
  const barW = (w - gap * (n - 1)) / n;
  const points: [number, number][] = [];
  const dots: boolean[] = [];
  TREND_VALUES.forEach((v, i) => {
    const local = smooth(stagger(p, i, n, 0.8));
    const bh = h * v * local;
    if (bh < 1) return;
    const bx = x + i * (barW + gap);
    const by = y + h - bh;
    const grad = g.createLinearGradient(0, by, 0, y + h);
    grad.addColorStop(0, "rgba(96,165,250,0.9)");
    grad.addColorStop(1, "rgba(37,99,235,0.28)");
    g.fillStyle = grad;
    rr(g, bx, by, barW, bh, Math.min(8, barW * 0.3));
    g.fill();
    if (local > 0.35) {
      points.push([bx + barW / 2, by - h * 0.045 * local]);
      dots.push(local > 0.8);
    }
  });
  if (points.length > 1) {
    g.strokeStyle = "rgba(56,214,238,0.9)";
    g.lineWidth = 3.5;
    g.beginPath();
    points.forEach(([px, py], i) => (i === 0 ? g.moveTo(px, py) : g.lineTo(px, py)));
    g.stroke();
  }
  g.fillStyle = "#22d3ee";
  points.forEach(([px, py], i) => {
    if (!dots[i]) return;
    g.beginPath();
    g.arc(px, py, 4.5, 0, Math.PI * 2);
    g.fill();
  });
}

function donutLive(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, p: number): void {
  const thickness = r * 0.34;
  const sweep = smooth(p) * Math.PI * 2;
  const start = -Math.PI / 2;
  let a0 = start;
  DONUT_SEGS.forEach(([frac, color]) => {
    const a1 = a0 + frac * Math.PI * 2;
    const end = Math.min(a1, start + sweep);
    if (end > a0) {
      g.strokeStyle = color;
      g.lineWidth = thickness;
      g.lineCap = "butt";
      g.beginPath();
      g.arc(cx, cy, r - thickness / 2, a0, end);
      g.stroke();
    }
    a0 = a1;
  });
}

function channelsLive(g: CanvasRenderingContext2D, { x, y, w, h }: Rect, p: number): void {
  const rowH = h / CHANNEL_VALUES.length;
  const pad = rowH * 0.28;
  CHANNEL_VALUES.forEach((v, i) => {
    const ry = y + i * rowH + pad / 2;
    const rh = rowH - pad;
    const bw = w * v * smooth(stagger(p, i, CHANNEL_VALUES.length, 0.6));
    if (bw < 2) return;
    const grad = g.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, "#2563eb");
    grad.addColorStop(1, "#38d6ee");
    g.fillStyle = grad;
    rr(g, x, ry, bw, rh, rh / 2);
    g.fill();
  });
}

function sparkLive(g: CanvasRenderingContext2D, { x, y, w, h }: Rect, p: number): void {
  if (p <= 0.001) return;
  const n = SPARK_VALUES.length;
  const step = w / (n - 1);
  const reveal = clamp01(p) * w;
  g.save();
  g.beginPath();
  g.rect(x - 4, y - 8, reveal + 4, h + 16);
  g.clip();
  g.beginPath();
  SPARK_VALUES.forEach((v, i) => {
    const px = x + i * step;
    const py = y + h - h * v;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  });
  g.strokeStyle = "#a78bfa";
  g.lineWidth = 3;
  g.stroke();
  g.lineTo(x + w, y + h);
  g.lineTo(x, y + h);
  g.closePath();
  const fill = g.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, "rgba(167,139,250,0.28)");
  fill.addColorStop(1, "rgba(167,139,250,0)");
  g.fillStyle = fill;
  g.fill();
  g.restore();
  if (p < 0.999) {
    const f = (reveal / w) * (n - 1);
    const i0 = Math.min(n - 2, Math.floor(f));
    const v = SPARK_VALUES[i0] + (SPARK_VALUES[i0 + 1] - SPARK_VALUES[i0]) * (f - i0);
    g.fillStyle = "#c4b5fd";
    g.beginPath();
    g.arc(x + reveal, y + h - h * v, 6, 0, Math.PI * 2);
    g.fill();
  }
}

export interface DashboardScreen {
  canvas: HTMLCanvasElement;
  /** Redraws the screen with each animated part populated to the given amount. */
  render(p: DashProgress): void;
}

/**
 * 1440 x 1100: the dashboard's own screen - illustrative sample data only (see
 * the accessible description this stage carries), not a real customer's
 * numbers. Sidebar + header, four KPI cards, one dominant trend chart, a
 * category donut, a horizontal bar breakdown, and a compact trend panel.
 *
 * The static chrome (rail, header, panels, labels, ghost chart tracks) is
 * drawn once into a cached layer; `render` blits it and paints only the
 * data-driven parts (KPI values, bars, donut, channels, forecast) on top, so
 * the scene can populate the dashboard frame by frame cheaply.
 */
export function createDashboardScreen(f: UiFont): DashboardScreen {
  const W = DASH_W;
  const H = DASH_H;
  const L = dashLayout();
  const base = makeCanvas(W, H);
  const g = base.g;

  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0a1024");
  bg.addColorStop(1, "#05070f");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // left icon rail
  g.fillStyle = "rgba(255,255,255,0.03)";
  g.fillRect(0, 0, L.railW, H);
  g.strokeStyle = "rgba(255,255,255,0.06)";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(L.railW, 0);
  g.lineTo(L.railW, H);
  g.stroke();
  const railIcons = 6;
  for (let i = 0; i < railIcons; i++) {
    const cy = 130 + i * 118;
    const active = i === 1;
    if (active) {
      g.fillStyle = "rgba(59,130,246,0.22)";
      rr(g, L.railW / 2 - 30, cy - 30, 60, 60, 16);
      g.fill();
    }
    g.strokeStyle = active ? "#60a5fa" : "rgba(148,163,184,0.55)";
    g.lineWidth = 3.5;
    rr(g, L.railW / 2 - 15, cy - 15, 30, 30, 8);
    g.stroke();
  }

  // header
  g.fillStyle = INK;
  g.font = font(f, 700, 54);
  g.textBaseline = "alphabetic";
  g.fillText("Overview", L.padL, 100);
  g.fillStyle = "rgba(255,255,255,0.05)";
  rr(g, W - L.padR - 260, 62, 260, 52, 26);
  g.fill();
  g.fillStyle = MUTED;
  g.font = font(f, 500, 32);
  g.fillText("This month", W - L.padR - 205, 96);

  // KPI cards (labels only - the values are the live layer)
  KPIS.forEach((k, i) => {
    const kx = L.padL + i * (L.kpiW + L.kpiGap);
    g.fillStyle = "rgba(255,255,255,0.035)";
    rr(g, kx, L.kpiY, L.kpiW, L.kpiH, 24);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.06)";
    g.lineWidth = 1;
    rr(g, kx + 0.5, L.kpiY + 0.5, L.kpiW - 1, L.kpiH - 1, 23.5);
    g.stroke();
    g.fillStyle = MUTED;
    g.font = font(f, 500, 34);
    g.fillText(k.label, kx + 28, L.kpiY + 48);
  });

  // trend + donut row
  g.fillStyle = "rgba(255,255,255,0.035)";
  rr(g, L.padL, L.row2Y, L.trendW, L.row2H, 24);
  g.fill();
  g.fillStyle = INK;
  g.font = font(f, 700, 40);
  g.fillText("Revenue trend", L.padL + 28, L.row2Y + 46);

  g.fillStyle = "rgba(255,255,255,0.035)";
  rr(g, L.donutX, L.row2Y, L.donutW, L.row2H, 24);
  g.fill();
  g.fillStyle = INK;
  g.font = font(f, 700, 40);
  g.fillText("By category", L.donutX + 28, L.row2Y + 46);
  const legend: [string, string][] = [
    ["#3b82f6", "Category A"],
    ["#22d3ee", "Category B"],
    ["#8b5cf6", "Category C"],
  ];
  legend.forEach(([color, label], i) => {
    const ly = L.row2Y + 100 + i * 46;
    g.fillStyle = color;
    g.beginPath();
    g.arc(L.donutX + L.donutW * 0.56, ly, 8, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = MUTED;
    g.font = font(f, 500, 28);
    g.fillText(label, L.donutX + L.donutW * 0.56 + 22, ly + 8);
  });

  // bars + spark row
  g.fillStyle = "rgba(255,255,255,0.035)";
  rr(g, L.padL, L.row3Y, L.barsW, L.row3H, 24);
  g.fill();
  g.fillStyle = INK;
  g.font = font(f, 700, 38);
  g.fillText("Top channels", L.padL + 28, L.row3Y + 42);

  g.fillStyle = "rgba(255,255,255,0.035)";
  rr(g, L.sparkX, L.row3Y, L.sparkW, L.row3H, 24);
  g.fill();
  g.fillStyle = INK;
  g.font = font(f, 700, 38);
  g.fillText("Forecast", L.sparkX + 24, L.row3Y + 42);

  drawChartGhosts(g, L);
  dither(g, W, H, 1.6);

  const live = makeCanvas(W, H);
  const lg = live.g;
  return {
    canvas: live.c,
    render(p: DashProgress) {
      lg.drawImage(base.c, 0, 0);
      lg.textBaseline = "alphabetic";
      KPIS.forEach((k, i) => {
        const kx = L.padL + i * (L.kpiW + L.kpiGap);
        const v = Math.round(k.target * easeOut(stagger(p.kpi, i, KPIS.length, 0.5)));
        lg.fillStyle = INK;
        lg.font = font(f, 700, 56);
        lg.fillText(`${k.prefix}${v}${k.suffix}`, kx + 28, L.kpiY + 104);
      });
      trendLive(lg, L.trend, p.bars);
      donutLive(lg, L.donut.cx, L.donut.cy, L.donut.r, p.donut);
      channelsLive(lg, L.channels, p.channels);
      sparkLive(lg, L.spark, p.forecast);
    },
  };
}

/** The fully populated screen, for static (reduced-motion) use. */
export function drawDashboardScreen(f: UiFont): HTMLCanvasElement {
  const d = createDashboardScreen(f);
  d.render(DASH_FULL);
  return d.canvas;
}

/** Row geometry of the processing module's canvas (px), shared with the scene's stage highlight. */
export const PROC_ROW = { x: 50, w: PROC_W - 100, h: 380, iconCx: 50 + 46 + 66 } as const;

/**
 * A neutral white rounded-rectangle outline with a soft halo and a faint
 * inner wash, padded by `pad` px on every side. Tinted per use through its
 * material colour, and blended additively: the scene's stage highlight and
 * output acknowledgements are this one shape.
 */
export function drawGlowFrame(w: number, h: number, r: number, pad: number, wash: number): HTMLCanvasElement {
  const { c, g } = makeCanvas(w + pad * 2, h + pad * 2);
  g.fillStyle = `rgba(255,255,255,${wash})`;
  rr(g, pad, pad, w, h, r);
  g.fill();
  g.shadowColor = "rgba(255,255,255,0.95)";
  g.shadowBlur = pad * 0.55;
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 6;
  rr(g, pad, pad, w, h, r);
  g.stroke();
  return c;
}

export { DASH_H, DASH_W };
export { canvasTexture };
