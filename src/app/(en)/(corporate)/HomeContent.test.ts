import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));
vi.mock("@/lib/fonts", () => ({ manrope: { className: "", variable: "" }, arabicFont: { variable: "" } }));

const { LanguageProvider } = await import("@/lib/LanguageContext");
const { default: HomeContent } = await import("./HomeContent");
const { homeCopy } = await import("@/lib/homeCopy");
const { visualCopy } = await import("@/lib/visualCopy");

/** renderToString HTML-escapes quotes/ampersands; compare against decoded text. */
const decode = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

function render(path: string) {
  mockPathname = path;
  return decode(renderToString(createElement(LanguageProvider, null, createElement(HomeContent, { latestPosts: [] }))));
}

const SERVICES = ["ai-agents-automation-uae", "whatsapp-automation-uae", "machine-learning-uae", "data-analytics-uae", "power-bi-consulting-uae"];

describe("homepage v2", () => {
  const en = render("/");
  const ar = render("/ar");

  it("has exactly one h1 whose text is in the server-rendered HTML", () => {
    expect(en.match(/<h1\b/g)).toHaveLength(1);
    expect(en).toContain(homeCopy.en.hero.title);
    expect(ar.match(/<h1\b/g)).toHaveLength(1);
    expect(ar).toContain(homeCopy.ar.hero.title);
  });

  it("never hides hero copy behind an entrance animation (visible at first paint, so LCP is real text)", () => {
    const hero = en.slice(en.indexOf('<section aria-labelledby="hero-title"'), en.indexOf("<figure"));
    expect(hero).not.toMatch(/animate-|opacity|invisible|hidden/);
    expect(en).not.toMatch(/animate-fade/);
  });

  it("links every service page, including Data Analytics and Power BI, from the homepage", () => {
    for (const s of SERVICES) expect(en).toContain(`href="/services/${s}"`);
  });

  it("localizes the same links for Arabic readers and points 'talk to the team' at the Arabic contact form", () => {
    for (const s of SERVICES) expect(ar).toContain(`href="/ar/services/${s}"`);
    expect(ar).toContain('href="/ar#contact"');
    expect(ar).toContain('href="/ar/services"');
    expect(ar).not.toContain('href="/contact"');
    expect(ar).not.toContain('href="/services"');
  });

  it("states what / who / how in crawlable text", () => {
    for (const item of homeCopy.en.what.items) {
      expect(en).toContain(item.term);
      expect(en).toContain(item.body);
    }
  });

  it("replaces the 'Three disciplines' claim cards with working principles", () => {
    expect(en).not.toContain("Three disciplines");
    expect(en).not.toContain("What Makes Us Different");
    for (const p of homeCopy.en.principles.items) expect(en).toContain(p.title);
  });

  it("renders the governed flow as a readable ordered list with every stage, gate and the audit trail (usable without JavaScript or WebGL)", () => {
    const c = visualCopy.en.agent;
    for (const step of c.steps) expect(en).toContain(step.title);
    expect(en).toContain(c.human);
    expect(en).toContain(c.audit);
    expect(en).toContain("Approved knowledge only");
    expect(en).toContain("Within permissions?");
    expect(en).toContain(`aria-label="${c.label}"`);
    expect(en).toContain("<ol");
  });

  it("keeps English and Arabic copy structurally identical", () => {
    const shape = (c: typeof homeCopy.en) => ({
      facts: c.hero.facts.length,
      what: c.what.items.length,
      build: c.services.build.map((s) => s.href),
      advisory: c.services.advisory.length,
      principles: c.principles.items.length,
    });
    expect(shape(homeCopy.ar)).toEqual(shape(homeCopy.en));
    expect(JSON.stringify(homeCopy)).not.toMatch(/:\s*""/);
  });
});
