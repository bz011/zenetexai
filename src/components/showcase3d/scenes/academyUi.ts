import { dither, makeCanvas } from "../kit";
import { INK, MUTED, checkMark, drawInBox, fitFontSize, font, glassPanel, rr } from "../cardUi";
import type { UiFont } from "../uiFont";
import type { Translations } from "@/lib/translations";

type AcademyCopy = Translations["showcase"]["academy"];

/**
 * Canvas drawings for the Academy scene: the PMP course panel, the lesson
 * screen, the exam simulator, the certificate and the AI Agents Course teaser.
 * Illustrative product UI only. Each animated one keeps its static chrome in a
 * cached layer and repaints only the parts that change (`render(progress)`).
 */

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const smooth = (t: number): number => t * t * (3 - 2 * t);
/** Two-phase crossfade of one slot: the outgoing state is gone by the halfway point, then the incoming one fades in. */
const xOut = (p: number): number => clamp01(1 - 2 * p);
const xIn = (p: number): number => clamp01(2 * p - 1);

const GREEN = "#34d399";
const BLUE = "#60a5fa";
const CYAN = "#38d6ee";
const VIOLET = "#a78bfa";
const GOLD = "#e5b94e";

export interface LiveScreen<P> {
  canvas: HTMLCanvasElement;
  render(p: P): void;
}

function withAlpha(g: CanvasRenderingContext2D, a: number, fn: () => void): void {
  if (a <= 0.003) return;
  g.save();
  g.globalAlpha = clamp01(a);
  fn();
  g.restore();
}

// ─────────────────────────────── icons ───────────────────────────────

type IconName = "book" | "doc" | "gear" | "play" | "people" | "flow" | "bars" | "clock" | "robot";

