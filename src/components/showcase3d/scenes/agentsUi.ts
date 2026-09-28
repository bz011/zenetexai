import { canvasTexture, dither, makeCanvas } from "../kit";
import type { UiFont } from "../uiFont";

/**
 * Canvas drawings for the AI Agents scene. Everything here is ILLUSTRATIVE demo
 * UI: a made-up appointment conversation, with no names, numbers or brands.
 */

const INK = "#f1f5f9";
const MUTED = "rgba(148,163,184,0.92)";
const LINE = "rgba(255,255,255,0.07)";

function font(f: UiFont, weight: number, px: number): string {
  return `${weight} ${px}px ${f.family}`;
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
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
 * The assistant's presence: a soft volumetric form with layered internal
 * gradients (blue core, violet undertone, cyan rim) and small drifting motes
 * of light around it for dimensionality - deliberately NOT a ring (reads as a
 * planet) and NOT a hard-edged sphere (reads as a bullet/icon). Belongs to the
 * assistant interface, not a hero object floating outside the phone.
 */
export function drawOrb(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, halo = true, motes = false): void {
  if (motes) {
    const spots: [number, number, number, number][] = [
      [1.85, -0.75, 0.1, 0.5],
      [-1.55, 1.05, 0.075, 0.4],
      [1.35, 1.5, 0.06, 0.32],
    ];
    spots.forEach(([dx, dy, rr, a]) => {
      const mx = cx + dx * r;
      const my = cy + dy * r;
      const mr = r * rr;
      const mg = g.createRadialGradient(mx, my, 0, mx, my, mr * 2.2);
      mg.addColorStop(0, `rgba(140,200,255,${a})`);
      mg.addColorStop(1, "rgba(140,200,255,0)");
      g.fillStyle = mg;
      g.beginPath();
      g.arc(mx, my, mr * 2.2, 0, Math.PI * 2);
      g.fill();
    });
  }
  if (halo) {
    const h = g.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 2.5);
    h.addColorStop(0, "rgba(96,140,255,0.26)");
    h.addColorStop(1, "rgba(96,140,255,0)");
    g.fillStyle = h;
    g.beginPath();
    g.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
    g.fill();
  }
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.clip();
  const body = g.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.06, cx, cy, r * 1.02);
  body.addColorStop(0, "#e0edff");
  body.addColorStop(0.22, "#86b6ff");
  body.addColorStop(0.58, "#3163e6");
  body.addColorStop(1, "#151d5e");
  g.fillStyle = body;
  g.fillRect(cx - r, cy - r, r * 2, r * 2);
  const violet = g.createRadialGradient(cx + r * 0.42, cy + r * 0.55, 0, cx + r * 0.42, cy + r * 0.55, r * 0.95);
  violet.addColorStop(0, "rgba(150,100,255,0.55)");
  violet.addColorStop(1, "rgba(150,100,255,0)");
  g.fillStyle = violet;
  g.fillRect(cx - r, cy - r, r * 2, r * 2);
  const rim = g.createRadialGradient(cx, cy, r * 0.72, cx, cy, r);
  rim.addColorStop(0, "rgba(34,211,238,0)");
  rim.addColorStop(1, "rgba(34,211,238,0.5)");
  g.fillStyle = rim;
  g.fillRect(cx - r, cy - r, r * 2, r * 2);
  g.restore();
  // soft specular
  g.save();
  g.translate(cx - r * 0.34, cy - r * 0.42);
  g.rotate(-0.6);
  const spec = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.42);
  spec.addColorStop(0, "rgba(255,255,255,0.7)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = spec;
  g.scale(1, 0.55);
  g.beginPath();
  g.arc(0, 0, r * 0.42, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.strokeStyle = "rgba(255,255,255,0.16)";
  g.lineWidth = Math.max(1.5, r * 0.04);
  g.beginPath();
  g.arc(cx, cy, r - g.lineWidth / 2, 0, Math.PI * 2);
  g.stroke();
}

function check(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, w = 6): void {
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
 * How far each part of the phone conversation has appeared, 0..1. The phone
 * screen is a live canvas: `PhoneScreen.render` redraws it from these values,
 * so every bubble can fade and rise into place instead of swapping between
 * pre-baked frames.
 */
export interface PhoneProgress {
  /** the customer's "I need to book" bubble */
  request: number;
  /** the assistant's typing indicator */
  thinking: number;
  /** the assistant's reply (replaces the typing indicator) */
  reply: number;
  /** the three time chips, staggered */
  chips: number;
  /** the 10:00 chip fills in */
  select: number;
  /** the customer's "10:00 AM" bubble */
  choice: number;
  /** the "verifying availability" row */
  verify: number;
  /** progress bar fill */
  work: number;
  /** "verifying" -> "booking" wording */
  booking: number;
  /** "booking" -> "booked" success message */
  done: number;
  /** header status label as a float index into STATUS (fractions crossfade) */
  status: number;
  /** multiplies every conversation element - used to fade the chat out on reset */
  fade: number;
  /** ms, drives the typing dots only */
  clock: number;
}

export const PHONE_EMPTY: PhoneProgress = { request: 0, thinking: 0, reply: 0, chips: 0, select: 0, choice: 0, verify: 0, work: 0, booking: 0, done: 0, status: 0, fade: 1, clock: 0 };
export const PHONE_FULL: PhoneProgress = { request: 1, thinking: 0, reply: 1, chips: 1, select: 1, choice: 1, verify: 1, work: 1, booking: 1, done: 1, status: 0, fade: 1, clock: 0 };
/** header status labels; PhoneProgress.status indexes (and crossfades between) these */
export const STATUS = ["Online", "Reading request…", "Searching knowledge…", "Online", "Verifying availability…", "Booking appointment…", "Online"];

export interface PhoneScreen {
  canvas: HTMLCanvasElement;
  render(p: PhoneProgress): void;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const smooth = (t: number): number => t * t * (3 - 2 * t);
/** Two-phase crossfade of one slot: the outgoing wording is gone by the halfway point, then the incoming one fades in - so the two never overlap. */
const xOut = (p: number): number => clamp01(1 - 2 * p);
const xIn = (p: number): number => clamp01(2 * p - 1);
/** item i of n starts after the previous one, staggered across the first `spread` of the timeline */
const stagger = (p: number, i: number, n: number, spread: number): number => clamp01(p * (1 + spread) - (n <= 1 ? 0 : (i / (n - 1)) * spread));

/**
 * 944 x 2115 (matches the phone's screen opening): the assistant conversation.
 * The static chrome (background, camera pill, header, composer) is drawn once
 * into a cached layer; `render` blits it and paints only the conversation on
 * top. Every element has a fixed final position (the full conversation is laid
 * out up front), so nothing ever shifts when a later element appears.
 */
export function createPhoneScreen(f: UiFont): PhoneScreen {
  const W = 944;
  const H = 2115;
  const base = makeCanvas(W, H);
  const g = base.g;
  const pad = 60;

  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0a1024");
  bg.addColorStop(1, "#070b18");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const top = g.createRadialGradient(W / 2, 230, 0, W / 2, 230, 620);
  top.addColorStop(0, "rgba(60,110,255,0.20)");
  top.addColorStop(1, "rgba(60,110,255,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, W, 900);

  // camera pill
  g.fillStyle = "#000";
  rr(g, W / 2 - 96, 46, 192, 54, 27);
  g.fill();

  // header: the assistant's presence (the status label is the live layer)
  drawOrb(g, pad + 58, 214, 56, true, true);
  g.fillStyle = INK;
  g.font = font(f, 700, 42);
  g.textBaseline = "alphabetic";
  g.fillText("ZentexAI Assistant", pad + 146, 202);
  g.fillStyle = "#4ade80";
  g.beginPath();
  g.arc(pad + 150, 232, 6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = LINE;
  g.fillRect(pad, 320, W - pad * 2, 2);

  // composer: a complete input bar (attach, message field, mic, send)
  const cy = H - 240;
  const barH = 116;
  g.fillStyle = "#0f1730";
  rr(g, pad, cy, W - pad * 2, barH, 58);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.07)";
  g.lineWidth = 2;
  g.stroke();

  g.strokeStyle = "rgba(148,163,184,0.7)";
  g.lineWidth = 5;
  g.lineCap = "round";
  g.lineJoin = "round";
  const clipX = pad + 54;
  g.beginPath();
  g.moveTo(clipX - 10, cy + barH / 2 + 16);
  g.lineTo(clipX - 10, cy + barH / 2 - 14);
  g.arc(clipX, cy + barH / 2 - 14, 10, Math.PI, 0, true);
  g.lineTo(clipX + 10, cy + barH / 2 + 10);
  g.stroke();

  g.fillStyle = "rgba(148,163,184,0.7)";
  g.font = font(f, 500, 36);
  g.fillText("Type a message…", pad + 96, cy + barH / 2 + 12);

  const micX = W - pad - 138;
  g.strokeStyle = "rgba(148,163,184,0.7)";
  g.lineWidth = 5;
  rr(g, micX - 13, cy + barH / 2 - 26, 26, 38, 13);
  g.stroke();
  g.beginPath();
  g.moveTo(micX, cy + barH / 2 + 12);
  g.lineTo(micX, cy + barH / 2 + 24);
  g.moveTo(micX - 14, cy + barH / 2 + 24);
  g.lineTo(micX + 14, cy + barH / 2 + 24);
  g.stroke();

  g.fillStyle = "#2b5be0";
  g.beginPath();
  g.arc(W - pad - 52, cy + barH / 2, 34, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#fff";
  g.lineWidth = 6;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(W - pad - 52, cy + barH / 2 + 16);
  g.lineTo(W - pad - 52, cy + barH / 2 - 16);
  g.moveTo(W - pad - 66, cy + barH / 2 - 2);
  g.lineTo(W - pad - 52, cy + barH / 2 - 17);
  g.lineTo(W - pad - 38, cy + barH / 2 - 2);
  g.stroke();

  // home indicator
  g.fillStyle = "rgba(255,255,255,0.4)";
  rr(g, W / 2 - 130, H - 60, 260, 10, 5);
  g.fill();
  dither(g, W, H, 1.6);

  // ── conversation layout, in the K-scaled coordinate space (fixed for every element) ──
  const K = 1.2;
  const LW = W / K;
  const lpad = 50;
  const replyX = lpad + 76;
  const replyW = LW - lpad - replyX - 8;
  g.font = font(f, 500, 37);
  const replyLines = wrap(g, "Of course. These times are available tomorrow:", replyW - 68);
  const replyH = 44 + replyLines.length * 54 + 30;
  const requestY = 0;
  const replyY = requestY + 112 + 52;
  const chipsY = replyY + replyH + 34;
  const choiceY = chipsY + 96 + 46;
  const verifyY = choiceY + 112 + 46; // orb centre = verifyY + 24
  const barY = verifyY + 76;
  const subY = barY + 40;
  const barX = lpad + 76;
  const barW = LW - lpad - barX - 8;

  const live = makeCanvas(W, H);
  const lg = live.g;

  const userBubble = (text: string, yy: number): void => {
    lg.font = font(f, 500, 39);
    const tw = lg.measureText(text).width;
    const w = Math.min(LW - lpad * 2 - 60, tw + 76);
    const h = 112;
    const x = LW - lpad - w;
    const grad = lg.createLinearGradient(x, yy, x + w, yy + h);
    grad.addColorStop(0, "#3b74f0");
    grad.addColorStop(1, "#2251d6");
    lg.fillStyle = grad;
    rr(lg, x, yy, w, h, 40);
    lg.fill();
    lg.fillStyle = "#fff";
    lg.fillText(text, x + 38, yy + 70);
  };
  /** run `fn` at `alpha`, risen from 22px lower as it fades in */
  const appear = (v: number, fade: number, fn: () => void): void => {
    const a = clamp01(v) * fade;
    if (a <= 0.003) return;
    lg.save();
    lg.globalAlpha = a;
    lg.translate(0, (1 - smooth(clamp01(v))) * 22);
    fn();
    lg.restore();
  };
  const fadeOnly = (a: number, fn: () => void): void => {
    if (a <= 0.003) return;
    lg.save();
    lg.globalAlpha = clamp01(a);
    fn();
    lg.restore();
  };

  return {
    canvas: live.c,
    render(p: PhoneProgress) {
      lg.drawImage(base.c, 0, 0);
      lg.textBaseline = "alphabetic";

      // header status: the two neighbouring labels crossfade as `status` moves between indices
      const si = Math.min(STATUS.length - 1, Math.max(0, Math.floor(p.status)));
      const sf = p.status - si;
      lg.font = font(f, 500, 29);
      lg.fillStyle = MUTED;
      fadeOnly(xOut(sf), () => lg.fillText(STATUS[si], pad + 166, 244));
      if (sf > 0.003 && si + 1 < STATUS.length) fadeOnly(xIn(sf), () => lg.fillText(STATUS[si + 1], pad + 166, 244));

      lg.save();
      lg.translate(0, 350);
      lg.scale(K, K);
      const F = p.fade;

      appear(p.request, F, () => userBubble("I need to book an appointment.", requestY));

      // assistant: orb + typing pill, which the reply bubble replaces in place
      const present = clamp01(Math.max(p.thinking, p.reply));
      fadeOnly(present * F, () => drawOrb(lg, lpad + 22, replyY + 40, 20, false));
      const pill = clamp01(p.thinking) * (1 - clamp01(p.reply)) * F;
      fadeOnly(pill, () => {
        lg.fillStyle = "#131c34";
        rr(lg, replyX, replyY, 170, 84, 42);
        lg.fill();
        for (let i = 0; i < 3; i++) {
          const wave = 0.5 + 0.5 * Math.sin(p.clock / 260 - i * 0.9);
          lg.fillStyle = `rgba(200,215,240,${0.3 + 0.6 * wave})`;
          lg.beginPath();
          lg.arc(replyX + 52 + i * 33, replyY + 42, 8, 0, Math.PI * 2);
          lg.fill();
        }
      });
      appear(p.reply, F, () => {
        lg.fillStyle = "#131c34";
        rr(lg, replyX, replyY, replyW, replyH, 40);
        lg.fill();
        lg.strokeStyle = "rgba(255,255,255,0.06)";
        lg.lineWidth = 2;
        lg.stroke();
        lg.fillStyle = INK;
        lg.font = font(f, 500, 37);
        replyLines.forEach((l, i) => lg.fillText(l, replyX + 36, replyY + 74 + i * 54));
      });

      // time chips, staggered; the 10:00 chip then fills in
      ["9:30 AM", "10:00 AM", "11:30 AM"].forEach((t, i) => {
        const cx = replyX + i * (190 + 16);
        const local = stagger(p.chips, i, 3, 0.8);
        appear(local, F, () => {
          lg.font = font(f, 600, 34);
          lg.strokeStyle = "rgba(255,255,255,0.16)";
          lg.lineWidth = 2.5;
          rr(lg, cx + 1.25, chipsY + 1.25, 190 - 2.5, 96 - 2.5, 46);
          lg.stroke();
          const tw = lg.measureText(t).width;
          lg.fillStyle = "rgba(226,232,240,0.9)";
          lg.fillText(t, cx + (190 - tw) / 2, chipsY + 62);
          if (i === 1 && p.select > 0.003) {
            lg.save();
            lg.globalAlpha = clamp01(p.select);
            const grad = lg.createLinearGradient(cx, chipsY, cx, chipsY + 96);
            grad.addColorStop(0, "#3b74f0");
            grad.addColorStop(1, "#2251d6");
            lg.fillStyle = grad;
            rr(lg, cx, chipsY, 190, 96, 48);
            lg.fill();
            lg.fillStyle = "#fff";
            lg.fillText(t, cx + (190 - tw) / 2, chipsY + 62);
            lg.restore();
          }
        });
      });

      appear(p.choice, F, () => userBubble("10:00 AM", choiceY));

      // action row: verifying -> booking -> booked, one line whose wording crossfades in place
      const v = clamp01(p.verify);
      const doneIn = xIn(clamp01(p.done));
      const doneOut = xOut(clamp01(p.done));
      const orbA = v * doneOut * F;
      fadeOnly(orbA, () => drawOrb(lg, lpad + 22, verifyY + 24, 20, false));
      lg.font = font(f, 500, 34);
      lg.fillStyle = "rgba(148,163,184,0.85)";
      fadeOnly(v * xOut(clamp01(p.booking)) * F, () => lg.fillText("Verifying availability…", lpad + 76, verifyY + 34));
      fadeOnly(v * xIn(clamp01(p.booking)) * doneOut * F, () => lg.fillText("Booking your appointment…", lpad + 76, verifyY + 34));
      // progress bar
      fadeOnly(v * doneOut * F, () => {
        lg.fillStyle = "rgba(255,255,255,0.08)";
        rr(lg, barX, barY, barW, 6, 3);
        lg.fill();
        const w = barW * clamp01(p.work);
        if (w > 2) {
          const prog = lg.createLinearGradient(barX, 0, barX + barW, 0);
          prog.addColorStop(0, "#3b74f0");
          prog.addColorStop(1, "#22d3ee");
          lg.fillStyle = prog;
          rr(lg, barX, barY, w, 6, 3);
          lg.fill();
        }
      });
      lg.font = font(f, 500, 30);
      lg.fillStyle = "rgba(148,163,184,0.6)";
      fadeOnly(v * xOut(clamp01(p.booking)) * F, () => lg.fillText("Verifying availability with your calendar", barX, subY));
      fadeOnly(v * xIn(clamp01(p.booking)) * doneOut * F, () => lg.fillText("Adding it to your calendar", barX, subY));
      // success: a check badge and the outcome, in the same place
      appear(doneIn, F, () => {
        lg.fillStyle = "#22d3ee";
        lg.beginPath();
        lg.arc(lpad + 22, verifyY + 24, 22, 0, Math.PI * 2);
        lg.fill();
        check(lg, lpad + 22, verifyY + 24, 24, "#04222b", 5);
        lg.fillStyle = INK;
        lg.font = font(f, 600, 36);
        lg.fillText("You're booked for 10:00 AM", lpad + 76, verifyY + 32);
        lg.fillStyle = "rgba(148,163,184,0.75)";
        lg.font = font(f, 500, 30);
        lg.fillText("Tomorrow · confirmation on its way", barX, verifyY + 84);
      });
      lg.restore();
    },
  };
}

export type CalendarLayer = "full" | "shell" | "idle" | "booked" | "footer";

/**
 * 1000 x 720: the business result, in layers so the scene can play the booking.
 * "shell" is the card without the 10:00 slot; "idle" and "booked" are the two
 * states of that slot (an open, dashed "Available" outline / the confirmed
 * booking) and "footer" the "Confirmation sent" line - each a transparent
 * layer, so the scene fades one out and then the next in and they never
 * overlap. "full" is the finished card in one piece (the static /
 * reduced-motion frame). The key content sits right of centre because the
 * phone overlaps the left edge.
 */
export function drawCalendarCard(f: UiFont, layer: CalendarLayer = "full"): HTMLCanvasElement {
  const W = 1000;
  const H = 720;
  const { c, g } = makeCanvas(W, H);
  const tx = 250;
  const ty = 250;
  const tw = W - 250 - 60;
  const th = 250;
  g.textBaseline = "alphabetic";

  if (layer === "shell" || layer === "full") {
    glassPanel(g, W, H, 52, "#2563eb");
    g.fillStyle = INK;
    g.font = font(f, 700, 46);
    g.fillText("Tomorrow", 250, 104);
    g.fillStyle = MUTED;
    g.font = font(f, 500, 32);
    const t = "Calendar";
    g.fillText(t, W - 60 - g.measureText(t).width, 102);
    g.fillStyle = LINE;
    g.fillRect(250, 140, W - 250 - 60, 2);

    // quiet hour rows
    g.fillStyle = MUTED;
    g.font = font(f, 500, 34);
    g.fillText("9:30 AM", 40, 216);
    g.fillText("11:30 AM", 40, 566);
    g.fillStyle = LINE;
    g.fillRect(250, 196, W - 250 - 60, 2);
    g.fillRect(250, 546, W - 250 - 60, 2);
  }

  if (layer === "idle") {
    // the slot the agent is about to fill: an open, dashed "Available" outline
    g.strokeStyle = "rgba(96,165,250,0.45)";
    g.lineWidth = 3;
    g.setLineDash([16, 12]);
    rr(g, tx + 1.5, ty + 1.5, tw - 3, th - 3, 33);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = "rgba(148,163,184,0.75)";
    g.font = font(f, 700, 76);
    g.fillText("10:00 AM", tx + 52, ty + 106);
    g.fillStyle = "rgba(148,163,184,0.6)";
    g.font = font(f, 600, 40);
    g.fillText("Available", tx + 52, ty + 172);
  }

  if (layer === "booked" || layer === "full") {
    // the confirmed booking
    const grad = g.createLinearGradient(tx, ty, tx + tw, ty + th);
    grad.addColorStop(0, "#3b74f0");
    grad.addColorStop(1, "#2251d6");
    g.fillStyle = grad;
    rr(g, tx, ty, tw, th, 34);
    g.fill();
    g.fillStyle = "#29dcf2";
    rr(g, tx, ty, 12, th, 6);
    g.fill();
    g.fillStyle = "#fff";
    g.font = font(f, 700, 76);
    g.fillText("10:00 AM", tx + 52, ty + 106);
    g.fillStyle = "rgba(226,238,255,0.95)";
    g.font = font(f, 600, 40);
    g.fillText("Appointment booked", tx + 52, ty + 172);
    const bx = tx + tw - 84;
    g.fillStyle = "rgba(255,255,255,0.22)";
    g.beginPath();
    g.arc(bx, ty + 84, 46, 0, Math.PI * 2);
    g.fill();
    check(g, bx, ty + 84, 46, "#fff", 8);
  }

  if (layer === "footer" || layer === "full") {
    g.fillStyle = "rgba(203,213,225,0.9)";
    g.font = font(f, 500, 38);
    check(g, tx + 26, ty + th + 60, 26, "rgba(34,211,238,0.95)", 5);
    g.fillText("Confirmation sent", tx + 74, ty + th + 74);
  }
  if (layer === "shell" || layer === "full") dither(g, W, H, 1.6);
  return c;
}

/** A neutral white rounded-rectangle outline with a soft halo and a faint inner wash, padded by `pad` px; tinted per use through its material colour and blended additively (the scene's acknowledgement glows). */
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

const GLASS_TOP = "#0b1220";
const GLASS_BOTTOM = "#05080f";

/**
 * The dark translucent "glass" fill shared by every card: a darker base than
 * before, a brighter grazing top-edge highlight, a soft diagonal sheen (the
 * same illusion of reflected light used on the phone's cover glass), and an
 * accent-tinted inner glow - so it reads as glass floating in the room rather
 * than a solid navy panel.
 */
function glassPanel(g: CanvasRenderingContext2D, w: number, h: number, r: number, accent: string): void {
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, GLASS_TOP);
  bg.addColorStop(1, GLASS_BOTTOM);
  g.fillStyle = bg;
  rr(g, 0, 0, w, h, r);
  g.fill();
  // inner glow, low-left where the icon/accent sits
  const glow = g.createRadialGradient(w * 0.2, h * 0.8, 0, w * 0.2, h * 0.8, w * 0.5);
  glow.addColorStop(0, `${accent}26`);
  glow.addColorStop(1, `${accent}00`);
  g.fillStyle = glow;
  rr(g, 0, 0, w, h, r);
  g.fill();
  // soft diagonal sheen, as if light is grazing across the surface
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
  // bright grazing highlight along the top edge (the "glass" cue)
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
}

type IconKind = "messages" | "email" | "website" | "documents";

/** Generic line icons - no third-party marks. Drawn centred at (0,0), radius ~s. */
function drawIcon(g: CanvasRenderingContext2D, kind: IconKind, s: number, color: string): void {
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = s * 0.1;
  g.lineCap = "round";
  g.lineJoin = "round";
  switch (kind) {
    case "messages":
      rr(g, -s, -s * 0.72, s * 2, s * 1.44, s * 0.5);
      g.stroke();
      g.beginPath();
      g.moveTo(-s * 0.35, s * 0.72);
      g.lineTo(-s * 0.55, s * 1.18);
      g.lineTo(0, s * 0.72);
      g.closePath();
      g.fill();
      [-s * 0.42, 0, s * 0.42].forEach((dx) => {
        g.beginPath();
        g.arc(dx, -s * 0.02, s * 0.09, 0, Math.PI * 2);
        g.fill();
      });
      break;
    case "email":
      rr(g, -s, -s * 0.72, s * 2, s * 1.44, s * 0.22);
      g.stroke();
      g.beginPath();
      g.moveTo(-s * 0.94, -s * 0.58);
      g.lineTo(0, s * 0.12);
      g.lineTo(s * 0.94, -s * 0.58);
      g.stroke();
      break;
    case "website":
      g.beginPath();
      g.arc(0, 0, s, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.ellipse(0, 0, s * 0.42, s, 0, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(-s, 0);
      g.lineTo(s, 0);
      g.moveTo(-s * 0.86, -s * 0.46);
      g.lineTo(s * 0.86, -s * 0.46);
      g.moveTo(-s * 0.86, s * 0.46);
      g.lineTo(s * 0.86, s * 0.46);
      g.stroke();
      break;
    case "documents":
      g.beginPath();
      g.moveTo(-s * 0.62, -s);
      g.lineTo(s * 0.24, -s);
      g.lineTo(s * 0.62, -s * 0.62);
      g.lineTo(s * 0.62, s);
      g.lineTo(-s * 0.62, s);
      g.closePath();
      g.stroke();
      g.beginPath();
      g.moveTo(s * 0.24, -s);
      g.lineTo(s * 0.24, -s * 0.62);
      g.lineTo(s * 0.62, -s * 0.62);
      g.stroke();
      [-s * 0.35, 0, s * 0.35].forEach((dy) => {
        g.beginPath();
        g.moveTo(-s * 0.32, dy);
        g.lineTo(s * 0.32, dy);
        g.stroke();
      });
      break;
  }
}

/**
 * 760 x 480: one restrained input card (glass, icon, title, subtitle).
 *
 * Shared internal layout system - the SAME constants for every kind, so an
 * icon can never collide with its title no matter which shape is drawn:
 * a fixed-width [ICON AREA] on the left, a [TEXT AREA] starting clear of the
 * icon's right edge, both centred on one shared row. Only the icon shape and
 * copy change between Messages/Email/Website/Documents; the geometry doesn't.
 */
export function drawInputCard(f: UiFont, kind: IconKind, title: string, subtitle: string, accent: string): HTMLCanvasElement {
  const W = 760;
  const H = 480;
  const { c, g } = makeCanvas(W, H);
  glassPanel(g, W, H, 46, accent);

  const PAD = 64; // left padding to the icon area
  const ICON_R = 44; // icon area radius
  const ICON_TEXT_GAP = 36; // clear space between icon's right edge and text
  const ROW_CY = H / 2; // the icon + both text lines are one group, centred in the card
  const iconCx = PAD + ICON_R;
  const textX = PAD + ICON_R * 2 + ICON_TEXT_GAP;

  g.save();
  g.translate(iconCx, ROW_CY);
  drawIcon(g, kind, ICON_R, accent);
  g.restore();

  g.fillStyle = INK;
  g.font = font(f, 700, 60);
  g.textBaseline = "alphabetic";
  g.fillText(title, textX, ROW_CY - 14);
  g.fillStyle = MUTED;
  g.font = font(f, 500, 42);
  g.fillText(subtitle, textX, ROW_CY + 42);
  dither(g, W, H, 1.4);
  return c;
}

/** 620 x 260: a small secondary result object (e.g. "Confirmation sent"). `active: false` is its dormant look before the booking succeeds (open grey badge, muted text). */
export function drawResultChip(f: UiFont, title: string, subtitle: string, active = true): HTMLCanvasElement {
  const W = 620;
  const H = 260;
  const { c, g } = makeCanvas(W, H);
  glassPanel(g, W, H, 36, active ? "#22d3ee" : "#475569");
  // Same [ICON AREA][TEXT AREA] gap used by the input cards, applied here too.
  const bx = 78;
  const by = H / 2;
  const badgeR = 34;
  const textX = bx + badgeR + 36;
  if (active) {
    const badge = g.createRadialGradient(bx, by, 4, bx, by, badgeR);
    badge.addColorStop(0, "#29dcf2");
    badge.addColorStop(1, "#0aa6c4");
    g.fillStyle = badge;
    g.beginPath();
    g.arc(bx, by, badgeR, 0, Math.PI * 2);
    g.fill();
    check(g, bx, by, 32, "#04222b", 6);
  } else {
    g.strokeStyle = "rgba(148,163,184,0.5)";
    g.lineWidth = 4;
    g.setLineDash([9, 8]);
    g.beginPath();
    g.arc(bx, by, badgeR - 2, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
  }
  g.fillStyle = active ? INK : "rgba(148,163,184,0.8)";
  g.font = font(f, 700, 44);
  g.textBaseline = "alphabetic";
  g.fillText(title, textX, by - 8);
  g.fillStyle = active ? MUTED : "rgba(148,163,184,0.5)";
  g.font = font(f, 500, 34);
  g.fillText(subtitle, textX, by + 40);
  dither(g, W, H, 1.4);
  return c;
}

/** A soft diagonal sheen for the phone's glass (additive, very low alpha). */
export function drawSheen(): HTMLCanvasElement {
  const W = 512;
  const H = 1024;
  const { c, g } = makeCanvas(W, H);
  const grad = g.createLinearGradient(0, 0, W * 0.9, H * 0.55);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.3, "rgba(255,255,255,0)");
  grad.addColorStop(0.44, "rgba(200,220,255,0.085)");
  grad.addColorStop(0.56, "rgba(255,255,255,0.03)");
  grad.addColorStop(0.7, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  return c;
}

export { canvasTexture };
