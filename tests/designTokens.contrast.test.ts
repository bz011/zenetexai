import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * WCAG AA guard for the semantic design tokens (src/styles/tokens.css).
 * Parses the real CSS so a token edit that breaks contrast fails CI, instead
 * of being discovered by an audit later.
 */
const css = fs.readFileSync(path.resolve(__dirname, "../src/styles/tokens.css"), "utf-8");

function block(selectorStart: string): Record<string, [number, number, number]> {
  const start = css.indexOf(selectorStart);
  if (start === -1) throw new Error(`selector not found: ${selectorStart}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const body = css.slice(open + 1, close);
  const vars: Record<string, [number, number, number]> = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
    vars[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  return vars;
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes = {
  dark: block(":root,"),
  light: block(".academy-shell,"),
};

const TEXT_TOKENS = ["ink", "ink-2", "ink-3", "accent-fg", "accent-2-fg", "positive", "caution", "danger"];
const SURFACES = ["surface-0", "surface-1", "surface-2"];

describe.each(Object.entries(themes))("%s theme tokens meet WCAG AA", (_name, t) => {
  it("defines every token the components rely on", () => {
    for (const k of [...TEXT_TOKENS, ...SURFACES, "accent", "accent-hover", "on-accent", "line", "focus"]) {
      expect(t[k], `missing --${k}`).toBeDefined();
    }
  });

  for (const text of TEXT_TOKENS) {
    for (const surface of SURFACES) {
      it(`${text} on ${surface} >= 4.5:1`, () => {
        expect(contrast(t[text], t[surface])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("button label (on-accent) is >= 4.5:1 on accent and accent-hover", () => {
    expect(contrast(t["on-accent"], t["accent"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t["on-accent"], t["accent-hover"])).toBeGreaterThanOrEqual(4.5);
  });

  it("focus ring is >= 3:1 against page and card surfaces (WCAG 1.4.11)", () => {
    expect(contrast(t["focus"], t["surface-0"])).toBeGreaterThanOrEqual(3);
    expect(contrast(t["focus"], t["surface-1"])).toBeGreaterThanOrEqual(3);
  });
});