function icon(g: CanvasRenderingContext2D, name: IconName, cx: number, cy: number, s: number, color: string): void {
  g.save();
  g.translate(cx, cy);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = s * 0.09;
  g.lineCap = "round";
  g.lineJoin = "round";
  switch (name) {
    case "book":
      g.beginPath();
      g.moveTo(0, -s * 0.5);
      g.lineTo(0, s * 0.5);
      g.stroke();
      rr(g, -s * 0.62, -s * 0.5, s * 0.62, s, s * 0.08);
      g.stroke();
      rr(g, 0, -s * 0.5, s * 0.62, s, s * 0.08);
      g.stroke();
      [-0.2, 0.05, 0.3].forEach((y) => {
        g.beginPath();
        g.moveTo(-s * 0.48, s * y);
        g.lineTo(-s * 0.14, s * y);
        g.moveTo(s * 0.14, s * y);
        g.lineTo(s * 0.48, s * y);
        g.stroke();
      });
      break;
    case "doc":
      rr(g, -s * 0.4, -s * 0.52, s * 0.8, s * 1.04, s * 0.1);
      g.stroke();
      [-0.2, 0.02, 0.24].forEach((y, i) => {
        g.beginPath();
        g.moveTo(-s * 0.2, s * y);
        g.lineTo(s * (i === 2 ? 0.05 : 0.2), s * y);
        g.stroke();
      });
      break;
    case "gear": {
      g.beginPath();
      g.arc(0, 0, s * 0.2, 0, Math.PI * 2);
      g.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i;
        g.beginPath();
        g.moveTo(Math.cos(a) * s * 0.34, Math.sin(a) * s * 0.34);
        g.lineTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5);
        g.stroke();
      }
      g.beginPath();
      g.arc(0, 0, s * 0.36, 0, Math.PI * 2);
      g.stroke();
      break;
    }
    case "play":
      g.beginPath();
      g.moveTo(-s * 0.28, -s * 0.42);
      g.lineTo(s * 0.42, 0);
      g.lineTo(-s * 0.28, s * 0.42);
      g.closePath();
      g.fill();
      break;
    case "people":
      g.beginPath();
      g.arc(0, -s * 0.2, s * 0.17, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(0, s * 0.5, s * 0.34, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
      [-1, 1].forEach((k) => {
        g.beginPath();
        g.arc(k * s * 0.44, s * 0.02, s * 0.11, 0, Math.PI * 2);
        g.stroke();
      });
      break;
    case "flow":
      [
        [-0.34, -0.3],
        [0.34, -0.3],
        [0, 0.34],
      ].forEach(([x, y]) => {
        g.beginPath();
        g.arc(s * x, s * y, s * 0.13, 0, Math.PI * 2);
        g.stroke();
      });
      g.beginPath();
      g.moveTo(-s * 0.2, -s * 0.3);
      g.lineTo(s * 0.2, -s * 0.3);
      g.moveTo(-s * 0.26, -s * 0.18);
      g.lineTo(-s * 0.06, s * 0.22);
      g.moveTo(s * 0.26, -s * 0.18);
      g.lineTo(s * 0.06, s * 0.22);
      g.stroke();
      break;
    case "bars":
      [0.35, 0.65, 1].forEach((h, i) => {
        const bh = s * h * 0.9;
        rr(g, -s * 0.44 + i * s * 0.32, s * 0.45 - bh, s * 0.22, bh, 3);
        g.fill();
      });
      break;
    case "clock":
      g.beginPath();
      g.arc(0, s * 0.05, s * 0.4, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(0, s * 0.05);
      g.lineTo(0, -s * 0.18);
      g.moveTo(0, s * 0.05);
      g.lineTo(s * 0.16, s * 0.14);
      g.moveTo(-s * 0.1, -s * 0.5);
      g.lineTo(s * 0.1, -s * 0.5);
      g.stroke();
      break;
    case "robot":
      rr(g, -s * 0.44, -s * 0.24, s * 0.88, s * 0.7, s * 0.2);
      g.stroke();
      g.beginPath();
      g.moveTo(0, -s * 0.24);
      g.lineTo(0, -s * 0.44);
      g.stroke();
      g.beginPath();
      g.arc(0, -s * 0.5, s * 0.07, 0, Math.PI * 2);
      g.fill();
      [-1, 1].forEach((k) => {
        g.beginPath();
        g.arc(k * s * 0.18, s * 0.06, s * 0.07, 0, Math.PI * 2);
        g.fill();
      });
      g.beginPath();
      g.moveTo(-s * 0.12, s * 0.28);
      g.lineTo(s * 0.12, s * 0.28);
      g.stroke();
      break;
  }
  g.restore();
}

function lockIcon(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string): void {
  g.save();
  g.translate(cx, cy);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = s * 0.11;
  g.lineCap = "round";
  rr(g, -s * 0.36, -s * 0.06, s * 0.72, s * 0.5, s * 0.1);
  g.fill();
  g.beginPath();
  g.arc(0, -s * 0.06, s * 0.24, Math.PI, 0);
  g.stroke();
  g.restore();
}

function ringIcon(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, w = 6): void {
  g.strokeStyle = color;
  g.lineWidth = w;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();
}

function checkBadge(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string): void {
  g.fillStyle = fill;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  checkMark(g, cx, cy, r * 1.15, "#052e1f", r * 0.2);
}

// ─────────────────────────────── PMP course panel ───────────────────────────────

export const COURSE_W = 760;
export const COURSE_H = 1200;

/** Course state: Module 3 finishing, Module 4 opening, and the header progress advancing from 2 to 3 of 6. */
export interface CourseProgress {
  done3: number;
  next4: number;
  bar: number;
}
export const COURSE_START: CourseProgress = { done3: 0, next4: 0, bar: 0 };
export const COURSE_END: CourseProgress = { done3: 1, next4: 1, bar: 1 };

const MODULE_ICONS: IconName[] = ["doc", "gear", "play", "people", "flow", "bars"];

const ROW_X = 44;
const ROW_W = COURSE_W - 88;
const ROW_H = 138;
const ROW_GAP = 13;
const ROW_Y0 = 240;
const rowY = (i: number): number => ROW_Y0 + i * (ROW_H + ROW_GAP);

export function createCoursePanel(f: UiFont, copy: AcademyCopy): LiveScreen<CourseProgress> {
  const W = COURSE_W;
  const H = COURSE_H;
  const base = makeCanvas(W, H);
  const g = base.g;
  const rtl = f.rtl;
  glassPanel(g, W, H, 60, "#60a5fa");

  // header: icon+title row mirrors under RTL, like every other row in this scene
  const headIconCx = rtl ? W - 44 - 46 : 44 + 46;
  const headTextX = rtl ? 44 : 44 + 128;
  const headTextW = W - 44 * 2 - 128;
  icon(g, "book", headIconCx, 96, 78, "#5eb4ff");
  g.fillStyle = INK;
  g.textBaseline = "alphabetic";
  fitFontSize(g, f, 700, 66, copy.pmpCourse, headTextW, 36);
  drawInBox(g, copy.pmpCourse, headTextX, headTextW, 116, rtl);
  // progress track (the fill and its label are live)
  g.fillStyle = "rgba(255,255,255,0.08)";
  rr(g, ROW_X, 200, ROW_W, 12, 6);
  g.fill();

  const bgFor = (kind: "plain" | "active" | "done" | "locked" | "next", y: number, ctx: CanvasRenderingContext2D, a: number): void => {
    withAlpha(ctx, a, () => {
      if (kind === "active") {
        const grad = ctx.createLinearGradient(ROW_X, 0, ROW_X + ROW_W, 0);
        grad.addColorStop(0, "rgba(59,130,246,0.38)");
        grad.addColorStop(1, "rgba(59,130,246,0.14)");
        ctx.fillStyle = grad;
        rr(ctx, ROW_X, y, ROW_W, ROW_H, 26);
        ctx.fill();
        ctx.strokeStyle = "rgba(96,165,250,0.9)";
        ctx.lineWidth = 3;
        rr(ctx, ROW_X + 1.5, y + 1.5, ROW_W - 3, ROW_H - 3, 25);
        ctx.stroke();
      } else if (kind === "next") {
        ctx.fillStyle = "rgba(96,165,250,0.09)";
        rr(ctx, ROW_X, y, ROW_W, ROW_H, 26);
        ctx.fill();
        ctx.strokeStyle = "rgba(96,165,250,0.45)";
        ctx.lineWidth = 2;
        rr(ctx, ROW_X + 1, y + 1, ROW_W - 2, ROW_H - 2, 25);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.045)";
        rr(ctx, ROW_X, y, ROW_W, ROW_H, 26);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 2;
        rr(ctx, ROW_X + 1, y + 1, ROW_W - 2, ROW_H - 2, 25);
        ctx.stroke();
      }
    });
  };
  // RTL: the tile moves to the row's other end, title/subtitle right-align reading back toward it, and the
  // status badge (check/lock/ring) moves to the row's near end - the row's own internal layout mirrors, the
  // panel's position in the scene does not.
  const tileX = rtl ? ROW_X + ROW_W - 24 - 96 : ROW_X + 24;
  const rowTextX = rtl ? ROW_X + 24 : ROW_X + 148;
  const rowTextW = ROW_W - 148 - 96;
  const statusX = rtl ? ROW_X + 62 : ROW_X + ROW_W - 62;
  /** icon tile + the two lines of text; `dim` fades locked rows */
  const rowContent = (ctx: CanvasRenderingContext2D, i: number, y: number, tileColor: string, textA: number): void => {
    const m = { title: copy.modules[i].title, sub: copy.modules[i].subtitle, icon: MODULE_ICONS[i] };
    withAlpha(ctx, 1, () => {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      rr(ctx, tileX, y + 22, 96, 96, 22);
      ctx.fill();
      icon(ctx, m.icon, tileX + 48, y + 70, 54, tileColor);
      ctx.save();
      ctx.globalAlpha = textA;
      ctx.fillStyle = INK;
      ctx.textBaseline = "alphabetic";
      fitFontSize(ctx, f, 700, 42, m.title, rowTextW, 24);
      drawInBox(ctx, m.title, rowTextX, rowTextW, y + 68, rtl);
      ctx.fillStyle = MUTED;
      fitFontSize(ctx, f, 500, 31, m.sub, rowTextW, 20);
      drawInBox(ctx, m.sub, rowTextX, rowTextW, y + 110, rtl);
      ctx.restore();
    });
  };

  // rows that never change: 1 and 2 done, 5 and 6 locked
  [0, 1].forEach((i) => {
    bgFor("plain", rowY(i), g, 1);
    rowContent(g, i, rowY(i), "#93a4c4", 1);
    checkBadge(g, statusX, rowY(i) + ROW_H / 2, 24, GREEN);
  });
  [4, 5].forEach((i) => {
    bgFor("plain", rowY(i), g, 1);
    rowContent(g, i, rowY(i), "#6f7d99", 0.62);
    lockIcon(g, statusX, rowY(i) + ROW_H / 2, 42, "rgba(148,163,184,0.7)");
  });
  dither(g, W, H, 1.4);

  const live = makeCanvas(W, H);
  const lg = live.g;
  return {
    canvas: live.c,
    render(p: CourseProgress) {
      lg.drawImage(base.c, 0, 0);
      lg.textBaseline = "alphabetic";
      // header: progress fill and label (2 of 6 -> 3 of 6)
      const bar = smooth(clamp01(p.bar));
      const fill = ((2 + bar) / 6) * ROW_W;
      const grad = lg.createLinearGradient(ROW_X, 0, ROW_X + ROW_W, 0);
      grad.addColorStop(0, "#3b74f0");
      grad.addColorStop(1, "#22d3ee");
      lg.fillStyle = grad;
      rr(lg, ROW_X, 200, fill, 12, 6);
      lg.fill();
      lg.fillStyle = MUTED;
      lg.font = font(f, 500, 32);
      const t2 = copy.progress.of6.replace("{n}", "2");
      const t3 = copy.progress.of6.replace("{n}", "3");
      const progW = ROW_W - 128;
      withAlpha(lg, xOut(p.bar), () => drawInBox(lg, t2, rtl ? ROW_X : ROW_X + 128, progW, 172, rtl));
      withAlpha(lg, xIn(p.bar), () => drawInBox(lg, t3, rtl ? ROW_X : ROW_X + 128, progW, 172, rtl));

      // module 3: active -> completed
      const y3 = rowY(2);
      const d = smooth(clamp01(p.done3));
      bgFor("active", y3, lg, 1 - d);
      bgFor("plain", y3, lg, d);
      rowContent(lg, 2, y3, d > 0.5 ? "#93a4c4" : "#bcd4ff", 1);
      withAlpha(lg, 1 - d, () => {
        ringIcon(lg, statusX, y3 + ROW_H / 2, 22, "#7ab4ff", 6);
        lg.fillStyle = "#7ab4ff";
        lg.beginPath();
        lg.arc(statusX, y3 + ROW_H / 2, 8, 0, Math.PI * 2);
        lg.fill();
      });
      withAlpha(lg, d, () => checkBadge(lg, statusX, y3 + ROW_H / 2, 24, GREEN));

      // module 4: locked -> next up
      const y4 = rowY(3);
      const n = smooth(clamp01(p.next4));
      bgFor("plain", y4, lg, 1 - n);
      bgFor("next", y4, lg, n);
      rowContent(lg, 3, y4, n > 0.5 ? "#8fb8ff" : "#6f7d99", 0.62 + 0.38 * n);
      withAlpha(lg, xOut(n), () => lockIcon(lg, statusX, y4 + ROW_H / 2, 42, "rgba(148,163,184,0.7)"));
      withAlpha(lg, xIn(n), () => {
        ringIcon(lg, statusX, y4 + ROW_H / 2, 22, "rgba(122,180,255,0.9)", 5);
      });
    },
  };
}

