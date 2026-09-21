import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: async () => ({
          data: [
            { slug: "pmp-exam-simulator", updated_at: null },
            { slug: "pmp-mastery-program", updated_at: null },
          ],
        }),
      }),
    }),
  },
}));
vi.mock("@/lib/posts", () => ({ fetchPublishedPosts: async () => [] }));

import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import translations from "./translations";
import { dataAnalyticsCopy, powerBiCopy } from "./serviceLandingCopy";
import { faqJsonLd, serviceJsonLd } from "./structuredData";

const ROOT = path.resolve(__dirname, "../..");
const SERVICE_PATHS = [
  "/services/ai-agents-automation-uae",
  "/services/whatsapp-automation-uae",
  "/services/machine-learning-uae",
  "/services/data-analytics-uae",
  "/services/power-bi-consulting-uae",
];

function pageFile(routePath: string): string {
  return path.join(ROOT, "src/app/(en)/(corporate)", routePath, "page.tsx");
}

describe("SEO coverage", () => {
  it("lists every service landing page in the sitemap", async () => {
    const urls = (await sitemap()).map((e) => new URL(e.url).pathname);
    for (const p of SERVICE_PATHS) expect(urls).toContain(p);
  });

  it("keeps private routes out of the sitemap and disallowed in robots", async () => {
    const urls = (await sitemap()).map((e) => new URL(e.url).pathname);
    for (const p of ["/dashboard", "/login", "/admin", "/pmp/mock-exam", "/pmp/practice", "/checkout/success"]) {
      expect(urls.some((u) => u.startsWith(p))).toBe(false);
    }
    const rules = robots().rules as { disallow: string[] };
    for (const p of ["/api/", "/admin", "/dashboard", "/pmp/practice", "/pmp/mock-exam"]) expect(rules.disallow).toContain(p);
  });

  it("allows every service landing page through middleware's default-deny gate", () => {
    const mw = fs.readFileSync(path.join(ROOT, "src/middleware.ts"), "utf8");
    for (const p of SERVICE_PATHS) expect(mw).toContain(`"${p}"`);
  });

  it("has a real page.tsx for every service path and every internal related link", () => {
    for (const p of SERVICE_PATHS) expect(fs.existsSync(pageFile(p))).toBe(true);
    for (const copy of [dataAnalyticsCopy.en, powerBiCopy.en]) {
      for (const r of copy.related) {
        const route = r.href.split("#")[0];
        const exists = route === "/blog" || route === "/services" || fs.existsSync(pageFile(route));
        expect(exists, r.href).toBe(true);
      }
    }
  });

  it("gives each new page a unique title, description, and its own canonical path", () => {
    const seen = new Set<string>();
    for (const p of SERVICE_PATHS) {
      const src = fs.readFileSync(pageFile(p), "utf8");
      const title = /const title =\s*"([^"]+)"/.exec(src)?.[1];
      const desc = /const description =\s*"([^"]+)"/.exec(src)?.[1];
      expect(title, p).toBeTruthy();
      expect(desc, p).toBeTruthy();
      expect(src).toContain(`const PATH = "${p}"`);
      expect(src).toContain('alternates: alternatesFor(PATH, "en")');
      expect(seen.has(title!)).toBe(false);
      seen.add(title!);
    }
  });
});

describe("service landing copy", () => {
  for (const [name, copy] of [["dataAnalytics", dataAnalyticsCopy], ["powerBi", powerBiCopy]] as const) {
    it(`${name}: English and Arabic have identical structure and no empty strings`, () => {
      const shape = (c: typeof copy.en) => ({
        audience: c.audience.length, deliverables: c.deliverables.length, usecases: c.usecases.length,
        process: c.process.length, related: c.related.length, faq: c.faq.length,
      });
      expect(shape(copy.ar)).toEqual(shape(copy.en));
      expect(copy.en.related.map((r) => r.href)).toEqual(copy.ar.related.map((r) => r.href));
      const flat = JSON.stringify(copy);
      expect(flat).not.toMatch(/:\s*""/);
    });

    it(`${name}: is wired into the translation tree for both languages`, () => {
      expect(translations.en[name]).toBe(copy.en);
      expect(translations.ar[name]).toBe(copy.ar);
    });
  }

  it("makes no unsubstantiated claims (partnerships, clients, prices, guarantees)", () => {
    const text = JSON.stringify([dataAnalyticsCopy.en, powerBiCopy.en]).toLowerCase();
    for (const bad of ["certified partner", "microsoft partner", "trusted by", "our clients include", "guarantee", "aed ", "award-winning", "#1"]) {
      expect(text.includes(bad), bad).toBe(false);
    }
  });

  it("appended Dubai/UAE FAQs to the existing AI agents, WhatsApp and ML pages in both languages", () => {
    for (const key of ["aiAgentsAutomation", "whatsappAutomation", "machineLearning"] as const) {
      expect(translations.ar[key].faq.length).toBe(translations.en[key].faq.length);
      expect(translations.en[key].faq.some((f) => /Dubai/.test(f.q))).toBe(true);
    }
  });
});

