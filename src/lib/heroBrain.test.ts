import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));

import { LanguageProvider } from "./LanguageContext";
import { buildBrainNetwork } from "./brainShape";
import { HERO_CARD_POSITIONS, heroCopy } from "./heroCopy";
import { localizeHref } from "./i18nRoutes";
import HeroSection from "@/components/HeroSection";

const ROOT = path.resolve(__dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

function render(pathname: string) {
  mockPathname = pathname;
  return renderToString(createElement(LanguageProvider, null, createElement(HeroSection)));
}

describe("brain network shape", () => {
  const net = buildBrainNetwork(900, 7, 3);

  it("is deterministic, so the server poster and the client scene are identical", () => {
    const again = buildBrainNetwork(900, 7, 3);
    expect(again.positions).toEqual(net.positions);
    expect(again.edges).toEqual(net.edges);
  });

  it("has the expected size and only valid, unique, non-degenerate links", () => {
    expect(net.positions.length / 3).toBe(900);
    expect(net.edges.length / 2).toBeGreaterThan(1000);
    const seen = new Set<string>();
    for (let e = 0; e < net.edges.length; e += 2) {
      const a = net.edges[e], b = net.edges[e + 1];
      expect(a).not.toBe(b);
      expect(a).toBeLessThan(900);
      expect(b).toBeLessThan(900);
      const k = `${a}-${b}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  });

  it("fits the unit sphere and is roughly balanced left and right (two hemispheres)", () => {
    let left = 0, right = 0;
    for (let i = 0; i < net.positions.length; i += 3) {
      expect(Math.hypot(net.positions[i], net.positions[i + 1], net.positions[i + 2])).toBeLessThanOrEqual(1.0001);
      if (net.positions[i] < 0) left++;
      else right++;
    }
    expect(Math.abs(left - right) / 900).toBeLessThan(0.12);
  });
});

describe("hero service cards", () => {
  it("has the same five cards, in the same order and with the same routes, in English and Arabic", () => {
    expect(heroCopy.ar.cards.map((c) => [c.id, c.href])).toEqual(heroCopy.en.cards.map((c) => [c.id, c.href]));
    expect(heroCopy.en.cards.map((c) => c.id)).toEqual(["pmp", "simulator", "agents", "data", "ml"]);
    expect(Object.keys(HERO_CARD_POSITIONS).sort()).toEqual(heroCopy.en.cards.map((c) => c.id).sort());
    for (const c of heroCopy.ar.cards) expect(c.title + c.desc).toMatch(/[؀-ۿ]/);
  });

  it("every card points at a route that actually exists", () => {
    const seed = read("migrations/019_academy_commerce.sql");
    for (const { href } of heroCopy.en.cards) {
      if (href.startsWith("/services/")) expect(exists(`src/app/(en)/(corporate)${href}/page.tsx`), href).toBe(true);
      else {
        expect(exists("src/app/(en)/(academy)/courses/[courseSlug]/page.tsx")).toBe(true);
        expect(seed, href).toContain(`'${href.replace("/courses/", "")}'`);
      }
    }
  });

  it("makes no statistic, result, guarantee or customer claim (none of the reference image's numbers)", () => {
    for (const lang of ["en", "ar"] as const) {
      const text = JSON.stringify(heroCopy[lang]);
      expect(text).not.toMatch(/\d/);
      for (const re of [/guarantee/i, /\bpass\b/i, /trusted/i, /clients?\b/i, /projects delivered/i, /certified/i, /award/i]) expect(text, `${lang} ${re}`).not.toMatch(re);
    }
  });

  it("links Arabic readers to Arabic pages where they exist and leaves the rest unchanged", () => {
    expect(localizeHref("/services/data-analytics-uae", "ar")).toBe("/ar/services/data-analytics-uae");
    expect(localizeHref("/courses/pmp-exam-simulator", "ar")).toBe("/ar/courses/pmp-exam-simulator");
    expect(localizeHref("/courses/pmp-mastery-program", "ar")).toBe("/courses/pmp-mastery-program");
  });
});

describe("hero server-rendered HTML", () => {
  it("English: headline, both existing CTAs and all five real links are in the initial HTML, with no canvas or raster image", () => {
    const html = render("/");
    expect(html).toContain("Practical AI.");
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="/services"');
    for (const c of heroCopy.en.cards) {
      expect(html, c.href).toContain(`href="${c.href}"`);
      expect(html, c.title).toContain(c.title.replace(/&/g, "&amp;"));
      expect(html, c.desc).toContain(c.desc);
    }
    expect(html).toContain(`aria-label="${heroCopy.en.cardsLabel}"`);
    expect(html).not.toContain("<canvas");
    expect(html).not.toMatch(/<img|<picture|url\((?!#)/);
    expect(html.match(/id="zx-brain-net"/g)).toHaveLength(1);
    expect(html).not.toMatch(/[؀-ۿ]/);
  });

  it("Arabic: same structure with Arabic labels and Arabic URLs, and no English card text", () => {
    const html = render("/ar");
    for (const c of heroCopy.ar.cards) {
      expect(html, c.title).toContain(c.title);
      expect(html, c.href).toContain(`href="${localizeHref(c.href, "ar")}"`);
    }
    expect(html).toContain('href="/ar/services"');
    for (const c of heroCopy.en.cards) expect(html).not.toContain(c.desc);
    expect(html.match(/id="zx-brain-net"/g)).toHaveLength(1);
    expect(html).not.toContain("<canvas");
  });

  it("keeps the existing homepage metadata untouched", () => {
    const page = read("src/app/(en)/(corporate)/page.tsx");
    expect(page).toContain("ZentexAI — AI Solutions, AI Agents & Automation in the UAE");
    expect(page).toContain('alternatesFor("/", "en")');
  });
});

describe("3D scene safeguards", () => {
  const stage = read("src/components/hero/HeroStage.tsx");
  const scene = read("src/components/hero/brainScene.ts");

  it("loads three.js only on demand, and only from the scene module", () => {
    expect(stage).toContain('import("@/components/hero/brainScene")');
    expect(stage).not.toMatch(/from "three"/);
    for (const f of ["src/components/HeroSection.tsx", "src/components/hero/HeroStage.tsx", "src/components/hero/BrainNetworkSvg.tsx", "src/lib/brainShape.ts"]) {
      expect(read(f), f).not.toMatch(/from "three"/);
    }
    expect(scene).toContain('from "three"');
  });

  it("only starts on desktop-sized screens with WebGL and no reduced-motion preference, and has a static fallback", () => {
    expect(stage).toContain("(min-width: 1024px)");
    expect(stage).toContain("(prefers-reduced-motion: reduce)");
    expect(stage).toContain("webglAvailable()");
    expect(stage).toContain(".catch(");
    expect(stage).toContain("BrainNetworkUse");
  });

  it("pauses off-screen and in hidden tabs, caps the frame rate and pixel ratio, and releases GPU resources", () => {
    for (const s of ["IntersectionObserver", "visibilitychange", "MAX_FPS", "Math.min(window.devicePixelRatio || 1, 1.5)", "renderer.dispose()", "forceContextLoss()", "webglcontextlost", "cancelAnimationFrame"]) {
      expect(scene, s).toContain(s);
    }
  });

  it("adds only the three package (no React Three Fiber or other scene libraries)", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.dependencies.three).toBeDefined();
    for (const bad of ["@react-three/fiber", "@react-three/drei", "gsap", "framer-motion", "postprocessing"]) {
      expect(pkg.dependencies[bad], bad).toBeUndefined();
    }
  });

  it("card labels are real DOM text, never drawn into the 3D scene", () => {
    expect(scene).not.toMatch(/fillText|TextGeometry|title|desc/);
    expect(stage).toContain("<LocaleLink");
  });
});
