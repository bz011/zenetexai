/**
 * Public product/price reads. Every function here is safe to call for an
 * unauthenticated visitor - the RLS policies on products/prices/
 * product_capabilities (migration 019) already restrict what comes back
 * (published products, active prices only) regardless of caller, so this
 * layer never needs to branch on auth state itself.
 *
 * resolveEffectivePrice() mirrors (in application code, for display) the
 * same "is there a currently-valid AED-0 promotion" logic that
 * grant_free_enrollment() enforces server-side in SQL as the actual
 * security boundary - this copy is display-only and is never trusted to
 * authorize an entitlement grant.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product, Price, EffectivePrice, ProductWithPricing, Capability } from "@/features/commerce/types/commerce";

const PRODUCT_COLUMNS =
  "id, slug, type, title_en, title_ar, description_en, description_ar, is_active, is_published, order_index";
const PRICE_COLUMNS =
  "id, product_id, kind, currency, amount_minor_units, access_duration_days, valid_from, valid_until, is_active";

/** Same resolution rule as resolveEffectivePrice below, but returns the
 * actual `prices` row (with its id) instead of a display summary - needed
 * wherever code must act on the effective price server-side (e.g.
 * checkoutService resolving which price_id/access_duration_days a paid
 * checkout is for), never trusting an amount the client already saw. */
export function resolveEffectivePriceRow(prices: Price[], now: Date = new Date()): Price | null {
  const regular = prices.find((p) => p.kind === "regular" && p.is_active) ?? null;
  const activePromo =
    prices.find(
      (p) =>
        p.kind === "promotional" &&
        p.is_active &&
        p.valid_from &&
        p.valid_until &&
        new Date(p.valid_from) <= now &&
        now <= new Date(p.valid_until)
    ) ?? null;

  return activePromo ?? regular;
}

export function resolveEffectivePrice(prices: Price[], now: Date = new Date()): EffectivePrice | null {
  const regular = prices.find((p) => p.kind === "regular" && p.is_active) ?? null;
  const effective = resolveEffectivePriceRow(prices, now);
  if (!effective) return null;

  const isPromotionActive = effective.kind === "promotional";
  return {
    currency: effective.currency,
    effectiveAmountMinorUnits: effective.amount_minor_units,
    regularAmountMinorUnits: regular?.amount_minor_units ?? null,
    isPromotionActive,
    promotionValidUntil: isPromotionActive ? effective.valid_until : null,
    accessDurationDays: effective.access_duration_days,
  };
}

export async function getStorefrontProducts(supabase: SupabaseClient): Promise<ProductWithPricing[]> {
  const { data: products, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (error || !products || products.length === 0) {
    if (error) console.error("[productService] getStorefrontProducts error:", error.message);
    return [];
  }

  return attachPricingAndCapabilities(supabase, products as Product[]);
}

export async function getProductBySlug(supabase: SupabaseClient, slug: string): Promise<ProductWithPricing | null> {
  const { data: product, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("slug", slug).maybeSingle();

  if (error || !product) return null;

  const [withPricing] = await attachPricingAndCapabilities(supabase, [product as Product]);
  return withPricing ?? null;
}

async function attachPricingAndCapabilities(supabase: SupabaseClient, products: Product[]): Promise<ProductWithPricing[]> {
  const productIds = products.map((p) => p.id);
  if (productIds.length === 0) return [];

  const [{ data: prices }, { data: capRows }] = await Promise.all([
    supabase.from("prices").select(PRICE_COLUMNS).in("product_id", productIds),
    supabase.from("product_capabilities").select("product_id, capability").in("product_id", productIds),
  ]);

  const pricesByProduct = new Map<string, Price[]>();
  for (const price of (prices ?? []) as Price[]) {
    const list = pricesByProduct.get(price.product_id) ?? [];
    list.push(price);
    pricesByProduct.set(price.product_id, list);
  }

  const capsByProduct = new Map<string, Capability[]>();
  for (const row of (capRows ?? []) as { product_id: string; capability: string }[]) {
    const list = capsByProduct.get(row.product_id) ?? [];
    list.push(row.capability);
    capsByProduct.set(row.product_id, list);
  }

  return products.map((product) => ({
    ...product,
    capabilities: capsByProduct.get(product.id) ?? [],
    price: resolveEffectivePrice(pricesByProduct.get(product.id) ?? []),
  }));
}
