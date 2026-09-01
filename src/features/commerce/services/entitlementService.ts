/**
 * Server-authoritative capability checks. This is the ONLY thing any page
 * (lesson, practice, mock exam, dashboard) may trust to decide access -
 * never `enrollments`, never a client-supplied flag. Every function here
 * re-derives from `entitlements` (RLS-scoped to the caller) joined against
 * `product_capabilities`, respecting `status = 'active'` and expiry.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Capability, ProductType } from "@/features/commerce/types/commerce";

interface ActiveEntitlementRow {
  product_id: string;
  expires_at: string | null;
}

async function getActiveProductIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("entitlements")
    .select("product_id, expires_at")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error || !data) return [];

  const now = Date.now();
  return (data as ActiveEntitlementRow[])
    .filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > now)
    .map((row) => row.product_id);
}

/** Every capability the user currently, actively holds (across all owned products). */
export async function getUserCapabilities(supabase: SupabaseClient, userId: string): Promise<Set<Capability>> {
  const activeProductIds = await getActiveProductIds(supabase, userId);
  if (activeProductIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("product_capabilities")
    .select("capability")
    .in("product_id", activeProductIds);

  if (error || !data) return new Set();
  return new Set((data as { capability: string }[]).map((r) => r.capability));
}

export async function hasCapability(supabase: SupabaseClient, userId: string, capability: Capability): Promise<boolean> {
  const capabilities = await getUserCapabilities(supabase, userId);
  return capabilities.has(capability);
}

export interface OwnedLearningResource {
  productId: string;
  productSlug: string;
  productType: ProductType;
  titleEn: string;
  titleAr: string;
  capabilities: Capability[];
  expiresAt: string | null;
}

/** Products the user actually owns (active, unexpired entitlement), for Dashboard/My Learning. */
export async function getOwnedLearningResources(supabase: SupabaseClient, userId: string): Promise<OwnedLearningResource[]> {
  const { data: entitlements, error } = await supabase
    .from("entitlements")
    .select("product_id, expires_at")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error || !entitlements || entitlements.length === 0) return [];

  const now = Date.now();
  const active = (entitlements as ActiveEntitlementRow[]).filter(
    (row) => !row.expires_at || new Date(row.expires_at).getTime() > now
  );
  if (active.length === 0) return [];

  const productIds = active.map((row) => row.product_id);
  const expiryByProduct = new Map(active.map((row) => [row.product_id, row.expires_at]));

  const [{ data: products }, { data: capRows }] = await Promise.all([
    supabase.from("products").select("id, slug, type, title_en, title_ar").in("id", productIds),
    supabase.from("product_capabilities").select("product_id, capability").in("product_id", productIds),
  ]);

  const capsByProduct = new Map<string, Capability[]>();
  for (const row of (capRows ?? []) as { product_id: string; capability: string }[]) {
    const list = capsByProduct.get(row.product_id) ?? [];
    list.push(row.capability);
    capsByProduct.set(row.product_id, list);
  }

  return ((products ?? []) as { id: string; slug: string; type: ProductType; title_en: string; title_ar: string }[]).map(
    (product) => ({
      productId: product.id,
      productSlug: product.slug,
      productType: product.type,
      titleEn: product.title_en,
      titleAr: product.title_ar,
      capabilities: capsByProduct.get(product.id) ?? [],
      expiresAt: expiryByProduct.get(product.id) ?? null,
    })
  );
}
