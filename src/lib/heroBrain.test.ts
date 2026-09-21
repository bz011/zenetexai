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
import { HERO_NAV_IDS, heroCopy } from "./heroCopy";
import { localizeHref } from "./i18nRoutes";
import HeroSection from "@/components/HeroSection";

const ROOT = path.resolve(__dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

function render(pathname: string) {
  mockPathname = pathname;
  return renderToString(createElement(LanguageProvider, null, createElement(HeroSection)));
}

describe("hero service cards", () => {
  it("has the same five cards, in the same order and with the same routes, in English and Arabic", () => {
    expect(heroCopy.ar.cards.map((c) => [c.id, c.href])).toEqual(heroCopy.en.cards.map((c) => [c.id, c.href]));
    expect(heroCopy.en.cards.map((c) => c.id)).toEqual(["pmp", "simulator", "agents", "data", "ml"]);
    expect(HERO_NAV_IDS).toEqual(["pmp", "simulator", "data"]);
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
  it("English: headline, both existing CTAs and all five real links are in the initial HTML, with a decorative poster image and no video, canvas or 3D", () => {
    const html = render("/");
    expect(html).toContain("Practical AI.");
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="/services"');
    for (const c of heroCopy.en.cards.filter((x) => HERO_NAV_IDS.includes(x.id))) {
      expect(html, c.href).toContain(`href="${c.href}"`);
      expect(html, c.title).toContain(c.title.replace(/&/g, "&amp;"));
      expect(html, c.desc).toContain(c.desc);
    }
    // The two destinations the Core Services section below already links to are not repeated in the hero.
    for (const c of heroCopy.en.cards.filter((x) => !HERO_NAV_IDS.includes(x.id))) expect(html, c.href).not.toContain(`href="${c.href}"`);
    expect(html).toContain(`aria-label="${heroCopy.en.cardsLabel}"`);
    expect(html).not.toContain("<canvas");
    expect(html).not.toContain("<video");
    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html).toContain('<source media="(min-width: 1024px)" srcSet="/hero/brain-poster.webp"');
    expect(html).toMatch(/<img src="\/hero\/brain-poster-sm\.webp" alt=""/);
    expect(html).not.toMatch(/[؀-ۿ]/);
  });

  it("Arabic: same structure with Arabic labels and Arabic URLs, and no English card text", () => {
    const html = render("/ar");
    for (const c of heroCopy.ar.cards.filter((x) => HERO_NAV_IDS.includes(x.id))) {
      expect(html, c.title).toContain(c.title);
      expect(html, c.href).toContain(`href="${localizeHref(c.href, "ar")}"`);
    }
    expect(html).toContain('href="/ar/services"');
    for (const c of heroCopy.en.cards) expect(html).not.toContain(c.desc);
    expect(html).not.toContain("<canvas");
    expect(html).not.toContain("<video");
  });

  it("keeps the existing homepage metadata untouched", () => {
    const page = read("src/app/(en)/(corporate)/page.tsx");
    expect(page).toContain("ZentexAI — AI Solutions, AI Agents & Automation in the UAE");
    expect(page).toContain('alternatesFor("/", "en")');
  });
});

describe("hero service navigation", () => {
  const trans = read("src/lib/translations.ts");
  const nav = read("src/components/hero/HeroServiceNav.tsx");

  it("lists only destinations the rest of the homepage does not link to, so nothing is duplicated", () => {
    const below = heroCopy.en.cards.filter((c) => !HERO_NAV_IDS.includes(c.id));
    expect(below.map((c) => c.id)).toEqual(["agents", "ml"]);
    for (const c of below) expect(trans, c.href).toContain(`learnMoreHref: "${c.href}"`); // linked from the Core Services cards
    for (const c of heroCopy.en.cards.filter((x) => HERO_NAV_IDS.includes(x.id))) expect(trans, c.href).not.toContain(`learnMoreHref: "${c.href}"`);
  });

  it("is a real <nav> of real links (LocaleLink), no floating cards, no absolute positioning", () => {
    expect(nav).toContain("<nav aria-label=");
    expect(nav).toContain("<LocaleLink");
    expect(nav).not.toMatch(/absolute|HERO_CARD_POSITIONS/);
  });
});

describe("approved cinematic video", () => {
  const stage = read("src/components/hero/HeroMedia.tsx");
  const kb = (f: string) => fs.statSync(path.join(ROOT, f)).size / 1024;

  it("ships the approved loop as WebM and MP4 plus two stills, all modest in size", () => {
    expect(kb("public/hero/brain-loop.webm")).toBeLessThan(1024);
    expect(kb("public/hero/brain-loop.mp4")).toBeLessThan(1400);
    expect(kb("public/hero/brain-poster.webp")).toBeLessThan(160);
    expect(kb("public/hero/brain-poster-sm.webp")).toBeLessThan(70);
  });

  it("plays muted, looping and inline, with WebM first and MP4 as fallback, and is hidden from assistive tech", () => {
    for (const s of ["autoPlay", "muted", "loop", "playsInline", 'aria-hidden="true"', "tabIndex={-1}"]) expect(stage, s).toContain(s);
    expect(stage.indexOf("brain-loop.webm")).toBeLessThan(stage.indexOf("brain-loop.mp4"));
    expect(stage).not.toContain("controls");
  });

  it("only renders (and so only downloads) the video on desktop-sized screens without reduced motion or data saver", () => {
    expect(stage).toContain("(min-width: 1024px)");
    expect(stage).toContain("(prefers-reduced-motion: reduce)");
    expect(stage).toContain("saveData");
    expect(stage).toContain("{videoOn && (");
  });

  it("uses a small poster on phones and the large one from lg up, through one <picture>", () => {
    expect(stage).toContain('media="(min-width: 1024px)" srcSet="/hero/brain-poster.webp"');
    expect(stage).toContain('src="/hero/brain-poster-sm.webp"');
    expect(stage).toContain("width={620}");
    expect(stage).toContain("aspect-[1240/1040]");
    expect(stage).toContain("maskComposite"); // edge-less blend, not a box
    expect(stage).toContain("mixBlendMode: \"lighten\"");
  });

  it("pauses off-screen and in hidden tabs, and gives visitors a labelled pause control", () => {
    for (const s of ["IntersectionObserver", "visibilitychange", "aria-pressed", "pauseLabel", "playLabel"]) expect(stage, s).toContain(s);
    expect(heroCopy.ar.pauseLabel).toMatch(/[؀-ۿ]/);
  });

  it("makes sure the muted attribute exists (React only sets the property) and handles a refused autoplay by keeping the still", () => {
    expect(stage).toContain("el.defaultMuted = true");
    expect(stage).toContain("el.muted = true");
    expect(stage).toContain('"NotAllowedError"');
    expect(stage).toContain("setBlocked(true)");
    expect(stage).toContain("\"blocked\"");
    expect(stage).toContain('type=\'video/webm; codecs="vp9"\'');
  });

  it("keeps the last frame when paused, and only fades the video in once it is really playing", () => {
    expect(stage).toContain('started ? "opacity-100" : "opacity-0"');
    expect(stage).toContain('addEventListener("playing", onStarted)');
  });

  it("the pause control is discreet (hidden until the stage is hovered or the control is focused) but stays in the tab order", () => {
    const btn = stage.slice(stage.indexOf("<button"), stage.indexOf("</button>"));
    expect(btn).toContain("opacity-0");
    expect(btn).toContain("focus-visible:opacity-100");
    expect(btn).toContain("group-hover:opacity-70");
    expect(btn).not.toMatch(/sr-only|hidden lg:flex[^"]*invisible|tabIndex|display:\s*none/);
    expect(btn).toContain("aria-label");
    expect(stage).toContain("{videoOn && started && (");
  });

  it("contains no canvas or three.js", () => {
    expect(stage).not.toMatch(/three|<canvas|WebGL/i);
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.dependencies.three).toBeUndefined();
    expect(exists("src/components/hero/brainScene.ts")).toBe(false);
  });
});
