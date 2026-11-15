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
const alwaysFree: EffectivePrice = { currency: "AED", effectiveAmountMinorUnits: 0, regularAmountMinorUnits: null, isPromotionActive: false, promotionValidUntil: null, accessDurationDays: null, alwaysFree: true };

describe("Academy price label (never a hard-coded Free)", () => {
  it("shows the real paid price", () => {
    expect(priceLabel(paid, "en")).toBe(formatMoney(35000, "AED"));
  });
  it("shows FREE for an active AED 0 promotion, never for a bare AED 0 regular price", () => {
    expect(priceLabel(freePromo, "en")).toBe("FREE");
    expect(priceLabel(freePromo, "ar")).toBe("مجاناً");
    expect(priceLabel(zeroWithoutPromotion, "en")).not.toBe("FREE");
  });
  it("shows FREE (EN) and مجاناً (AR) for a permanently free product", () => {
    expect(priceLabel(alwaysFree, "en", "pmp-mastery-program")).toBe("FREE");
    expect(priceLabel(alwaysFree, "ar", "pmp-mastery-program")).toBe("مجاناً");
  });
  it("marks the Simulator's free access as a launch offer, with no date", () => {
    expect(priceLabel(alwaysFree, "en", "pmp-exam-simulator")).toBe("FREE · Launch offer");
    expect(priceLabel(alwaysFree, "ar", "pmp-exam-simulator")).toBe("مجاناً · عرض الإطلاق");
    expect(priceLabel(paid, "en", "pmp-exam-simulator")).toBe(formatMoney(35000, "AED"));
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
        expect(html).not.toMatch(/>FREE<|>مجاناً</);
      }
    }
  });
  it("labels the Mastery Program FREE and the Simulator a FREE launch offer, with no AED amount or date", () => {
    for (const [lang, free, launch] of [["en", ">FREE<", ">FREE · Launch offer<"], ["ar", ">مجاناً<", ">مجاناً · عرض الإطلاق<"]] as const) {
      const html = renderToStaticMarkup(createElement(AcademyPage, { lang, prices: { "pmp-mastery-program": alwaysFree, "pmp-exam-simulator": alwaysFree } }));
      expect(html.split(free).length - 1).toBe(1);
      expect(html.split(launch).length - 1).toBe(1);
      expect(html).not.toMatch(/AED|60[- ]day|days left|expires|ينتهي/i);
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
