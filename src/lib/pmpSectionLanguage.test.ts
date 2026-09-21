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

import { LanguageProvider } from "./LanguageContext";
import PmpDiscoverabilitySection from "@/components/seo/PmpDiscoverabilitySection";

const ROOT = path.resolve(__dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const ARABIC = /[؀-ۿ]/;

function render(pathname: string, props: { variant: "course" | "simulator"; arabicOnly?: boolean; englishOnly?: boolean }) {
  mockPathname = pathname;
  return renderToString(createElement(LanguageProvider, null, createElement(PmpDiscoverabilitySection, props)));
}

describe("PMP discoverability section renders one language per page", () => {
  for (const variant of ["course", "simulator"] as const) {
    it(`${variant}: englishOnly has no Arabic anywhere (text, links, disclaimer, structured data) and keeps the English content`, () => {
      const html = render("/academy", { variant, englishOnly: true });
      expect(html).not.toMatch(ARABIC);
      expect(html).not.toContain('lang="ar"');
      expect(html).not.toContain('dir="rtl"');
      expect(html).not.toContain("lg:grid-cols-2");
      expect(html).toContain('lang="en"');
      expect(html).toContain("PMP is a registered mark of Project Management Institute, Inc.");
      expect(html).not.toContain("provider. ·");
      expect(html.match(/"@type":"FAQPage"/g)).toHaveLength(1);
      expect(html).toContain('"inLanguage":"en"');
      expect(html).not.toContain('"inLanguage":"ar"');
      expect(html.match(/<h2/g)).toHaveLength(1);
    });

    it(`${variant}: arabicOnly is Arabic-only as before (no English column, English links or English structured data)`, () => {
      const html = render("/ar/academy", { variant, arabicOnly: true });
      expect(html).toContain('lang="ar"');
      expect(html).toContain('dir="rtl"');
      expect(html).not.toContain('lang="en"');
      expect(html).not.toContain("lg:grid-cols-2");
      expect(html).not.toContain("registered mark of Project Management Institute");
      expect(html.match(/"@type":"FAQPage"/g)).toHaveLength(1);
      expect(html).toContain('"inLanguage":"ar"');
      expect(html.match(/<h2/g)).toHaveLength(1);
    });
  }

  it("keeps the same English content and links on the English page as the English column had", () => {
    const html = render("/academy", { variant: "course", englishOnly: true });
    for (const s of [
      "PMP Course in Arabic and English for Professionals in the UAE and MENA",
      "Is there a PMP course in Arabic?",
      'href="/courses/pmp-mastery-program"',
      'href="/courses/pmp-exam-simulator"',
      'href="/contact"',
      "PMP Mastery Program details",
    ]) expect(html, s).toContain(s);
    const sim = render("/courses", { variant: "simulator", englishOnly: true });
    for (const s of ["PMP Exam Simulator: Practice Mode and Full-Length Mock Exams in Arabic and English", "What is a PMP exam simulator?", 'href="/courses/pmp-exam-simulator"']) expect(sim, s).toContain(s);
  });

  it("each page passes its own single-language mode", () => {
    expect(read("src/app/(en)/(academy)/academy/page.tsx")).toContain('<PmpDiscoverabilitySection variant="course" englishOnly />');
    expect(read("src/app/(ar)/ar/(academy)/academy/page.tsx")).toContain('<PmpDiscoverabilitySection variant="course" arabicOnly />');
    expect(read("src/app/(en)/(academy)/courses/CoursesPageBody.tsx")).toContain('arabicOnly={lang === "ar"} englishOnly={lang === "en"}');
  });

  it("does not touch the English page metadata (title/description/hreflang stay as they were)", () => {
    const academy = read("src/app/(en)/(academy)/academy/page.tsx");
    expect(academy).toContain("PMP Course in Arabic & English (UAE) | ZentexAI Academy");
    expect(academy).toContain("alternatesFor(\"/academy\", \"en\")");
  });
});
