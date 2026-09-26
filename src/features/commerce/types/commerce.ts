export type ProductType = "course" | "simulator" | "bundle";
export type PriceKind = "regular" | "promotional";
export type EntitlementSource = "purchase" | "free_promotion" | "admin_grant" | "legacy_enrollment";

/** Convention: "<resource>:<scope>", e.g. "course:pmp". For a "course:<slug>"
 * capability, <slug> matches courses.slug. */
export type Capability = string;

export interface Product {
  id: string;
  slug: string;
  type: ProductType;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  is_active: boolean;
  is_published: boolean;
  order_index: number;
}

export interface Price {
  id: string;
  product_id: string;
  kind: PriceKind;
  currency: string;
  amount_minor_units: number;
  access_duration_days: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

/** Result of resolving which price currently applies to a product. */
export interface EffectivePrice {
  currency: string;
  /** The price the product actually costs right now (promo if one is valid, otherwise regular). */
  effectiveAmountMinorUnits: number;
  /** The standing, non-promotional price - always present so "regular" can be shown struck through. */
  regularAmountMinorUnits: number | null;
  isPromotionActive: boolean;
  promotionValidUntil: string | null;
  accessDurationDays: number | null;
}

export interface ProductWithPricing extends Product {
  capabilities: Capability[];
  price: EffectivePrice | null;
}

export interface Entitlement {
  id: string;
  user_id: string;
  product_id: string;
  source: EntitlementSource;
  status: "active" | "revoked";
  granted_at: string;
  expires_at: string | null;
}
