import { describe, it, expect } from "vitest";
import { isAlwaysFree, isFreePrice } from "./freeAccess";
import { FREE_PRICE } from "@/features/commerce/services/productService";
import type { EffectivePrice } from "@/features/commerce/types/commerce";

const paid: EffectivePrice = { currency: "AED", effectiveAmountMinorUnits: 35000, regularAmountMinorUnits: 35000, isPromotionActive: false, promotionValidUntil: null, accessDurationDays: 365 };

describe("free access helpers", () => {
  it("treats a permanently free product as free and always free", () => {
    expect(isFreePrice(FREE_PRICE)).toBe(true);
    expect(isAlwaysFree(FREE_PRICE)).toBe(true);
  });
  it("treats an active AED 0 promotion as free but not always free (it still needs enrolment)", () => {
    const promo = { ...paid, effectiveAmountMinorUnits: 0, isPromotionActive: true, promotionValidUntil: "2030-01-01T00:00:00Z" };
    expect(isFreePrice(promo)).toBe(true);
    expect(isAlwaysFree(promo)).toBe(false);
  });
  it("never treats a paid price, a bare AED 0 regular price or a missing price as free", () => {
    expect(isFreePrice(paid)).toBe(false);
    expect(isFreePrice({ ...paid, effectiveAmountMinorUnits: 0 })).toBe(false);
    expect(isFreePrice(null)).toBe(false);
    expect(isAlwaysFree(undefined)).toBe(false);
  });
});
