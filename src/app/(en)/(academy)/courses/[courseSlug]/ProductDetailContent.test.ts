import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/courses/pmp-mastery-program";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));

import { LanguageProvider } from "@/lib/LanguageContext";
import ProductDetailContent from "./ProductDetailContent";
import type { ProductWithPricing } from "@/features/commerce/types/commerce";
import { FREE_PRICE } from "@/features/commerce/services/productService";
import translations from "@/lib/translations";
import type { PublicCurriculumModule } from "@/features/courses/services/courseService";

const curriculum: PublicCurriculumModule[] = [
  { id: "m1", titleEn: "Project Integration Management", titleAr: null, lessons: [{ id: "l1", titleEn: "Intro", titleAr: null }] },
  { id: "m2", titleEn: "Project Scope Management", titleAr: null, lessons: [{ id: "l2", titleEn: "Scope Basics", titleAr: null }] },
];

function masteryProduct(overrides: Partial<ProductWithPricing> = {}): ProductWithPricing {
  return {
    id: "p1",
    slug: "pmp-mastery-program",
    type: "course",
    title_en: "PMP Mastery Program",
    title_ar: "برنامج احتراف PMP",
    description_en: "A structured PMP exam preparation course.",
    description_ar: "دورة منظمة للتحضير لاختبار PMP.",
    is_active: true,
    is_published: true, is_free: false,
    order_index: 0,
    capabilities: ["course:pmp", "practice:pmp"],
    price: {
      currency: "AED",
      effectiveAmountMinorUnits: 0,
      regularAmountMinorUnits: 49900,
      isPromotionActive: true,
      promotionValidUntil: "2026-10-05T20:00:00.000Z",
      accessDurationDays: 180,
    },
    ...overrides,
  };
}

function render(product: ProductWithPricing, courseSlug: string | null, pathname: string, session: { isAuthenticated?: boolean; alreadyOwned?: boolean } = {}) {
  mockPathname = pathname;
  return renderToString(
    createElement(
      LanguageProvider,
      null,
      createElement(ProductDetailContent, {
        product,
        courseSlug,
        curriculum,
        isAuthenticated: session.isAuthenticated ?? false,
        alreadyOwned: session.alreadyOwned ?? false,
      })
    )
  );
}

describe("ProductDetailContent layout", () => {
  it("does not cap the whole page at a narrow max-w-3xl (the reported 'narrow column' bug)", () => {
    const html = render(masteryProduct(), "pmp-mastery-program", "/courses/pmp-mastery-program");
    expect(html).toContain('class="container-page relative"><div class="mx-auto max-w-5xl">');
    expect(html).not.toContain('class="container-page relative max-w-3xl"');
  });

  it("renders the curriculum outside the pricing grid, at container width, not single-column-only", () => {
    const html = render(masteryProduct(), "pmp-mastery-program", "/courses/pmp-mastery-program");
    expect(html).toContain("Project Integration Management");
    expect(html).toMatch(/grid gap-4 lg:grid-cols-2/);
  });

  it("does not repeat the exact same description text twice (hero + a duplicate 'Overview' section)", () => {
    const html = render(masteryProduct(), "pmp-mastery-program", "/courses/pmp-mastery-program");
    const occurrences = html.split("A structured PMP exam preparation course.").length - 1;
    expect(occurrences).toBe(1);
  });

  it("formats the promo end date with an unambiguous, localized month name and a fixed timezone label (not raw M/D/YYYY, and not dependent on the server or visitor's own local timezone)", () => {
    const html = render(masteryProduct(), "pmp-mastery-program", "/courses/pmp-mastery-program");
    // Pinned to timeZone: "Asia/Dubai" explicitly (not the runtime's ambient local timezone) -
    // this fixture is UTC 20:00, which is already Oct 6 in Dubai (UTC+4), and must render
    // identically here regardless of which timezone this test happens to run in. Relying on
    // the ambient local timezone instead (as an earlier version of this fix did) produced a
    // different calendar day on the Vercel server than in a visitor's browser for the same
    // timestamp, which is a real React hydration-mismatch bug (error #425) caught on production.
    expect(html).toContain("October 6, 2026 at GMT+4");
    expect(html).not.toMatch(/10\/5\/2026|5\/10\/2026|10\/6\/2026|6\/10\/2026/);
  });

  it("renders the simulator product (pmp-exam-simulator) without the curriculum section, with its sales sections at full width", () => {
    const simulator = masteryProduct({
      slug: "pmp-exam-simulator",
      title_en: "PMP Exam Simulator",
      capabilities: ["mock_exam:pmp", "practice:pmp"],
    });
    const html = render(simulator, null, "/courses/pmp-exam-simulator");
    expect(html).not.toContain('max-w-3xl">');
    expect(html).not.toContain("Project Integration Management");
  });
});

