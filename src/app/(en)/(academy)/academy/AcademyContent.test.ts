import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/academy";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));

const { LanguageProvider } = await import("@/lib/LanguageContext");
const { default: AcademyContent } = await import("./AcademyContent");
const { LESSON_PLAYER, academyShowcaseCopy } = await import("@/lib/academyCopy");
const { default: translations } = await import("@/lib/translations");

const decode = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
function render(path: string) {
  mockPathname = path;
  return decode(renderToString(createElement(LanguageProvider, null, createElement(AcademyContent))));
}

describe("Academy landing v2", () => {
  const en = render("/academy");
  const ar = render("/ar/academy");

  it("renders the hero copy and CTAs as plain HTML with no entrance animation", () => {
    expect(en).toContain(translations.en.academy.hero_h1);
    expect(en).toContain(translations.en.academy.hero_sub);
    expect(en).not.toMatch(/animate-fade|opacity-0/);
    expect(en.match(/<h1\b/g)).toHaveLength(1);
    expect(ar.match(/<h1\b/g)).toHaveLength(1);
  });

  it("shows the REAL lesson-player screenshot (never a mock-up) with descriptive alt text", () => {
    expect(en).toContain(`src="${LESSON_PLAYER.src}"`);
    expect(en).toContain(academyShowcaseCopy.en.altPlayer);
    expect(en).toContain(academyShowcaseCopy.en.altOutline);
    expect(en).toContain(academyShowcaseCopy.en.caption);
    expect(en).not.toMatch(/laptop|mockup|browser-frame/i);
    // Every point in the caption list describes something visible in the screenshot.
    for (const p of academyShowcaseCopy.en.points) expect(en).toContain(p.term);
  });

  it("gives the Arabic page the same real image with Arabic alt text and an honest note that the UI shown is English", () => {
    expect(ar).toContain(`src="${LESSON_PLAYER.src}"`);
    expect(ar).toContain(academyShowcaseCopy.ar.altOutline);
    expect(academyShowcaseCopy.ar.caption).toContain("الإنجليزية");
  });

  it("links programs to their real pages and gives 'coming soon' a way forward instead of a dead end", () => {
    expect(en).toContain('href="/courses/pmp-mastery-program"');
    expect(en).toContain('href="/courses/pmp-exam-simulator"');
    expect(ar).toContain('href="/ar/courses/pmp-exam-simulator"');
    // future programs row links to the contact form (Arabic readers -> the Arabic form)
    expect(en).toContain('href="/contact"');
    expect(ar).toContain('href="/ar#contact"');
  });
});

describe("lesson-player asset", () => {
  const file = path.resolve(__dirname, "../../../../../public/academy/lesson-player.webp");
  const buf = fs.readFileSync(file);

  /** Reads width/height from a lossy WebP (VP8) header. */
  function webpSize(b: Buffer) {
    expect(b.toString("ascii", 0, 4)).toBe("RIFF");
    expect(b.toString("ascii", 8, 12)).toBe("WEBP");
    expect(b.toString("ascii", 12, 16)).toBe("VP8 ");
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }

  it("matches the dimensions the crops are computed from", () => {
    expect(webpSize(buf)).toEqual({ width: LESSON_PLAYER.width, height: LESSON_PLAYER.height });
  });

  it("has crops that lie inside the image", () => {
    for (const c of [LESSON_PLAYER.player, LESSON_PLAYER.outline]) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(LESSON_PLAYER.width);
      expect(c.y + c.h).toBeLessThanOrEqual(LESSON_PLAYER.height);
    }
  });

  it("carries no embedded metadata (EXIF / XMP / ICC) that could hold private data", () => {
    for (const tag of ["EXIF", "XMP ", "ICCP"]) expect(buf.includes(Buffer.from(tag, "ascii")), tag).toBe(false);
  });
});
