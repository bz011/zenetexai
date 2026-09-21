import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/courses/pmp-exam-simulator";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));
vi.mock("@/features/commerce/services/checkoutService", () => ({ createCheckoutSession: vi.fn() }));
vi.mock("@/features/commerce/services/freeEnrollmentService", () => ({ enrollFree: vi.fn() }));

import { LanguageProvider } from "./LanguageContext";
import { PMP_EXAM_BLUEPRINT_2026 } from "@/features/mock-exam/config/examBlueprint";
import { SIMULATOR_SLUG, fillCopy, simulatorFactsFromBlueprint, simulatorMetadataText, simulatorPageCopy } from "./simulatorPageCopy";
import { SimulatorDetails, SimulatorHero } from "@/features/commerce/components/SimulatorSalesSections";
import ProductDetailContent from "@/app/(en)/(academy)/courses/[courseSlug]/ProductDetailContent";
import type { ProductWithPricing } from "@/features/commerce/types/commerce";

const ROOT = path.resolve(__dirname, "../..");
const facts = simulatorFactsFromBlueprint(PMP_EXAM_BLUEPRINT_2026);

function product(overrides: Partial<ProductWithPricing> = {}): ProductWithPricing {
  return {
    id: "p1", slug: SIMULATOR_SLUG, type: "simulator",
    title_en: "PMP Exam Simulator", title_ar: "محاكي اختبار PMP",
    description_en: "DB description en", description_ar: "DB description ar",
    is_active: true, is_published: true, order_index: 2,
    capabilities: ["practice:pmp", "mock_exam:pmp"],
    price: { currency: "AED", effectiveAmountMinorUnits: 12300, regularAmountMinorUnits: 12300, isPromotionActive: false, promotionValidUntil: null, accessDurationDays: 180 },
    ...overrides,
  } as ProductWithPricing;
}

function render(pathname: string, el: () => React.ReactElement) {
  mockPathname = pathname;
  return renderToString(createElement(LanguageProvider, null, el()));
}
function page(pathname: string, p: ProductWithPricing) {
  return render(pathname, () => createElement(ProductDetailContent, { product: p, courseSlug: null, curriculum: [], isAuthenticated: false, alreadyOwned: false }));
}

describe("simulator facts are derived from real configuration, not typed into the copy", () => {
  it("matches the active exam blueprint (180 questions, 240 minutes, 3 x 60, two 10-minute breaks)", () => {
    expect(facts).toEqual({ questions: 180, hours: 4, sections: 3, perSection: 60, breaks: 2, breakMins: 10 });
  });

  it("states Practice Mode session sizes and timers that exist in PracticeConfigForm", () => {
    const form = fs.readFileSync(path.join(ROOT, "src/features/practice/components/PracticeConfigForm.tsx"), "utf8");
    expect(form).toContain("[5, 10, 20, 30, 50]");
    expect(form).toContain('"60"');
    expect(form).toContain('"78"');
    for (const lang of ["en", "ar"] as const) {
      const joined = simulatorPageCopy[lang].practice_points.join(" ");
      for (const n of ["5", "10", "20", "30", "50", "60", "78"]) expect(joined, `${lang} ${n}`).toContain(n);
    }
  });

  it("leaves no unresolved placeholder in any English or Arabic string once filled", () => {
    for (const lang of ["en", "ar"] as const) {
      const c = simulatorPageCopy[lang];
      const all = [c.facts_time_value, c.facts_time_note, ...c.mock_points, ...c.faq.flatMap((f) => [f.q, f.a]), c.seo_description];
      for (const s of all) expect(fillCopy(s, { ...facts, months: 12 }), s).not.toMatch(/\{\w+\}/);
    }
  });

  it("has English and Arabic copy with identical structure", () => {
    const { en, ar } = simulatorPageCopy;
    expect(ar.faq.length).toBe(en.faq.length);
    expect(ar.features.length).toBe(en.features.length);
    expect(ar.mock_points.length).toBe(en.mock_points.length);
    expect(ar.practice_points.length).toBe(en.practice_points.length);
  });
});