describe("ProductDetailContent for a permanently free product", () => {
  const free = () => masteryProduct({ is_free: true, price: FREE_PRICE });

  it("shows FREE with an account prompt and no price, promotion, Buy or Enroll button to a visitor", () => {
    const html = render(free(), "pmp-mastery-program", "/courses/pmp-mastery-program");
    expect(html).toContain(">FREE<");
    expect(html).toContain("Free with a ZentexAI account");
    expect(html).toContain("Create a free account or log in to start.");
    expect(html).toContain("Create Free Account");
    expect(html).not.toMatch(/AED|Buy Now|Enroll for Free|Launch Offer|Regular price|months access/);
  });

  it("gives a signed-in student the learning links directly, with no purchase step", () => {
    const html = render(free(), "pmp-mastery-program", "/courses/pmp-mastery-program", { isAuthenticated: true });
    expect(html).toContain("Free access");
    expect(html).toContain('href="/courses/pmp-mastery-program/lessons/l1"');
    expect(html).toContain('href="/pmp/practice"');
    expect(html).not.toMatch(/Buy Now|Enroll for Free/);
  });

  it("has Arabic copy for every free-access string, labelled مجاناً", () => {
    // Product pages take Arabic from the visitor's stored preference (no /ar route), so check the strings themselves.
    const ar = translations.ar.commerce;
    expect(ar.card.free_badge).toBe("مجاناً");
    for (const v of [ar.card.free_access_badge, ar.product.access_heading, ar.product.free_access_note, ar.product.free_login_prompt, ar.product.free_signup_cta]) {
      expect(v).toMatch(/[\u0600-\u06FF]/);
    }
  });

  it("still offers Buy Now for a paid product (payment path kept for future paid offerings)", () => {
    const paid = masteryProduct({ price: { currency: "AED", effectiveAmountMinorUnits: 35000, regularAmountMinorUnits: 35000, isPromotionActive: false, promotionValidUntil: null, accessDurationDays: 365 } });
    const html = render(paid, "pmp-mastery-program", "/courses/pmp-mastery-program", { isAuthenticated: true });
    expect(html).toContain("Buy Now");
  });
});

describe("ProductDetailContent distinguishes the two free offerings", () => {
  it("shows the Mastery Program as free with an account, without a launch-offer label", () => {
    const html = render(masteryProduct({ is_free: true, price: FREE_PRICE }), "pmp-mastery-program", "/courses/pmp-mastery-program");
    expect(html).toContain("Free with a ZentexAI account");
    expect(html).not.toMatch(/Launch Offer|launch period/);
  });

  it("shows the Simulator as a free launch offer with advance notice of pricing, and no date or countdown", () => {
    const sim = masteryProduct({ is_free: true, price: FREE_PRICE, slug: "pmp-exam-simulator", title_en: "PMP Exam Simulator", capabilities: ["practice:pmp", "mock_exam:pmp"] });
    const html = render(sim, null, "/courses/pmp-exam-simulator");
    expect(html).toContain("Launch Offer");
    expect(html).toContain("Free during our launch period. Any future pricing will be announced in advance.");
    expect(html).not.toMatch(/AED|Buy Now|60[- ]day|days left|Offer ends/);
  });
});
