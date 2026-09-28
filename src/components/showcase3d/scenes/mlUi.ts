import { canvasTexture, dither, makeCanvas } from "../kit";
import { INK, MUTED, font, glassPanel, rr } from "../cardUi";
import type { UiFont } from "../uiFont";

/**
 * Canvas drawings for the Machine Learning scene: the Historical Data card and
 * the Predictions panel. Illustrative showcase values only - nothing here is a
 * real business claim. Both are built the same way as the Data & Analytics
 * dashboard: the static chrome is painted once into a cached layer, and
 * `render` blits it and paints only the parts that change over time.
 */

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const smooth = (t: number): number => t * t * (3 - 2 * t);
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const stagger = (p: number, i: number, n: number, spread: number): number => clamp01(p * (1 + spread) - (n <= 1 ? 0 : (i / (n - 1)) * spread));

// ─────────────────────────── Historical Data card ───────────────────────────

export const HIST_W = 1050;
export const HIST_H = 900;

/** How far the historical chart has come alive, 0..1. */
export interface HistProgress {
  /** the newest observations grow in, staggered */
  obs: number;
  /** the whole series goes from subdued to fully lit */
  active: number;
}

export const HIST_EMPTY: HistProgress = { obs: 0, active: 0 };
export const HIST_FULL: HistProgress = { obs: 1, active: 1 };

const HIST_VALUES = [0.34, 0.4, 0.3, 0.44, 0.38, 0.5, 0.42, 0.56, 0.47, 0.6, 0.52, 0.64, 0.55, 0.68, 0.6, 0.72, 0.64, 0.7, 0.78, 0.66, 0.82, 0.74, 0.88, 0.8];
/** the last few bars are the "new observations" that grow in */
const HIST_NEW = 6;

function dbIcon(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string): void {
  g.strokeStyle = color;
  g.lineWidth = s * 0.075;
  g.lineCap = "round";
  const rx = s * 0.62;
  const ry = s * 0.2;
  const top = cy - s * 0.62;
  const bot = cy + s * 0.62;
  g.beginPath();
  g.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(cx - rx, top);
  g.lineTo(cx - rx, bot);
  g.moveTo(cx + rx, top);
  g.lineTo(cx + rx, bot);
  g.stroke();
  g.beginPath();
  g.ellipse(cx, cy - s * 0.02, rx, ry, 0, 0, Math.PI);
  g.stroke();
  g.beginPath();
  g.ellipse(cx, bot, rx, ry, 0, 0, Math.PI);
  g.stroke();
}

export interface CardScreen<P> {
  canvas: HTMLCanvasElement;
  render(p: P): void;
}

export function createHistoricalCard(f: UiFont): CardScreen<HistProgress> {
  const W = HIST_W;
  const H = HIST_H;
  const base = makeCanvas(W, H);
  const g = base.g;
  glassPanel(g, W, H, 64, "#60a5fa");

  const pad = 64;
  dbIcon(g, pad + 62, 138, 96, "#5eb4ff");
  g.fillStyle = INK;
  g.font = font(f, 700, 76);
  g.textBaseline = "alphabetic";
  g.fillText("Historical Data", pad + 158, 150);
  g.fillStyle = MUTED;
  g.font = font(f, 500, 46);
  g.fillText("Sales · Users · Transactions", pad + 158, 230);
  g.fillText("Market Trends · External Factors", pad + 158, 292);

  // chart frame: faint grid + baseline (the bars are the live layer)
  const cx = pad;
  const cy = 372;
  const cw = W - pad * 2;
  const ch = H - cy - 78;
  g.strokeStyle = "rgba(255,255,255,0.07)";
  g.lineWidth = 2;
  for (let i = 0; i <= 3; i++) {
    const gy = cy + (ch * i) / 3;
    g.beginPath();
    g.moveTo(cx, gy);
    g.lineTo(cx + cw, gy);
    g.stroke();
  }
  g.strokeStyle = "rgba(148,163,184,0.35)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx, cy + ch);
  g.lineTo(cx + cw, cy + ch);
  g.stroke();
  dither(g, W, H, 1.4);

  const live = makeCanvas(W, H);
  const lg = live.g;
  const n = HIST_VALUES.length;
  const gap = cw * 0.014;
  const barW = (cw - gap * (n - 1)) / n;
  return {
    canvas: live.c,
    render(p: HistProgress) {
      lg.drawImage(base.c, 0, 0);
      const lit = smooth(clamp01(p.active));
      HIST_VALUES.forEach((v, i) => {
        const isNew = i >= n - HIST_NEW;
        const grow = isNew ? smooth(stagger(p.obs, i - (n - HIST_NEW), HIST_NEW, 0.9)) : 1;
        const bh = ch * v * grow;
        if (bh < 1.5) return;
        const bx = cx + i * (barW + gap);
        const by = cy + ch - bh;
        // subdued -> lit: alpha and a shift from slate-blue toward the bright blue
        const a = 0.42 + 0.58 * lit;
        const grad = lg.createLinearGradient(0, by, 0, cy + ch);
        if (isNew) {
          grad.addColorStop(0, `rgba(94,196,255,${0.35 + 0.6 * Math.max(lit, grow * 0.7)})`);
          grad.addColorStop(1, `rgba(37,99,235,${0.2 + 0.2 * lit})`);
        } else {
          grad.addColorStop(0, `rgba(96,165,250,${a * 0.95})`);
          grad.addColorStop(1, `rgba(37,99,235,${a * 0.32})`);
        }
        lg.fillStyle = grad;
        rr(lg, bx, by, barW, bh, Math.min(7, barW * 0.3));
        lg.fill();
      });
    },
  };
}

