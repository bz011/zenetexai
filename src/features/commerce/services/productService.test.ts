import { describe, it, expect } from "vitest";
import { resolveEffectivePrice } from "./productService";
import type { Price } from "@/features/commerce/types/commerce";

function price(overrides: Partial<Price>): Price {
  return {
    id: "price-1",
    product_id: "product-1",
    kind: "regular",
    currency: "AED",
    amount_minor_units: 35000,
    access_duration_days: 365,
    valid_from: null,
    valid_until: null,
    is_active: true,
    ...overrides,
  };
}

describe("resolveEffectivePrice", () => {
  it("returns null when there are no prices at all", () => {
    expect(resolveEffectivePrice([])).toBeNull();
  });

  it("resolves to the regular price when no promotional price exists", () => {
    const result = resolveEffectivePrice([price({})]);
    expect(result).not.toBeNull();
    expect(result!.effectiveAmountMinorUnits).toBe(35000);
    expect(result!.regularAmountMinorUnits).toBe(35000);
    expect(result!.isPromotionActive).toBe(false);
  });

  it("resolves to the promotional price when it is currently within its valid window", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const prices = [
      price({ kind: "regular", amount_minor_units: 35000 }),
      price({
        id: "promo-1",
        kind: "promotional",
        amount_minor_units: 0,
        valid_from: "2026-08-01T00:00:00.000Z",
        valid_until: "2026-08-31T00:00:00.000Z",
      }),
    ];

    const result = resolveEffectivePrice(prices, now);
    expect(result!.effectiveAmountMinorUnits).toBe(0);
    expect(result!.regularAmountMinorUnits).toBe(35000);
    expect(result!.isPromotionActive).toBe(true);
    expect(result!.promotionValidUntil).toBe("2026-08-31T00:00:00.000Z");
  });

  it("ignores a promotional price whose window has not started yet (future promotion)", () => {
    const now = new Date("2026-07-01T00:00:00.000Z");
    const prices = [
      price({ kind: "regular", amount_minor_units: 35000 }),
      price({ kind: "promotional", amount_minor_units: 0, valid_from: "2026-08-01T00:00:00.000Z", valid_until: "2026-08-31T00:00:00.000Z" }),
    ];

    const result = resolveEffectivePrice(prices, now);
    expect(result!.effectiveAmountMinorUnits).toBe(35000);
    expect(result!.isPromotionActive).toBe(false);
  });

  it("ignores a promotional price whose window has already ended (expired promotion)", () => {
    const now = new Date("2026-09-15T00:00:00.000Z");
    const prices = [
      price({ kind: "regular", amount_minor_units: 35000 }),
      price({ kind: "promotional", amount_minor_units: 0, valid_from: "2026-08-01T00:00:00.000Z", valid_until: "2026-08-31T00:00:00.000Z" }),
    ];

    const result = resolveEffectivePrice(prices, now);
    expect(result!.effectiveAmountMinorUnits).toBe(35000);
    expect(result!.isPromotionActive).toBe(false);
  });

  it("ignores a promotional price marked is_active: false, even within its date window", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const prices = [
      price({ kind: "regular", amount_minor_units: 35000 }),
      price({
        kind: "promotional",
        amount_minor_units: 0,
        is_active: false,
        valid_from: "2026-08-01T00:00:00.000Z",
        valid_until: "2026-08-31T00:00:00.000Z",
      }),
    ];

    const result = resolveEffectivePrice(prices, now);
    expect(result!.effectiveAmountMinorUnits).toBe(35000);
    expect(result!.isPromotionActive).toBe(false);
  });

  it("computes package savings from configured prices rather than a hard-coded number", () => {
    const coursePrice = resolveEffectivePrice([price({ amount_minor_units: 35000 })])!;
    const simulatorPrice = resolveEffectivePrice([price({ amount_minor_units: 35000 })])!;
    const packagePrice = resolveEffectivePrice([price({ amount_minor_units: 50000 })])!;

    const combined = coursePrice.effectiveAmountMinorUnits + simulatorPrice.effectiveAmountMinorUnits;
    const savings = combined - packagePrice.effectiveAmountMinorUnits;

    expect(combined).toBe(70000);
    expect(savings).toBe(20000);
  });
});
