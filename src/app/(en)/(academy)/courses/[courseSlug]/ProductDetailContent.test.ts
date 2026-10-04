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
    is_published: true,
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

function render(product: ProductWithPricing, courseSlug: string | null, pathname: string) {
  mockPathname = pathname;
  return renderToString(
    createElement(
      LanguageProvider,
      null,
      createElement(ProductDetailContent, {
        product,
        courseSlug,
        curriculum,
        isAuthenticated: false,
        alreadyOwned: false,
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

  it("formats the promo end date with an unambiguous, localized month name and timezone label (not raw M/D/YYYY)", () => {
    const html = render(masteryProduct(), "pmp-mastery-program", "/courses/pmp-mastery-program");
    // "at GMT+4" (Intl's timeZoneName: "short" output with no hour/minute requested) proves the
    // viewer's own timezone shifts the calendar date near a boundary (this fixture is UTC 20:00) -
    // exactly the ambiguity the fix makes visible instead of hiding.
    expect(html).toMatch(/October (5|6), 2026 at (GMT|UTC)[+-]?\d*/);
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