// ─────────────────────────────── lesson screen (the laptop display) ───────────────────────────────

export const LESSON_W = 1280;
export const LESSON_H = 900;

export interface LessonProgress {
  /** playback position 0..1 */
  play: number;
  /** the lesson has finished: full bar, check on the current lesson */
  complete: number;
}
export const LESSON_START: LessonProgress = { play: 0.1, complete: 0 };
export const LESSON_END: LessonProgress = { play: 1, complete: 1 };

const SLIDE = { x: 40, y: 92, w: 870, h: 590 };
const SIDE = { x: 940, y: 92, w: 300 };
const CTRL_Y = 708;

export function createLessonScreen(f: UiFont, copy: AcademyCopy): LiveScreen<LessonProgress> {
  const W = LESSON_W;
  const H = LESSON_H;
  const base = makeCanvas(W, H);
  const g = base.g;
  const rtl = f.rtl;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b1226");
  bg.addColorStop(1, "#060913");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // top bar: window dots and the lesson breadcrumb
  ["#f87171", "#fbbf24", "#34d399"].forEach((c, i) => {
    g.fillStyle = c;
    g.globalAlpha = 0.75;
    g.beginPath();
    g.arc(46 + i * 30, 46, 8, 0, Math.PI * 2);
    g.fill();
  });
  g.globalAlpha = 1;
  g.fillStyle = MUTED;
  g.font = font(f, 600, 30);
  g.textBaseline = "alphabetic";
  fitFontSize(g, f, 600, 30, copy.lessonBreadcrumb, W - 170 - 40, 20);
  drawInBox(g, copy.lessonBreadcrumb, 170, W - 170 - 40, 56, rtl);
  g.fillStyle = "rgba(255,255,255,0.06)";
  g.fillRect(0, 76, W, 2);

  // the slide: a clean project-management diagram (Predictive -> Agile -> Hybrid)
  const s = SLIDE;
  const sg = g.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
  sg.addColorStop(0, "#111c3a");
  sg.addColorStop(1, "#0a1330");
  g.fillStyle = sg;
  rr(g, s.x, s.y, s.w, s.h, 26);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.09)";
  g.lineWidth = 2;
  rr(g, s.x + 1, s.y + 1, s.w - 2, s.h - 2, 25);
  g.stroke();
  const slideTextW = s.w - 92;
  g.fillStyle = INK;
  g.font = font(f, 700, 52);
  fitFontSize(g, f, 700, 52, copy.lessonTitle, slideTextW, 32);
  drawInBox(g, copy.lessonTitle, s.x + 46, slideTextW, s.y + 84, rtl);
  g.fillStyle = MUTED;
  fitFontSize(g, f, 500, 30, copy.lessonSub, slideTextW, 20);
  drawInBox(g, copy.lessonSub, s.x + 46, slideTextW, s.y + 128, rtl);
  // sprint loop, right side of the slide
  const cx = s.x + s.w - 190;
  const cy = s.y + 330;
  g.strokeStyle = "rgba(96,165,250,0.5)";
  g.lineWidth = 9;
  g.lineCap = "round";
  g.beginPath();
  g.arc(cx, cy, 92, Math.PI * 0.15, Math.PI * 1.7);
  g.stroke();
  g.fillStyle = "rgba(96,165,250,0.85)";
  g.beginPath();
  g.moveTo(cx + 92 * Math.cos(Math.PI * 1.7) + 20, cy + 92 * Math.sin(Math.PI * 1.7) - 8);
  g.lineTo(cx + 92 * Math.cos(Math.PI * 1.7) - 12, cy + 92 * Math.sin(Math.PI * 1.7) - 22);
  g.lineTo(cx + 92 * Math.cos(Math.PI * 1.7) - 8, cy + 92 * Math.sin(Math.PI * 1.7) + 14);
  g.fill();
  g.fillStyle = MUTED;
  fitFontSize(g, f, 600, 26, copy.sprint, 150, 16);
  g.fillText(copy.sprint, cx - g.measureText(copy.sprint).width / 2, cy + 9);

  // key points under the diagram
  for (let i = 0; i < 3; i++) {
    const y = s.y + 400 + i * 52;
    g.fillStyle = "rgba(96,165,250,0.55)";
    g.beginPath();
    g.arc(s.x + 56, y, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(226,232,240,0.34)";
    rr(g, s.x + 80, y - 7, 560 - i * 90, 14, 7);
    g.fill();
  }
  // sidebar: the course's lessons
  for (let i = 0; i < 5; i++) {
    const y = SIDE.y + i * 118;
    const current = i === 2;
    g.fillStyle = current ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)";
    rr(g, SIDE.x, y, SIDE.w, 100, 20);
    g.fill();
    g.strokeStyle = current ? "rgba(96,165,250,0.7)" : "rgba(255,255,255,0.06)";
    g.lineWidth = 2;
    rr(g, SIDE.x + 1, y + 1, SIDE.w - 2, 98, 19);
    g.stroke();
    g.fillStyle = current ? "rgba(96,165,250,0.35)" : "rgba(255,255,255,0.08)";
    rr(g, SIDE.x + 16, y + 18, 96, 64, 10);
    g.fill();
    g.fillStyle = current ? "rgba(226,238,255,0.9)" : "rgba(226,232,240,0.28)";
    rr(g, SIDE.x + 128, y + 30, 146 - (i % 2) * 26, 13, 6);
    g.fill();
    g.fillStyle = "rgba(148,163,184,0.26)";
    rr(g, SIDE.x + 128, y + 58, 96, 11, 5);
    g.fill();
  }
  // lower text placeholders
  g.fillStyle = INK;
  g.font = font(f, 700, 36);
  fitFontSize(g, f, 700, 36, copy.lessonFooter, W - 80, 22);
  drawInBox(g, copy.lessonFooter, 40, W - 80, 822, rtl);
  g.fillStyle = "rgba(148,163,184,0.3)";
  rr(g, 40, 848, 640, 12, 6);
  g.fill();
  rr(g, 700, 848, 210, 12, 6);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.04)";
  rr(g, SIDE.x, SIDE.y + 600, SIDE.w, 12, 6);
  g.fill();
  dither(g, W, H, 1.4);

  const live = makeCanvas(W, H);
  const lg = live.g;
  const trackX = 130;
  const trackW = 640;
  const fmt = (frac: number): string => {
    const total = 18 * 60;
    const sec = Math.round(frac * total);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  };
  return {
    canvas: live.c,
    render(p: LessonProgress) {
      lg.drawImage(base.c, 0, 0);
      lg.textBaseline = "alphabetic";
      const play = clamp01(p.play);
      const done = smooth(clamp01(p.complete));

      // the slide's own activity: a marker moving Predictive -> Agile -> Hybrid. Pill order/position is kept
      // physical in both languages (the playback progress math is tied directly to it); only their text translates.
      const labels = copy.lessonStages;
      const bw = 200;
      const gap = 24;
      const by = SLIDE.y + 172;
      const active = Math.min(2, Math.floor(play * 3));
      labels.forEach((t, i) => {
        const bx = SLIDE.x + 46 + i * (bw + gap);
        const on = i === active;
        lg.fillStyle = on ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.05)";
        rr(lg, bx, by, bw, 92, 20);
        lg.fill();
        lg.strokeStyle = on ? "rgba(96,165,250,0.9)" : "rgba(255,255,255,0.08)";
        lg.lineWidth = on ? 3 : 2;
        rr(lg, bx + 1, by + 1, bw - 2, 90, 19);
        lg.stroke();
        lg.fillStyle = on ? INK : MUTED;
        fitFontSize(lg, f, 700, 32, t, bw - 24, 20);
        lg.fillText(t, bx + (bw - lg.measureText(t).width) / 2, by + 56);
        if (i < 2) {
          lg.strokeStyle = "rgba(148,163,184,0.5)";
          lg.lineWidth = 4;
          lg.beginPath();
          lg.moveTo(bx + bw + 4, by + 46);
          lg.lineTo(bx + bw + gap - 4, by + 46);
          lg.stroke();
        }
      });
      // mini bars under each approach: filled as the lesson reaches it
      labels.forEach((_, i) => {
        const bx = SLIDE.x + 46 + i * (bw + gap);
        const seg = clamp01(play * 3 - i);
        lg.fillStyle = "rgba(255,255,255,0.07)";
        rr(lg, bx, by + 120, bw, 10, 5);
        lg.fill();
        if (seg > 0.01) {
          lg.fillStyle = "#3b82f6";
          rr(lg, bx, by + 120, bw * seg, 10, 5);
          lg.fill();
        }
      });
      // completion note on the slide
      withAlpha(lg, done, () => {
        lg.fillStyle = "rgba(52,211,153,0.16)";
        rr(lg, SLIDE.x + 46, SLIDE.y + SLIDE.h - 96, 312, 62, 31);
        lg.fill();
        checkBadge(lg, SLIDE.x + 46 + 34, SLIDE.y + SLIDE.h - 65, 18, GREEN);
        lg.fillStyle = "#b9f3dc";
        fitFontSize(lg, f, 600, 30, copy.lessonComplete, 312 - 66 - 20, 18);
        drawInBox(lg, copy.lessonComplete, SLIDE.x + 46 + 66, 312 - 66 - 20, SLIDE.y + SLIDE.h - 55, rtl);
      });

      // sidebar: the current lesson gets its check
      withAlpha(lg, done, () => checkBadge(lg, SIDE.x + SIDE.w - 36, SIDE.y + 2 * 118 + 50, 15, GREEN));

      // playback controls
      icon(lg, "play", 72, CTRL_Y + 24, 34, "#e2e8f0");
      lg.fillStyle = "rgba(255,255,255,0.12)";
      rr(lg, trackX, CTRL_Y + 19, trackW, 10, 5);
      lg.fill();
      const pg = lg.createLinearGradient(trackX, 0, trackX + trackW, 0);
      pg.addColorStop(0, "#3b74f0");
      pg.addColorStop(1, "#22d3ee");
      lg.fillStyle = pg;
      rr(lg, trackX, CTRL_Y + 19, trackW * play, 10, 5);
      lg.fill();
      lg.fillStyle = "#e2e8f0";
      lg.beginPath();
      lg.arc(trackX + trackW * play, CTRL_Y + 24, 12, 0, Math.PI * 2);
      lg.fill();
      lg.fillStyle = MUTED;
      lg.font = font(f, 600, 26);
      lg.fillText(`${fmt(play)} / 18:00`, trackX + trackW + 28, CTRL_Y + 34);
    },
  };
}

