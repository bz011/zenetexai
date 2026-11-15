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

/**
 * Free products offered as a limited launch offer rather than free with no
 * planned end date. Copy only: no countdown, end date, expiry or billing is
 * attached to it. Access is still decided by products.is_free.
 */
const LAUNCH_OFFER_SLUGS = new Set(["pmp-exam-simulator"]);

export function isLaunchOffer(slug: string, price: EffectivePrice | null | undefined): boolean {
  return isAlwaysFree(price) && LAUNCH_OFFER_SLUGS.has(slug);
}
