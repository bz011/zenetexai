import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/courses/pmp-mastery-program";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));
vi.mock("@/features/commerce/services/checkoutService", () => ({ createCheckoutSession: vi.fn() }));
vi.mock("@/features/commerce/services/freeEnrollmentService", () => ({ enrollFree: vi.fn() }));

import { LanguageProvider } from "./LanguageContext";
import ProductDetailContent from "@/app/(en)/(academy)/courses/[courseSlug]/ProductDetailContent";
import type { ProductWithPricing } from "@/features/commerce/types/commerce";

const SRC = fs.readFileSync(path.resolve(__dirname, "../app/(en)/(academy)/courses/[courseSlug]/ProductDetailContent.tsx"), "utf8");

function product(overrides: Partial<ProductWithPricing>): ProductWithPricing {
  return {
    id: "p", slug: "pmp-mastery-program", type: "course", title_en: "PMP Mastery Program", title_ar: "برنامج احتراف PMP",
    description_en: "Course description", description_ar: "وصف الدورة", is_active: true, is_published: true, order_index: 1,
    capabilities: ["course:pmp"],
    price: { currency: "AED", effectiveAmountMinorUnits: 12300, regularAmountMinorUnits: 12300, isPromotionActive: false, promotionValidUntil: null, accessDurationDays: 365 },
    ...overrides,
  } as ProductWithPricing;
}
function page(p: ProductWithPricing, opts: { auth?: boolean } = {}) {
  return renderToString(createElement(LanguageProvider, null, createElement(ProductDetailContent, {
    product: p, courseSlug: p.capabilities.some((c) => c.startsWith("course:")) ? "pmp" : null, curriculum: [], isAuthenticated: !!opts.auth, alreadyOwned: false,
  })));
}

describe("PMP Mastery product page: readability and mobile CTA", () => {
  it("uses the responsive type scale, with no hard-coded body text below 14px", () => {
    expect(SRC).not.toMatch(/text-\[(1[0-3](\.\d+)?)px\]/);
    expect(SRC).not.toMatch(/text-slate-(500|600)\b/);
    expect(SRC).toContain("text-small");
    expect(SRC).toContain("text-body");
  });

  it("puts the existing pricing / login panel first on mobile via CSS order, on the Mastery page only", () => {
    const mastery = page(product({}));
    expect(mastery).toMatch(/<aside id="purchase" class="[^"]*order-first md:order-none/);
    const simulator = page(product({ slug: "pmp-exam-simulator", type: "simulator", capabilities: ["practice:pmp", "mock_exam:pmp"] }));
    expect(simulator).not.toContain("order-first");
    const bundle = page(product({ slug: "pmp-complete-package", type: "bundle", capabilities: ["course:pmp", "practice:pmp", "mock_exam:pmp"] }));
    expect(bundle).not.toContain("order-first");
  });

  it("adds no second purchase or login action: one panel, one login link, one sign-up link", () => {
    const html = page(product({}));
    expect(html.match(/<aside id="purchase"/g)).toHaveLength(1);
    expect(html.match(/href="\/login\?redirectTo=\/courses\/pmp-mastery-program"/g)).toHaveLength(1);
    expect(html.match(/href="\/signup"/g)).toHaveLength(1);
    expect(SRC.match(/<BuyNowButton /g)).toHaveLength(1);
    expect(SRC.match(/<EnrollFreeButton /g)).toHaveLength(1);
  });

  it("still shows the price and access term from product data, unchanged", () => {
    const html = page(product({}));
    expect(html).toContain("AED 123");
    expect(html).toContain("12 months access");
  });

  it("keeps the checkout and free-enrollment wiring exactly as before", () => {
    expect(SRC).toContain("<BuyNowButton productSlug={product.slug} />");
    expect(SRC).toContain("<EnrollFreeButton productSlug={product.slug} />");
    expect(SRC).toContain("isFreeNow ? (");
  });
});