describe("structured data builders", () => {
  it("faqJsonLd only emits the supplied visible Q&A", () => {
    const ld = faqJsonLd([{ q: "Q1?", a: "A1" }]);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toEqual([{ "@type": "Question", name: "Q1?", acceptedAnswer: { "@type": "Answer", text: "A1" } }]);
  });

  it("serviceJsonLd adds areaServed only when provided", () => {
    const withArea = serviceJsonLd({ name: "n", description: "d", path: "/x", areaServed: ["United Arab Emirates"] });
    const without = serviceJsonLd({ name: "n", description: "d", path: "/x" });
    expect(withArea.areaServed).toBeDefined();
    expect("areaServed" in without).toBe(false);
  });
});

// ─── Arabic URLs ────────────────────────────────────────────────────────────
import { ARABIC_EQUIVALENT_PATHS, hasArabicVersion, toArabicPath } from "./i18nRoutes";
import { ARABIC_SEO, arabicMetadata } from "./arabicSeo";

function arabicPageFile(enPath: string): string {
  const rel = enPath === "/" ? "" : enPath;
  const group = enPath === "/academy" || enPath.startsWith("/courses") ? "(academy)" : "(corporate)";
  return path.join(ROOT, "src/app/(ar)/ar", group, rel, "page.tsx");
}

describe("Arabic URLs: sitemap, hreflang, metadata", () => {
  it("has a real Arabic page and Arabic SEO metadata for every advertised equivalent", () => {
    for (const p of ARABIC_EQUIVALENT_PATHS) {
      expect(fs.existsSync(arabicPageFile(p)), `${p} -> ${arabicPageFile(p)}`).toBe(true);
      expect(ARABIC_SEO[p], p).toBeDefined();
      expect(ARABIC_SEO[p].title).toMatch(/[؀-ۿ]/);
      expect(ARABIC_SEO[p].description).toMatch(/[؀-ۿ]/);
    }
    expect(Object.keys(ARABIC_SEO).sort()).toEqual([...ARABIC_EQUIVALENT_PATHS].sort());
  });

  it("lists both language versions in the sitemap with reciprocal hreflang, and never an Arabic URL without a page", async () => {
    const entries = await sitemap();
    const byPath = new Map(entries.map((e) => [new URL(e.url).pathname, e]));
    for (const p of ARABIC_EQUIVALENT_PATHS) {
      const en = byPath.get(p);
      const ar = byPath.get(toArabicPath(p));
      expect(en, p).toBeDefined();
      expect(ar, toArabicPath(p)).toBeDefined();
      const enLang = en!.alternates?.languages as Record<string, string>;
      const arLang = ar!.alternates?.languages as Record<string, string>;
      expect(arLang).toEqual(enLang);
      expect(new URL(enLang.en).pathname).toBe(p);
      expect(new URL(enLang.ar).pathname).toBe(toArabicPath(p));
      expect(new URL(enLang["x-default"]).pathname).toBe(p);
    }
    const arabicUrls = entries.map((e) => new URL(e.url).pathname).filter((u) => u === "/ar" || u.startsWith("/ar/"));
    expect(arabicUrls.length).toBe(ARABIC_EQUIVALENT_PATHS.length);
    for (const u of arabicUrls) expect(hasArabicVersion(u === "/ar" ? "/" : u.slice(3))).toBe(true);
    // Pages with no Arabic version get no alternates block and no /ar twin.
    for (const p of ["/about", "/contact", "/resources", "/blog"]) {
      expect(byPath.get(p)?.alternates).toBeUndefined();
      expect(byPath.has(toArabicPath(p))).toBe(false);
    }
  });

  it("builds Arabic metadata with an /ar self-canonical and reciprocal hreflang", () => {
    for (const p of ARABIC_EQUIVALENT_PATHS) {
      const m = arabicMetadata(p);
      const alt = m.alternates as { canonical: string; languages: Record<string, string> };
      expect(alt.canonical).toBe(toArabicPath(p));
      expect(alt.languages).toEqual({ en: p, ar: toArabicPath(p), "x-default": p });
    }
  });

  it("gives the English pages the same hreflang set as their Arabic twins", () => {
    for (const p of ARABIC_EQUIVALENT_PATHS) {
      const enFile = p === "/" ? "src/app/(en)/(corporate)/page.tsx"
        : p === "/academy" ? "src/app/(en)/(academy)/academy/page.tsx"
        : p === "/courses" ? "src/app/(en)/(academy)/courses/page.tsx"
        : p.startsWith("/courses/") ? "src/app/(en)/(academy)/courses/[courseSlug]/page.tsx"
        : `src/app/(en)/(corporate)${p}/page.tsx`;
      const src = fs.readFileSync(path.join(ROOT, enFile), "utf8");
      expect(src, enFile).toContain("alternatesFor(");
    }
  });

  it("uses a dedicated Arabic root layout that server-renders lang=ar dir=rtl", () => {
    const src = fs.readFileSync(path.join(ROOT, "src/app/(ar)/layout.tsx"), "utf8");
    expect(src).toContain('<html lang="ar" dir="rtl">');
    const en = fs.readFileSync(path.join(ROOT, "src/app/(en)/layout.tsx"), "utf8");
    expect(en).toContain('<html lang="en" dir="ltr">');
  });
});