// ─────────────────────────────── exam simulator ───────────────────────────────

export const SIM_W = 840;
export const SIM_H = 1050;

export interface SimProgress {
  /** the question comes alive: brighter content, live submit button */
  active: number;
  /** one answer is chosen */
  select: number;
  /** submit is pressed */
  press: number;
  /** the answer is marked correct */
  result: number;
  /** the question counter and progress step forward */
  advance: number;
}
export const SIM_START: SimProgress = { active: 0, select: 0, press: 0, result: 0, advance: 0 };
export const SIM_END: SimProgress = { active: 1, select: 1, press: 0, result: 1, advance: 1 };

const SIM_PAD = 44;
const SIM_OPT_Y = 500;
const SIM_OPT_H = 84;
const SIM_OPT_GAP = 14;
const SIM_SEL = 1;
const SIM_BTN = { y: 926, h: 84 };

export function createSimulatorPanel(f: UiFont, copy: AcademyCopy): LiveScreen<SimProgress> {
  const W = SIM_W;
  const H = SIM_H;
  const base = makeCanvas(W, H);
  const g = base.g;
  const rtl = f.rtl;
  glassPanel(g, W, H, 56, "#60a5fa");
  // header: RTL swaps which side carries the icon+title vs. the clock+timer cluster
  const titleIconCx = rtl ? W - SIM_PAD - 40 : SIM_PAD + 40;
  const titleX = rtl ? SIM_PAD : SIM_PAD + 100;
  const timer = "02:15:00";
  g.font = font(f, 600, 42);
  const tw = g.measureText(timer).width;
  const titleW = W - SIM_PAD * 2 - 100 - (tw + 40 + 24);
  icon(g, "doc", titleIconCx, 88, 66, "#5eb4ff");
  g.fillStyle = INK;
  g.textBaseline = "alphabetic";
  fitFontSize(g, f, 700, 48, copy.simulator.title, titleW, 28);
  drawInBox(g, copy.simulator.title, titleX, titleW, 104, rtl);
  // clock + timer
  g.fillStyle = INK;
  g.font = font(f, 600, 42);
  if (rtl) {
    g.fillText(timer, SIM_PAD, 196);
    icon(g, "clock", SIM_PAD + tw + 40, 182, 44, "#5eb4ff");
  } else {
    g.fillText(timer, W - SIM_PAD - tw, 196);
    icon(g, "clock", W - SIM_PAD - tw - 40, 182, 44, "#5eb4ff");
  }
  // progress track
  g.fillStyle = "rgba(255,255,255,0.09)";
  rr(g, SIM_PAD, 262, W - SIM_PAD * 2, 12, 6);
  g.fill();
  dither(g, W, H, 1.4);

  const live = makeCanvas(W, H);
  const lg = live.g;
  const cw = W - SIM_PAD * 2;
  return {
    canvas: live.c,
    render(p: SimProgress) {
      lg.drawImage(base.c, 0, 0);
      lg.textBaseline = "alphabetic";
      const act = smooth(clamp01(p.active));
      const dim = 0.5 + 0.5 * act;
      const sel = smooth(clamp01(p.select));
      const res = clamp01(p.result);
      const adv = smooth(clamp01(p.advance));

      // question label + progress (45 -> 46 of 180); the progress bar's fill direction is kept physical in
      // both languages (see the module/verify-row bars elsewhere in the showcase) - only the label translates.
      lg.fillStyle = INK;
      lg.font = font(f, 600, 34);
      const q45 = copy.simulator.questionOf.replace("{n}", "45");
      const q46 = copy.simulator.questionOf.replace("{n}", "46");
      withAlpha(lg, xOut(adv) * dim, () => drawInBox(lg, q45, SIM_PAD, cw, 240, rtl));
      withAlpha(lg, xIn(adv) * dim, () => drawInBox(lg, q46, SIM_PAD, cw, 240, rtl));
      const frac = (45 + adv) / 180;
      const pg = lg.createLinearGradient(SIM_PAD, 0, SIM_PAD + cw, 0);
      pg.addColorStop(0, "#2563eb");
      pg.addColorStop(1, "#38d6ee");
      lg.fillStyle = pg;
      lg.globalAlpha = dim;
      rr(lg, SIM_PAD, 262, cw * frac, 12, 6);
      lg.fill();
      lg.globalAlpha = 1;

      // the question, as a concise representation: a card with three lines
      lg.fillStyle = "rgba(255,255,255,0.04)";
      rr(lg, SIM_PAD, 316, cw, 150, 24);
      lg.fill();
      lg.strokeStyle = `rgba(96,165,250,${0.1 + 0.5 * act})`;
      lg.lineWidth = 2.5;
      rr(lg, SIM_PAD + 1, 317, cw - 2, 148, 23);
      lg.stroke();
      [
        [0.92, 352],
        [0.78, 392],
        [0.5, 432],
      ].forEach(([wf, y]) => {
        lg.fillStyle = `rgba(226,232,240,${0.2 + 0.4 * act})`;
        rr(lg, SIM_PAD + 32, y, (cw - 64) * wf, 14, 7);
        lg.fill();
      });

      // answer choices
      for (let i = 0; i < 4; i++) {
        const y = SIM_OPT_Y + i * (SIM_OPT_H + SIM_OPT_GAP);
        const chosen = i === SIM_SEL;
        const s = chosen ? sel : 0;
        lg.fillStyle = "rgba(255,255,255,0.04)";
        rr(lg, SIM_PAD, y, cw, SIM_OPT_H, 22);
        lg.fill();
        lg.strokeStyle = `rgba(255,255,255,${0.06 + 0.05 * act})`;
        lg.lineWidth = 2;
        rr(lg, SIM_PAD + 1, y + 1, cw - 2, SIM_OPT_H - 2, 21);
        lg.stroke();
        if (chosen && s > 0.003) {
          withAlpha(lg, s * (1 - res), () => {
            lg.fillStyle = "rgba(56,214,238,0.1)";
            rr(lg, SIM_PAD, y, cw, SIM_OPT_H, 22);
            lg.fill();
            lg.strokeStyle = "rgba(56,214,238,0.85)";
            lg.lineWidth = 3;
            rr(lg, SIM_PAD + 1.5, y + 1.5, cw - 3, SIM_OPT_H - 3, 21);
            lg.stroke();
          });
          withAlpha(lg, s * res, () => {
            lg.fillStyle = "rgba(52,211,153,0.13)";
            rr(lg, SIM_PAD, y, cw, SIM_OPT_H, 22);
            lg.fill();
            lg.strokeStyle = "rgba(52,211,153,0.9)";
            lg.lineWidth = 3;
            rr(lg, SIM_PAD + 1.5, y + 1.5, cw - 3, SIM_OPT_H - 3, 21);
            lg.stroke();
          });
        }
        // radio
        const rx = SIM_PAD + 48;
        const ry = y + SIM_OPT_H / 2;
        lg.strokeStyle = `rgba(148,163,184,${0.5 * dim})`;
        lg.lineWidth = 4;
        lg.beginPath();
        lg.arc(rx, ry, 17, 0, Math.PI * 2);
        lg.stroke();
        if (chosen) {
          withAlpha(lg, s * (1 - res), () => {
            ringIcon(lg, rx, ry, 17, CYAN, 4);
            lg.fillStyle = CYAN;
            lg.beginPath();
            lg.arc(rx, ry, 8, 0, Math.PI * 2);
            lg.fill();
          });
          withAlpha(lg, s * res, () => checkBadge(lg, rx, ry, 18, GREEN));
        }
        // the answer as a line or two of skeleton text
        lg.fillStyle = chosen && s > 0.3 ? `rgba(226,238,255,${0.5 + 0.4 * s})` : `rgba(226,232,240,${0.16 + 0.26 * act})`;
        rr(lg, SIM_PAD + 92, y + 26, (cw - 150) * (0.8 - i * 0.07), 13, 6.5);
        lg.fill();
        lg.fillStyle = `rgba(148,163,184,${0.14 + 0.14 * act})`;
        rr(lg, SIM_PAD + 92, y + 50, (cw - 150) * (0.48 + (i % 2) * 0.12), 11, 5.5);
        lg.fill();
      }

      // submit -> correct. The button is ONE continuous shape that is always present (blue blending into green); only
      // the label changes, and the two labels slide past each other inside it, so at no point is the button empty and
      // the words are never stacked on top of one another.
      const press = smooth(clamp01(p.press));
      const dy = press * 5;
      const t = smooth(res);
      const baseA = 0.4 + 0.6 * act;
      const bx = SIM_PAD + 90;
      const bw = cw - 180;
      const by = SIM_BTN.y + dy;
      const bh = SIM_BTN.h - dy;
      lg.fillStyle = "rgba(255,255,255,0.04)";
      rr(lg, SIM_PAD, SIM_BTN.y - 16, cw, SIM_BTN.h + 32, 24);
      lg.fill();
      lg.save();
      rr(lg, bx, by, bw, bh, 24);
      lg.clip();
      const shape = (fill0: string, fill1: string, a: number): void => {
        withAlpha(lg, a, () => {
          const gr = lg.createLinearGradient(0, SIM_BTN.y, 0, SIM_BTN.y + SIM_BTN.h);
          gr.addColorStop(0, fill0);
          gr.addColorStop(1, fill1);
          lg.fillStyle = gr;
          lg.fillRect(bx, by, bw, bh);
        });
      };
      shape("#2f6df0", "#1e4fd6", baseA);
      shape("#34d399", "#12a06e", baseA * t);
      const SLIDE_PX = 46;
      const baseY = SIM_BTN.y + 56 + dy * 0.5;
      lg.font = font(f, 700, 40);
      lg.fillStyle = "#fff";
      const submitLabel = copy.simulator.submit;
      const correctLabel = copy.simulator.correct;
      fitFontSize(lg, f, 700, 40, submitLabel, bw - 40, 24);
      const submitW = lg.measureText(submitLabel).width;
      withAlpha(lg, baseA * (1 - t), () => lg.fillText(submitLabel, bx + (bw - submitW) / 2, baseY - t * SLIDE_PX));
      lg.font = font(f, 700, 40);
      fitFontSize(lg, f, 700, 40, correctLabel, bw - 80, 24);
      const correctW = lg.measureText(correctLabel).width;
      withAlpha(lg, t, () => {
        const y = baseY + (1 - t) * SLIDE_PX;
        // the checkmark sits on the side the word is read FROM: before it in English, after it (i.e. to its
        // right, since Arabic reads right-to-left) in Arabic.
        const checkCx = rtl ? bx + (bw + correctW) / 2 + 42 : bx + (bw - correctW) / 2 - 42;
        checkMark(lg, checkCx, y - 13, 26, "#fff", 6);
        lg.fillText(correctLabel, bx + (bw - correctW) / 2 + 6, y);
      });
      lg.restore();
    },
  };
}