// ─────────────────────────────── Predictions panel ───────────────────────────────

export const PRED_W = 1320;
export const PRED_H = 1000;

/** How far the prediction has been generated, 0..1. */
export interface PredProgress {
  /** the future line draws into the Future region */
  line: number;
  /** the confidence band opens up behind it */
  band: number;
  /** the three result values */
  kpi: number;
  /** multiplies everything generated (line, band, values) - fades it out on reset */
  fade: number;
}

export const PRED_EMPTY: PredProgress = { line: 0, band: 0, kpi: 0, fade: 1 };
export const PRED_FULL: PredProgress = { line: 1, band: 1, kpi: 1, fade: 1 };

interface KpiSpec {
  title: string[];
  value: string;
  target: number;
  prefix: string;
  suffix: string;
  caption: string;
  color: string;
  icon: "growth" | "people" | "dollar";
}

const KPI_SPECS: KpiSpec[] = [
  { title: ["Demand", "Forecast"], value: "87%", target: 87, prefix: "", suffix: "%", caption: "Expected Growth", color: "#4cc2ff", icon: "growth" },
  { title: ["Churn", "Risk"], value: "12%", target: 12, prefix: "", suffix: "%", caption: "Low Risk", color: "#e6ecf7", icon: "people" },
  { title: ["Next Month", "Sales"], value: "+18%", target: 18, prefix: "+", suffix: "%", caption: "Projected Increase", color: "#34e3a1", icon: "dollar" },
];

