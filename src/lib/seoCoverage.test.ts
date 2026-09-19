import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: () => ({ select: () => ({ eq: async () => ({ data: [] }) }) }) } }));
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
  return path.join(ROOT, "src/app/(corporate)", routePath, "page.tsx");
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
      expect(src).toContain("alternates: { canonical: PATH }");
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
