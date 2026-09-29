import { canvasTexture, dither, makeCanvas } from "../kit";
import { drawInBox, fitFontSize } from "../cardUi";
import type { UiFont } from "../uiFont";
import type { Translations } from "@/lib/translations";

type AgentsCopy = Translations["showcase"]["agents"];

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
/** header status labels, in story order (three resting "Online" points included); PhoneProgress.status indexes (and crossfades between) these */
function statusList(c: AgentsCopy): string[] {
  return [c.status.online, c.status.readingRequest, c.status.searchingKnowledge, c.status.online, c.status.verifyingAvailability, c.status.bookingAppointment, c.status.online];
}

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
export function createPhoneScreen(f: UiFont, copy: AgentsCopy): PhoneScreen {
  const W = 944;
  const H = 2115;
  const base = makeCanvas(W, H);
  const g = base.g;
  const pad = 60;
  const rtl = f.rtl;
  const STATUS = statusList(copy);
  // header row mirrors icon+text under RTL (orb moves to the far side the text now reads FROM); English is unchanged.
  const headerOrbX = rtl ? W - pad - 58 : pad + 58;
  const headerTextX = rtl ? pad : pad + 146;
  const headerTextW = W - pad * 2 - 146;
  const headerDotX = rtl ? headerOrbX - 84 : pad + 150;

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
  drawOrb(g, headerOrbX, 214, 56, true, true);
  g.fillStyle = INK;
  g.textBaseline = "alphabetic";
  fitFontSize(g, f, 700, 42, copy.assistantName, headerTextW, 26);
  drawInBox(g, copy.assistantName, headerTextX, headerTextW, 202, rtl);
  g.fillStyle = "#4ade80";
  g.beginPath();
  g.arc(headerDotX, 232, 6, 0, Math.PI * 2);
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
  drawInBox(g, copy.composerPlaceholder, pad + 96, W - pad - 138 - 40 - (pad + 96), cy + barH / 2 + 12, rtl);

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
  const replyLines = wrap(g, copy.assistantReply, replyW - 68);
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
      fadeOnly(xOut(sf), () => drawInBox(lg, STATUS[si], headerTextX, headerTextW, 244, rtl));
      if (sf > 0.003 && si + 1 < STATUS.length) fadeOnly(xIn(sf), () => drawInBox(lg, STATUS[si + 1], headerTextX, headerTextW, 244, rtl));

      lg.save();
      lg.translate(0, 350);
      lg.scale(K, K);
      const F = p.fade;

      appear(p.request, F, () => userBubble(copy.customerRequest, requestY));

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
        replyLines.forEach((l, i) => drawInBox(lg, l, replyX + 36, replyW - 72, replyY + 74 + i * 54, rtl));
      });

      // time chips, staggered; the 10:00 chip then fills in
      copy.timeChips.forEach((t, i) => {
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

      appear(p.choice, F, () => userBubble(copy.bookedTime, choiceY));

      // action row: verifying -> booking -> booked, one line whose wording crossfades in place
      const v = clamp01(p.verify);
      const doneIn = xIn(clamp01(p.done));
      const doneOut = xOut(clamp01(p.done));
      // this row mirrors icon+text under RTL, same as the header; the progress bar below keeps its physical
      // position and fill direction in both languages (an RTL-mirrored bar isn't needed for the text to fit).
      const verifyIconX = rtl ? LW - lpad - 22 : lpad + 22;
      const verifyTextX = rtl ? lpad + 8 : barX;
      const verifyTextW = barW;
      const orbA = v * doneOut * F;
      fadeOnly(orbA, () => drawOrb(lg, verifyIconX, verifyY + 24, 20, false));
      lg.font = font(f, 500, 34);
      lg.fillStyle = "rgba(148,163,184,0.85)";
      fadeOnly(v * xOut(clamp01(p.booking)) * F, () => drawInBox(lg, copy.status.verifyingAvailability, verifyTextX, verifyTextW, verifyY + 34, rtl));
      fadeOnly(v * xIn(clamp01(p.booking)) * doneOut * F, () => drawInBox(lg, copy.bookingYourAppointment, verifyTextX, verifyTextW, verifyY + 34, rtl));
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
      fadeOnly(v * xOut(clamp01(p.booking)) * F, () => drawInBox(lg, copy.verifyingWithCalendar, verifyTextX, verifyTextW, subY, rtl));
      fadeOnly(v * xIn(clamp01(p.booking)) * doneOut * F, () => drawInBox(lg, copy.addingToCalendar, verifyTextX, verifyTextW, subY, rtl));
      // success: a check badge and the outcome, in the same place
      appear(doneIn, F, () => {
        lg.fillStyle = "#22d3ee";
        lg.beginPath();
        lg.arc(verifyIconX, verifyY + 24, 22, 0, Math.PI * 2);
        lg.fill();
        check(lg, verifyIconX, verifyY + 24, 24, "#04222b", 5);
        lg.fillStyle = INK;
        fitFontSize(lg, f, 600, 36, copy.youreBooked, verifyTextW, 26);
        drawInBox(lg, copy.youreBooked, verifyTextX, verifyTextW, verifyY + 32, rtl);
        lg.fillStyle = "rgba(148,163,184,0.75)";
        lg.font = font(f, 500, 30);
        drawInBox(lg, copy.confirmationOnItsWay, verifyTextX, verifyTextW, verifyY + 84, rtl);
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
export function drawCalendarCard(f: UiFont, copy: AgentsCopy, layer: CalendarLayer = "full"): HTMLCanvasElement {
  const W = 1000;
  const H = 720;
  const { c, g } = makeCanvas(W, H);
  const tx = 250;
  const ty = 250;
  const tw = W - 250 - 60;
  const th = 250;
  const rtl = f.rtl;
  g.textBaseline = "alphabetic";

  if (layer === "shell" || layer === "full") {
    glassPanel(g, W, H, 52, "#2563eb");
    // the heading pair mirrors under RTL: the prominent "Tomorrow" moves to the side reading starts from
    g.fillStyle = INK;
    g.font = font(f, 700, 46);
    if (rtl) g.fillText(copy.calendar.tomorrow, W - 60 - g.measureText(copy.calendar.tomorrow).width, 104);
    else g.fillText(copy.calendar.tomorrow, 250, 104);
    g.fillStyle = MUTED;
    g.font = font(f, 500, 32);
    if (rtl) g.fillText(copy.calendar.calendarLabel, 250, 102);
    else g.fillText(copy.calendar.calendarLabel, W - 60 - g.measureText(copy.calendar.calendarLabel).width, 102);
    g.fillStyle = LINE;
    g.fillRect(250, 140, W - 250 - 60, 2);

    // quiet hour rows: sit outside the main card face (to its left); mirrored to its right under RTL
    g.fillStyle = MUTED;
    g.font = font(f, 500, 34);
    const hourW = tx - 40 - 20;
    drawInBox(g, copy.timeChips[0], rtl ? W - tx + 20 : 40, hourW, 216, rtl);
    drawInBox(g, copy.timeChips[2], rtl ? W - tx + 20 : 40, hourW, 566, rtl);
    g.fillStyle = LINE;
    g.fillRect(250, 196, W - 250 - 60, 2);
    g.fillRect(250, 546, W - 250 - 60, 2);
  }

  // the text column shared by the idle/booked slot content: same padding on
  // both sides regardless of language, so nothing changes for English and
  // Arabic right-aligns naturally within the exact same visual box.
  const slotX = rtl ? tx + 24 : tx + 52;
  const slotW = tw - 76;

  if (layer === "idle") {
    // the slot the agent is about to fill: an open, dashed "Available" outline
    g.strokeStyle = "rgba(96,165,250,0.45)";
    g.lineWidth = 3;
    g.setLineDash([16, 12]);
    rr(g, tx + 1.5, ty + 1.5, tw - 3, th - 3, 33);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = "rgba(148,163,184,0.75)";
    fitFontSize(g, f, 700, 76, copy.bookedTime, slotW, 44);
    drawInBox(g, copy.bookedTime, slotX, slotW, ty + 106, rtl);
    g.fillStyle = "rgba(148,163,184,0.6)";
    fitFontSize(g, f, 600, 40, copy.calendar.available, slotW, 26);
    drawInBox(g, copy.calendar.available, slotX, slotW, ty + 172, rtl);
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
    fitFontSize(g, f, 700, 76, copy.bookedTime, slotW, 44);
    drawInBox(g, copy.bookedTime, slotX, slotW, ty + 106, rtl);
    g.fillStyle = "rgba(226,238,255,0.95)";
    fitFontSize(g, f, 600, 40, copy.calendar.appointmentBooked, slotW, 26);
    drawInBox(g, copy.calendar.appointmentBooked, slotX, slotW, ty + 172, rtl);
    const bx = rtl ? tx + 84 : tx + tw - 84;
    g.fillStyle = "rgba(255,255,255,0.22)";
    g.beginPath();
    g.arc(bx, ty + 84, 46, 0, Math.PI * 2);
    g.fill();
    check(g, bx, ty + 84, 46, "#fff", 8);
  }

  if (layer === "footer" || layer === "full") {
    const checkX = rtl ? tx + tw - 26 : tx + 26;
    const footTextX = rtl ? tx : tx + 74;
    const footTextW = tw - 74;
    g.fillStyle = "rgba(203,213,225,0.9)";
    g.font = font(f, 500, 38);
    check(g, checkX, ty + th + 60, 26, "rgba(34,211,238,0.95)", 5);
    fitFontSize(g, f, 500, 38, copy.calendar.confirmationSent, footTextW, 24);
    drawInBox(g, copy.calendar.confirmationSent, footTextX, footTextW, ty + th + 74, rtl);
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

  const PAD = 64; // padding to the icon area
  const ICON_R = 44; // icon area radius
  const ICON_TEXT_GAP = 36; // clear space between the icon's edge and the text
  const ROW_CY = H / 2; // the icon + both text lines are one group, centred in the card
  const rtl = f.rtl;
  // RTL: the icon moves to the right and the text column fills the space to its left - the row's own
  // internal composition mirrors for natural reading; the card's place in the scene does not.
  const iconCx = rtl ? W - PAD - ICON_R : PAD + ICON_R;
  const textX = rtl ? PAD : PAD + ICON_R * 2 + ICON_TEXT_GAP;
  const textW = W - PAD * 2 - ICON_R * 2 - ICON_TEXT_GAP;

  g.save();
  g.translate(iconCx, ROW_CY);
  drawIcon(g, kind, ICON_R, accent);
  g.restore();

  g.fillStyle = INK;
  g.textBaseline = "alphabetic";
  fitFontSize(g, f, 700, 60, title, textW, 34);
  drawInBox(g, title, textX, textW, ROW_CY - 14, rtl);
  g.fillStyle = MUTED;
  fitFontSize(g, f, 500, 42, subtitle, textW, 24);
  drawInBox(g, subtitle, textX, textW, ROW_CY + 42, rtl);
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
  const rtl = f.rtl;
  const badgeR = 34;
  const bx = rtl ? W - 78 : 78;
  const by = H / 2;
  const textX = rtl ? 40 : bx + badgeR + 36;
  const textW = W - 40 - (badgeR * 2 + 36) - 40;
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
  g.textBaseline = "alphabetic";
  fitFontSize(g, f, 700, 44, title, textW, 26);
  drawInBox(g, title, textX, textW, by - 8, rtl);
  g.fillStyle = active ? MUTED : "rgba(148,163,184,0.5)";
  fitFontSize(g, f, 500, 34, subtitle, textW, 20);
  drawInBox(g, subtitle, textX, textW, by + 40, rtl);
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
