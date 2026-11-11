import { describe, expect, it, vi } from "vitest";

// Static image imports carry no size outside Next; render a plain <img> here.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: unknown; alt?: string }) => {
    const { createElement: h } = require("react");
    return h("img", { src: typeof src === "string" ? src : "", alt: alt ?? "" });
  },
}));
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { EffectivePrice } from "@/features/commerce/types/commerce";
import { formatMoney } from "@/features/commerce/utils/money";
import AcademyPage, { priceLabel } from "./AcademyPage";

const paid: EffectivePrice = { currency: "AED", effectiveAmountMinorUnits: 35000, regularAmountMinorUnits: 35000, isPromotionActive: false, promotionValidUntil: null, accessDurationDays: 365 };
const freePromo: EffectivePrice = { ...paid, effectiveAmountMinorUnits: 0, isPromotionActive: true, promotionValidUntil: "2027-11-30T00:00:00Z" };
const zeroWithoutPromotion: EffectivePrice = { ...paid, effectiveAmountMinorUnits: 0, regularAmountMinorUnits: 0 };

describe("Academy price label (never a hard-coded Free)", () => {
  it("shows the real paid price", () => {
    expect(priceLabel(paid, "en")).toBe(formatMoney(35000, "AED"));
  });
  it("shows Free only for an active AED 0 promotion (the rule grant_free_enrollment enforces)", () => {
    expect(priceLabel(freePromo, "en")).toBe("Free");
    expect(priceLabel(freePromo, "ar")).toBe("مجاني");
    expect(priceLabel(zeroWithoutPromotion, "en")).not.toBe("Free");
  });
  it("shows no price when the catalog is unknown", () => {
    expect(priceLabel(null, "en")).toBeNull();
    expect(priceLabel(undefined, "ar")).toBeNull();
  });
});

describe("Academy page", () => {
  it("never renders Free while products are paid, or when prices are unavailable", () => {
    for (const lang of ["en", "ar"] as const) {
      const cases: Record<string, EffectivePrice | null>[] = [{}, { "pmp-mastery-program": paid, "pmp-exam-simulator": paid }];
      for (const prices of cases) {
        const html = renderToStaticMarkup(createElement(AcademyPage, { lang, prices }));
        expect(html).not.toMatch(/>Free<|>مجاني</);
      }
    }
  });
  it("renders the paid price and links to the real product pages", () => {
    const html = renderToStaticMarkup(createElement(AcademyPage, { lang: "en", prices: { "pmp-mastery-program": paid, "pmp-exam-simulator": paid } }));
    expect(html).toContain(formatMoney(35000, "AED"));
    expect(html).toContain('href="/courses/pmp-mastery-program"');
    expect(html).toContain('href="/courses/pmp-exam-simulator"');
    expect(html).not.toContain("/design-lab");
  });
});
