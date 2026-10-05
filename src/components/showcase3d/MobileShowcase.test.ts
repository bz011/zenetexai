import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));

import { LanguageProvider } from "@/lib/LanguageContext";
import MobileShowcase from "./MobileShowcase";
import { SHOWCASE_CTA_HREF } from "./showcaseParam";

function render(pathname: string) {
  mockPathname = pathname;
  return renderToString(createElement(LanguageProvider, null, createElement(MobileShowcase)));
}

describe("MobileShowcase (static mobile replacement for the 3D stage)", () => {
  it("renders all four categories as real links to their correct, existing CTA destinations", () => {
    const html = render("/");
    for (const href of Object.values(SHOWCASE_CTA_HREF)) {
      expect(html, href).toContain(`href="${href}"`);
    }
    expect(html.match(/<a /g)).toHaveLength(4);
  });

  it("renders English titles and descriptions sourced from t.showcase on the English route", () => {
    const html = render("/");
    expect(html).toContain("AI Agents");
    expect(html).toContain("Agents that connect your approved knowledge, workflows and systems, with human oversight.");
    expect(html).toContain("PMP Mastery Program, practice questions, and a timed exam simulator.");
  });

  it("renders Arabic titles/descriptions and localized hrefs on the Arabic route", () => {
    const html = render("/ar");
    expect(html).toContain("وكلاء الذكاء الاصطناعي");
    expect(html).toContain("وكلاء يربطون معرفتك المعتمدة وسير عملك وأنظمتك، مع إشراف بشري.");
    // Data/ML/Academy have Arabic URLs (see i18nRoutes.ts); the links localize automatically via LocaleLink.
    expect(html).toContain('href="/ar/services/data-analytics-uae"');
    expect(html).toContain('href="/ar/services/machine-learning-uae"');
    expect(html).toContain('href="/ar/academy"');
  });

  it("has no import statement pulling in the 3D showcase module (mobile must never load Three.js/the GLB model)", () => {
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const src = fs.readFileSync(path.resolve(__dirname, "./MobileShowcase.tsx"), "utf8");
    const importLines = src.split("\n").filter((l) => /^\s*import /.test(l));
    for (const line of importLines) {
      expect(line, "import line").not.toMatch(/mountShowcase|ShowcaseHero|["']three["']/i);
    }
  });
});