// ─────────────────────────────── certificate ───────────────────────────────

export const CERT_W = 640;
export const CERT_H = 660;

/** `dormant`: a dark glass card with a faint outline of the certificate; `active`: the finished, gold-trimmed certificate. */
export function drawCertificate(f: UiFont, copy: AcademyCopy, active: boolean): HTMLCanvasElement {
  const W = CERT_W;
  const H = CERT_H;
  const { c, g } = makeCanvas(W, H);
  glassPanel(g, W, H, 56, active ? GOLD : "#64748b");
  // the paper
  const px = 60;
  const py = 92;
  const pw = W - 120;
  const ph = H - 168;
  if (active) {
    const paper = g.createLinearGradient(px, py, px + pw, py + ph);
    paper.addColorStop(0, "#f6ecd0");
    paper.addColorStop(1, "#e7d7ac");
    g.fillStyle = paper;
    rr(g, px, py, pw, ph, 14);
    g.fill();
    g.strokeStyle = "rgba(160,120,40,0.55)";
    g.lineWidth = 3;
    rr(g, px + 12, py + 12, pw - 24, ph - 24, 8);
    g.stroke();
  } else {
    // a dim, neutral slate paper with dark ink: clearly a document, nothing warm or gold about it. The ink is dark in
    // both states, so completing only "turns the lights on" (paper to cream, gold trim) and the text never has to invert.
    const paper = g.createLinearGradient(px, py, px + pw, py + ph);
    paper.addColorStop(0, "rgba(168,180,200,0.62)");
    paper.addColorStop(1, "rgba(128,140,160,0.5)");
    g.fillStyle = paper;
    rr(g, px, py, pw, ph, 14);
    g.fill();
    g.strokeStyle = "rgba(196,206,222,0.7)";
    g.lineWidth = 3;
    rr(g, px + 1.5, py + 1.5, pw - 3, ph - 3, 13);
    g.stroke();
    g.strokeStyle = "rgba(40,52,76,0.4)";
    g.lineWidth = 2;
    rr(g, px + 12, py + 12, pw - 24, ph - 24, 8);
    g.stroke();
    // where the medal will be awarded: a faint outline only
    ringIcon(g, W / 2, py + 54, 56, "rgba(40,52,76,0.5)", 3);
  }
  const ink = active ? "#2a2116" : "rgba(26,34,54,0.94)";
  g.fillStyle = ink;
  g.textBaseline = "alphabetic";
  fitFontSize(g, f, 700, 46, copy.certificate.title1, pw - 80, 28);
  g.fillText(copy.certificate.title1, px + (pw - g.measureText(copy.certificate.title1).width) / 2, py + 176);
  fitFontSize(g, f, 700, 46, copy.certificate.title2, pw - 80, 28);
  g.fillText(copy.certificate.title2, px + (pw - g.measureText(copy.certificate.title2).width) / 2, py + 232);
  // text lines
  g.fillStyle = active ? "rgba(90,70,30,0.28)" : "rgba(30,40,62,0.3)";
  rr(g, px + 60, py + 268, pw - 120, 10, 5);
  g.fill();
  rr(g, px + 90, py + 292, pw - 180, 10, 5);
  g.fill();
  // signature
  g.strokeStyle = active ? "rgba(70,55,30,0.7)" : "rgba(30,40,62,0.6)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(px + 52, py + ph - 56);
  g.bezierCurveTo(px + 80, py + ph - 96, px + 100, py + ph - 30, px + 130, py + ph - 62);
  g.bezierCurveTo(px + 150, py + ph - 80, px + 168, py + ph - 52, px + 196, py + ph - 60);
  g.stroke();
  g.strokeStyle = active ? "rgba(90,70,30,0.4)" : "rgba(30,40,62,0.4)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(px + 46, py + ph - 40);
  g.lineTo(px + 230, py + ph - 40);
  g.stroke();
  // rosette (bottom right)
  const rx = px + pw - 84;
  const ry = py + ph - 62;
  if (active) {
    const gd = g.createRadialGradient(rx - 6, ry - 6, 4, rx, ry, 44);
    gd.addColorStop(0, "#f7dc86");
    gd.addColorStop(1, "#b98a26");
    g.fillStyle = gd;
    g.beginPath();
    g.arc(rx, ry, 44, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(120,84,10,0.6)";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(rx, ry, 32, 0, Math.PI * 2);
    g.stroke();
  } else {
    ringIcon(g, rx, ry, 42, "rgba(30,40,62,0.5)", 3);
  }
  dither(g, W, H, 1.4);
  return c;
}

/** The gold medal that sits at the top of the certificate; revealed last, on its own layer (transparent canvas). */
export function drawSeal(): HTMLCanvasElement {
  const S = 300;
  const { c, g } = makeCanvas(S, S);
  const cx = S / 2;
  const cy = S / 2 - 8;
  const gd = g.createRadialGradient(cx - 18, cy - 18, 6, cx, cy, 92);
  gd.addColorStop(0, "#fbe7a1");
  gd.addColorStop(0.6, "#e0b345");
  gd.addColorStop(1, "#a97a1c");
  g.fillStyle = gd;
  g.beginPath();
  g.arc(cx, cy, 92, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(110,76,8,0.55)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(cx, cy, 74, 0, Math.PI * 2);
  g.stroke();
  checkMark(g, cx, cy, 78, "rgba(90,60,6,0.8)", 12);
  return c;
}

// ─────────────────────────────── AI Agents Course teaser ───────────────────────────────

export const AI_W = 940;
export const AI_H = 380;
/** where the "Coming Soon" pill sits in the AI card's canvas (px), for the acknowledgement glow */
export const AI_PILL = { x: 60, y: 268, w: 268, h: 66 };

export function drawAiCourseCard(f: UiFont, copy: AcademyCopy): HTMLCanvasElement {
  const W = AI_W;
  const H = AI_H;
  const { c, g } = makeCanvas(W, H);
  const rtl = f.rtl;
  glassPanel(g, W, H, 56, "#7c6bd6");
  // RTL: the robot icon+title/lines move to the right, the "AI" chip to the left - the row and the chip mirror
  // exactly like the icon+text rows elsewhere in the showcase.
  const robotCx = rtl ? W - 100 : 100;
  // The text box is padded symmetrically (176px on both sides), so its far edge already lands exactly on the
  // mirrored icon's position in both languages - the same box, just read from whichever end the icon is on.
  const titleX = 176;
  const titleW = AI_W - 176 * 2;
  icon(g, "robot", robotCx, 106, 84, "#9d8fe0");
  g.fillStyle = "rgba(230,236,247,0.92)";
  g.textBaseline = "alphabetic";
  fitFontSize(g, f, 700, 54, copy.aiCourse.title, titleW, 30);
  drawInBox(g, copy.aiCourse.title, titleX, titleW, 116, rtl);
  g.fillStyle = MUTED;
  fitFontSize(g, f, 500, 34, copy.aiCourse.line1, titleW, 20);
  drawInBox(g, copy.aiCourse.line1, 176, titleW, 174, rtl);
  fitFontSize(g, f, 500, 34, copy.aiCourse.line2, titleW, 20);
  drawInBox(g, copy.aiCourse.line2, 176, titleW, 218, rtl);
  // Coming Soon pill: mirrors to the row's other end together with the title block
  const p = AI_PILL;
  const pillX = rtl ? p.x : p.x + 116;
  g.fillStyle = "rgba(139,92,246,0.18)";
  rr(g, pillX, p.y, p.w, p.h, p.h / 2);
  g.fill();
  g.strokeStyle = "rgba(167,139,250,0.85)";
  g.lineWidth = 3;
  rr(g, pillX + 1.5, p.y + 1.5, p.w - 3, p.h - 3, p.h / 2 - 1.5);
  g.stroke();
  g.fillStyle = "#e4dcff";
  fitFontSize(g, f, 600, 32, copy.aiCourse.comingSoon, p.w - 24, 20);
  const t = copy.aiCourse.comingSoon;
  g.fillText(t, pillX + (p.w - g.measureText(t).width) / 2, p.y + 44);
  // the AI chip, mirrored to the opposite end from the title block
  const cx = rtl ? 170 : W - 170;
  const cy = H / 2;
  const chip = g.createLinearGradient(cx - 80, cy - 80, cx + 80, cy + 80);
  chip.addColorStop(0, "rgba(96,165,250,0.22)");
  chip.addColorStop(1, "rgba(139,92,246,0.22)");
  g.fillStyle = chip;
  rr(g, cx - 80, cy - 80, 160, 160, 30);
  g.fill();
  g.strokeStyle = "rgba(167,139,250,0.55)";
  g.lineWidth = 3.5;
  rr(g, cx - 80, cy - 80, 160, 160, 30);
  g.stroke();
  g.fillStyle = "rgba(226,222,255,0.85)";
  g.font = font(f, 700, 88);
  const ai = "AI";
  g.fillText(ai, cx - g.measureText(ai).width / 2, cy + 30);
  dither(g, W, H, 1.4);
  return c;
}
