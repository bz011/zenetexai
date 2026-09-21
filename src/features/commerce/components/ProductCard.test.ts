import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/ar/courses";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));

import { LanguageProvider } from "@/lib/LanguageContext";
import ProductCard from "./ProductCard";
import type { ProductWithPricing } from "@/features/commerce/types/commerce";

function product(overrides: Partial<ProductWithPricing> = {}): ProductWithPricing {
  return {
    id: "p1", slug: "pmp-exam-simulator", type: "simulator",
    title_en: "PMP Exam Simulator", title_ar: "محاكي اختبار PMP",
    description_en: "English description", description_ar: "وصف بالعربية",
    is_active: true, is_published: true, order_index: 1, capabilities: [], price: null,
    ...overrides,
  } as ProductWithPricing;
}

function render(path: string, p: ProductWithPricing) {
  mockPathname = path;
  return renderToString(createElement(LanguageProvider, null, createElement(ProductCard, { product: p, owned: false })));
}

describe("ProductCard on /ar/courses", () => {
  it("shows the database's Arabic title and description on the Arabic page, linking to the product page", () => {
    const html = render("/ar/courses", product());
    expect(html).toContain("محاكي اختبار PMP");
    expect(html).toContain("وصف بالعربية");
    expect(html).not.toContain("English description");
    // The simulator has a dedicated Arabic page, so Arabic readers are linked to it.
    expect(html).toContain('href="/ar/courses/pmp-exam-simulator"');
  });

  it("links to the English product page for products with no Arabic version", () => {
    const html = render("/ar/courses", product({ slug: "pmp-mastery-program", type: "course" }));
    expect(html).toContain('href="/courses/pmp-mastery-program"');
  });

  it("falls back safely to the English text when the Arabic fields are empty", () => {
    const html = render("/ar/courses", product({ title_ar: "", description_ar: "" }));
    expect(html).toContain("PMP Exam Simulator");
    expect(html).toContain("English description");
  });

  it("keeps showing English on the English storefront", () => {
    const html = render("/courses", product());
    expect(html).toContain("PMP Exam Simulator");
    expect(html).not.toContain("محاكي اختبار PMP");
  });
});
