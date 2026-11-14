import type { EffectivePrice } from "@/features/commerce/types/commerce";

/** Free right now: a permanently free product, or an active AED 0 promotion. */
export function isFreePrice(price: EffectivePrice | null | undefined): boolean {
  if (!price) return false;
  return price.alwaysFree === true || (price.isPromotionActive && price.effectiveAmountMinorUnits === 0);
}

/** Permanently free: no purchase or enrolment step, an account is enough. */
export function isAlwaysFree(price: EffectivePrice | null | undefined): boolean {
  return price?.alwaysFree === true;
}