function kpiIcon(g: CanvasRenderingContext2D, kind: KpiSpec["icon"], cx: number, cy: number, s: number, color: string): void {
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = s * 0.09;
  g.lineCap = "round";
  g.lineJoin = "round";
  if (kind === "growth") {
    const bw = s * 0.2;
    [0.4, 0.68, 1].forEach((h, i) => {
      const bh = s * h * 0.9;
      rr(g, cx - s * 0.5 + i * (bw + s * 0.1), cy + s * 0.45 - bh, bw, bh, 3);
      g.fill();
    });
  } else if (kind === "people") {
    g.beginPath();
    g.arc(cx, cy - s * 0.18, s * 0.2, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(cx, cy + s * 0.62, s * 0.5, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
    g.beginPath();
    g.arc(cx - s * 0.5, cy - s * 0.02, s * 0.14, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(cx + s * 0.5, cy - s * 0.02, s * 0.14, 0, Math.PI * 2);
    g.stroke();
  } else {
    g.beginPath();
    g.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
    g.stroke();
    g.font = `700 ${s * 0.62}px sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("$", cx, cy + s * 0.04);
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
  }
}

/** Future-region control values (fraction of chart height above the join), smoothed by quadratic segments. */
const FUTURE = [0, 0.05, 0.02, 0.11, 0.08, 0.15, 0.12, 0.22, 0.2, 0.31, 0.27, 0.37, 0.4, 0.5, 0.47, 0.6];
const PAST = [0.46, 0.5, 0.42, 0.34, 0.3, 0.36, 0.44, 0.5, 0.42, 0.34, 0.3, 0.32, 0.36, 0.34];

/** A smooth path through `pts` (quadratic segments through the midpoints); `cont` continues the current subpath instead of starting a new one. */
function smoothPathOn(ctx: CanvasRenderingContext2D, pts: [number, number][], cont: boolean): void {
  if (cont) ctx.lineTo(pts[0][0], pts[0][1]);
  else ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
}

export function createPredictionPanel(f: UiFont): CardScreen<PredProgress> {
  const W = PRED_W;
  const H = PRED_H;
  const base = makeCanvas(W, H);
  const g = base.g;
  glassPanel(g, W, H, 64, "#8b5cf6");

  const pad = 56;
  // header: icon tile, title, range chip
  g.fillStyle = "rgba(255,255,255,0.05)";
  rr(g, pad, 52, 112, 104, 26);
  g.fill();
  g.strokeStyle = "#a78bfa";
  g.lineWidth = 7;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(pad + 26, 128);
  g.lineTo(pad + 50, 100);
  g.lineTo(pad + 66, 114);
  g.lineTo(pad + 92, 78);
  g.stroke();
  g.beginPath();
  g.moveTo(pad + 76, 78);
  g.lineTo(pad + 92, 78);
  g.lineTo(pad + 92, 94);
  g.stroke();
  g.fillStyle = INK;
  g.font = font(f, 700, 78);
  g.textBaseline = "alphabetic";
  g.fillText("Predictions", pad + 152, 130);
  g.fillStyle = "rgba(255,255,255,0.06)";
  rr(g, W - pad - 300, 66, 300, 66, 20);
  g.fill();
  g.fillStyle = MUTED;
  g.font = font(f, 500, 34);
  g.fillText("Next 6 Months", W - pad - 274, 108);
  g.strokeStyle = MUTED;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(W - pad - 56, 92);
  g.lineTo(W - pad - 44, 104);
  g.lineTo(W - pad - 32, 92);
  g.stroke();

  // chart region
  const chartX = pad;
  const chartY = 190;
  const chartW = W - pad * 2;
  const chartH = 440;
  g.fillStyle = "rgba(255,255,255,0.028)";
  rr(g, chartX, chartY, chartW, chartH, 30);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.06)";
  g.lineWidth = 2;
  rr(g, chartX + 1, chartY + 1, chartW - 2, chartH - 2, 29);
  g.stroke();
  const divX = chartX + chartW * 0.4;
  const plotL = chartX + 50;
  const plotR = chartX + chartW - 44;
  const plotT = chartY + 78;
  const plotB = chartY + chartH - 34;
  const plotH = plotB - plotT;
  // gridlines
  g.strokeStyle = "rgba(255,255,255,0.05)";
  g.lineWidth = 1.5;
  for (let i = 0; i <= 3; i++) {
    const gy = plotT + (plotH * i) / 3;
    g.beginPath();
    g.moveTo(plotL, gy);
    g.lineTo(plotR, gy);
    g.stroke();
  }
  // Past / Future labels and the divider between them
  g.fillStyle = INK;
  g.font = font(f, 600, 32);
  g.fillText("Past", plotL + 4, chartY + 56);
  g.fillStyle = "rgba(196,181,253,0.95)";
  g.fillText("Future (Prediction)", divX + 32, chartY + 56);
  g.strokeStyle = "rgba(196,181,253,0.55)";
  g.lineWidth = 3;
  g.setLineDash([12, 12]);
  g.beginPath();
  g.moveTo(divX, chartY + 24);
  g.lineTo(divX, chartY + chartH - 20);
  g.stroke();
  g.setLineDash([]);

  // the historical line: always visible, it is what the model learned from
  const pastPts: [number, number][] = PAST.map((v, i) => [plotL + ((divX - plotL) * i) / (PAST.length - 1), plotB - v * plotH * 0.9 - plotH * 0.06]);
  g.strokeStyle = "rgba(56,214,238,0.92)";
  g.lineWidth = 6;
  g.beginPath();
  smoothPathOn(g, pastPts, false);
  g.stroke();
  g.fillStyle = "#22d3ee";
  [3, 8, 13].forEach((i) => {
    g.beginPath();
    g.arc(pastPts[i][0], pastPts[i][1], 8, 0, Math.PI * 2);
    g.fill();
  });

  // the future line's geometry starts exactly where the past line ends
  const joinY = pastPts[pastPts.length - 1][1];
  const futPts: [number, number][] = FUTURE.map((v, i) => [divX + ((plotR - divX) * i) / (FUTURE.length - 1), joinY - v * plotH * 1.05]);

  // KPI cards: frames, icons and labels (the values are the live layer)
  const kpiY = chartY + chartH + 34;
  const kpiH = H - kpiY - 52;
  const kpiGap = 26;
  const kpiW = (chartW - kpiGap * 2) / 3;
  KPI_SPECS.forEach((k, i) => {
    const kx = chartX + i * (kpiW + kpiGap);
    g.fillStyle = "rgba(255,255,255,0.035)";
    rr(g, kx, kpiY, kpiW, kpiH, 26);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.07)";
    g.lineWidth = 2;
    rr(g, kx + 1, kpiY + 1, kpiW - 2, kpiH - 2, 25);
    g.stroke();
    kpiIcon(g, k.icon, kx + 66, kpiY + 70, 64, k.icon === "growth" ? "#4cc2ff" : k.icon === "people" ? "#a78bfa" : "#34e3a1");
    g.fillStyle = INK;
    g.font = font(f, 700, 36);
    k.title.forEach((line, li) => g.fillText(line, kx + 124, kpiY + 62 + li * 42));
    g.fillStyle = MUTED;
    g.font = font(f, 500, 30);
    g.fillText(k.caption, kx + 34, kpiY + kpiH - 34);
  });
  dither(g, W, H, 1.5);

  const kpiBox = { y: kpiY, h: kpiH, w: kpiW, gap: kpiGap, x: chartX };
  const live = makeCanvas(W, H);
  const lg = live.g;
  const valueBaseline = kpiY + kpiH - 100;
  return {
    canvas: live.c,
    render(p: PredProgress) {
      lg.drawImage(base.c, 0, 0);
      lg.textBaseline = "alphabetic";
      const F = clamp01(p.fade);

      // confidence band (opens up behind the line), then the line and its points
      const revealLine = smooth(clamp01(p.line));
      const revealBand = smooth(clamp01(p.band));
      const fx = (u: number): number => divX + (plotR - divX) * u;
      if (revealBand * F > 0.003) {
        lg.save();
        lg.beginPath();
        lg.rect(divX - 2, chartY + 10, (plotR - divX + 40) * revealBand + 2, chartH - 20);
        lg.clip();
        const spread = (i: number): number => 14 + (i / (futPts.length - 1)) * 44;
        const upper = futPts.map(([x, y], i) => [x, y - spread(i)] as [number, number]);
        const lower = futPts.map(([x, y], i) => [x, y + spread(i)] as [number, number]).reverse();
        lg.beginPath();
        smoothPathOn(lg, upper, false);
        smoothPathOn(lg, lower, true);
        lg.closePath();
        const band = lg.createLinearGradient(0, plotT, 0, plotB);
        band.addColorStop(0, `rgba(150,110,250,${0.26 * F})`);
        band.addColorStop(1, `rgba(150,110,250,${0.07 * F})`);
        lg.fillStyle = band;
        lg.fill();
        lg.restore();
      }
      if (revealLine * F > 0.003) {
        const rx = fx(revealLine);
        lg.save();
        lg.globalAlpha = F;
        lg.beginPath();
        lg.rect(divX - 2, chartY + 10, rx - divX + 2, chartH - 20);
        lg.clip();
        lg.strokeStyle = "#b79cff";
        lg.lineWidth = 7;
        lg.lineCap = "round";
        lg.beginPath();
        smoothPathOn(lg, futPts, false);
        lg.stroke();
        lg.restore();
        // future points appear as the line reaches them
        lg.save();
        lg.globalAlpha = F;
        futPts.forEach(([x, y], i) => {
          if (i === 0 || i % 3 !== 0) return;
          const a = clamp01((rx - x) / 46 + 0.3);
          if (a <= 0) return;
          lg.fillStyle = "#e9defc";
          lg.beginPath();
          lg.arc(x, y, 9 * easeOut(a), 0, Math.PI * 2);
          lg.fill();
        });
        // a soft head where the line is being drawn
        if (revealLine < 0.999) {
          const t = revealLine * (futPts.length - 1);
          const i0 = Math.min(futPts.length - 2, Math.floor(t));
          const hy = futPts[i0][1] + (futPts[i0 + 1][1] - futPts[i0][1]) * (t - i0);
          const glow = lg.createRadialGradient(rx, hy, 0, rx, hy, 34);
          glow.addColorStop(0, "rgba(233,222,252,0.9)");
          glow.addColorStop(1, "rgba(167,139,250,0)");
          lg.fillStyle = glow;
          lg.beginPath();
          lg.arc(rx, hy, 34, 0, Math.PI * 2);
          lg.fill();
        }
        lg.restore();
      }

      // result values: dormant dashes, then each counts up and settles
      KPI_SPECS.forEach((k, i) => {
        const kx = kpiBox.x + i * (kpiBox.w + kpiBox.gap) + 34;
        const local = stagger(clamp01(p.kpi), i, KPI_SPECS.length, 0.6);
        const shown = easeOut(local) * F;
        const dashA = clamp01(1 - shown / 0.35);
        if (dashA > 0.003) {
          lg.fillStyle = `rgba(148,163,184,${0.45 * dashA})`;
          lg.font = font(f, 700, 84);
          lg.fillText("—", kx, valueBaseline);
        }
        const valA = clamp01((shown - 0.25) / 0.75);
        if (valA > 0.003) {
          lg.save();
          lg.globalAlpha = valA;
          lg.fillStyle = k.color;
          lg.font = font(f, 700, 84);
          const v = Math.round(k.target * easeOut(clamp01(local)));
          lg.fillText(`${k.prefix}${v}${k.suffix}`, kx, valueBaseline);
          lg.restore();
        }
      });
    },
  };
}

export { canvasTexture };