describe("claims the page must never make", () => {
  const banned = [
    /\bunlimited\b/i, /guarantee[sd]?\b(?! I pass)/i, /pass rate/i, /(?<!or )\b(approved|endorsed|accredited|certified) by (PMI|Project Management Institute)/i,
    /\b(three|six|3|6|ten|10) (full |different )?(mock )?exams\b/i, /\b\d{3,}\s*(\+\s*)?(practice |exam |real )?questions in (the|our) (bank|library)/i, /\bAED\b/, /aed\s*\d/i, /\bmoney-back\b/i,
  ];
  it("English and Arabic copy contains no exam-count, unlimited, guarantee, PMI-approval, or price claim", () => {
    for (const lang of ["en", "ar"] as const) {
      const text = JSON.stringify(simulatorPageCopy[lang]);
      for (const re of banned) expect(text, `${lang} ${re}`).not.toMatch(re);
    }
    expect(simulatorPageCopy.en.faq.find((f) => /guarantee/i.test(f.q))!.a).toMatch(/^No\./);
    expect(simulatorPageCopy.en.disclaimer).toMatch(/not affiliated with or endorsed by PMI/);
    expect(simulatorPageCopy.ar.disclaimer).toContain("ليست تابعة");
  });

  it("says plainly that there is no fixed number of exams, in both languages", () => {
    expect(simulatorPageCopy.en.facts_exams_note).toMatch(/no fixed list of numbered exams/i);
    expect(simulatorPageCopy.ar.facts_exams_note).toContain("لا توجد قائمة ثابتة");
  });
});

describe("SEO metadata", () => {
  it("has unique, language-appropriate titles and descriptions built from the blueprint", () => {
    const en = simulatorMetadataText("en");
    const ar = simulatorMetadataText("ar");
    expect(en.title).not.toBe(ar.title);
    expect(en.description).toContain("180-question");
    expect(ar.description).toContain("180");
    expect(ar.title).toMatch(/[؀-ۿ]/);
    expect(en.title.length).toBeLessThanOrEqual(70);
    expect(en.description.length).toBeLessThanOrEqual(200);
  });
});

describe("rendered product page", () => {
  it("English: benefit-led headline, verified facts, comparison, FAQ, and price/term taken from product data", () => {
    const html = page("/courses/pmp-exam-simulator", product());
    expect(html).toContain(simulatorPageCopy.en.hero_h1);
    expect(html).toContain("180");
    expect(html).toContain("New exam on demand");
    expect(html).toContain("Full Mock Exam");
    expect(html).toContain("Practice Mode");
    expect(html).toContain(simulatorPageCopy.en.faq[1].q);
    // Price/term come from the product's price row (123 AED, 180 days -> 6 months), never hardcoded copy.
    expect(html).toContain("AED 123<");
    expect(html).toContain("6 months");
    expect(html).toContain('id="purchase"');
  });

  it("Arabic URL: server-renders the Arabic sales page", () => {
    const html = page("/ar/courses/pmp-exam-simulator", product());
    expect(html).toContain(simulatorPageCopy.ar.hero_h1);
    expect(html).toContain(simulatorPageCopy.ar.faq[0].q.replace(/\{\w+\}/g, "").slice(0, 12));
    expect(html).not.toContain(simulatorPageCopy.en.hero_h1);
  });

  it("does not repeat the generic overview or the generic 'what's included' list on the simulator page", () => {
    const html = page("/courses/pmp-exam-simulator", product());
    expect(html).not.toContain(">Overview<");
    expect(html).not.toContain("PMP Mock Exam</span>");
    expect(html).not.toContain("DB description en");
  });

  it("leaves other product pages untouched (PMP Mastery Program still shows Overview and its included list)", () => {
    const mastery = product({ slug: "pmp-mastery-program", type: "course", title_en: "PMP Mastery Program", capabilities: ["course:pmp"] });
    const html = page("/courses/pmp-mastery-program", mastery);
    expect(html).toContain("Overview");
    expect(html).toContain("PMP Mastery Program course access");
    expect(html).not.toContain(simulatorPageCopy.en.hero_h1);
  });

  it("keeps the existing purchase CTA and free-enrollment logic on the simulator page", () => {
    const html = render("/courses/pmp-exam-simulator", () => createElement(SimulatorHero, { product: product() }));
    expect(html).toContain('href="#purchase"');
    const src = fs.readFileSync(path.join(ROOT, "src/app/(en)/(academy)/courses/[courseSlug]/ProductDetailContent.tsx"), "utf8");
    expect(src).toContain("<BuyNowButton productSlug={product.slug} />");
    expect(src).toContain("<EnrollFreeButton productSlug={product.slug} />");
  });

  it("renders the details block on its own in Arabic", () => {
    const html = render("/ar/courses/pmp-exam-simulator", () => createElement(SimulatorDetails));
    expect(html).toContain(simulatorPageCopy.ar.compare_h2);
  });
});
