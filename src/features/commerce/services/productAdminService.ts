"use server";

/**
 * Minimal admin commerce configuration - enough to run Sprint 10A-10C
 * without editing source code (product active/published flags, regular
 * price amount, promotional price window, manual entitlement grants). Not
 * a full ecommerce CMS: no refund UI, no coupon builder, no analytics.
 *
 * Every action calls requireAdmin() first. RLS on
 * products/prices/entitlements (migration 019) enforces the same
 * restriction as a backstop, same "app-level check + RLS backstop" pattern
 * as courseAdminService.ts. These are plain bound form actions (see
 * `/admin/commerce`'s `.bind(null, id)` usage, same convention as
 * courseAdminService.updateCourse/createModule) - not wired to
 * useFormState, so each one returns void and throws on failure rather than
 * returning a result object.
 */

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  productFlagsSchema,
  regularPriceSchema,
  promoPriceSchema,
  grantEntitlementSchema,
} from "@/lib/validators/commerceValidators";
import type { Product, Price } from "@/features/commerce/types/commerce";

export interface AdminProductRow extends Product {
  regularPrice: Price | null;
  promoPrice: Price | null;
}

function logAndSummarize(actionName: string, fieldErrors: Record<string, string[] | undefined>): string {
  console.error(`[${actionName}] validation failed:`, fieldErrors);
  const summary = Object.entries(fieldErrors)
    .filter(([, issues]) => issues && issues.length > 0)
    .map(([field, issues]) => `${field} (${issues!.join(", ")})`)
    .join("; ");
  return `Invalid data: ${summary || "unknown validation error"}`;
}

export async function getAdminProducts(): Promise<AdminProductRow[]> {
  const { supabase } = await requireAdmin({ loginRedirectTo: "/admin/commerce" });

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, type, title_en, title_ar, description_en, description_ar, is_active, is_published, order_index")
    .order("order_index", { ascending: true });

  const productList = (products ?? []) as Product[];
  if (productList.length === 0) return [];

  const { data: prices } = await supabase
    .from("prices")
    .select("id, product_id, kind, currency, amount_minor_units, access_duration_days, valid_from, valid_until, is_active")
    .in(
      "product_id",
      productList.map((p) => p.id)
    );

  const priceList = (prices ?? []) as Price[];

  return productList.map((product) => ({
    ...product,
    regularPrice: priceList.find((p) => p.product_id === product.id && p.kind === "regular") ?? null,
    promoPrice: priceList.find((p) => p.product_id === product.id && p.kind === "promotional") ?? null,
  }));
}

export async function updateProductFlags(productId: string, formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();

  const parsed = productFlagsSchema.safeParse({
    is_active: formData.get("is_active") === "on",
    is_published: formData.get("is_published") === "on",
  });
  if (!parsed.success) throw new Error(logAndSummarize("updateProductFlags", parsed.error.flatten().fieldErrors));

  const { error } = await supabase.from("products").update(parsed.data).eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/commerce");
  revalidatePath("/courses");
}

export async function updateRegularPrice(productId: string, priceId: string, formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();

  const parsed = regularPriceSchema.safeParse({
    amount_minor_units: Number(formData.get("amount_minor_units")),
  });
  if (!parsed.success) throw new Error(logAndSummarize("updateRegularPrice", parsed.error.flatten().fieldErrors));

  const { error } = await supabase.from("prices").update(parsed.data).eq("id", priceId).eq("product_id", productId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/commerce");
  revalidatePath("/courses");
}

/**
 * Creates the product's promotional price row if none exists yet, otherwise
 * updates the existing one - a product has at most one promotional price
 * row in this sprint's minimal admin (no promo history/scheduling queue).
 * valid_from/valid_until are required by the schema, matching the DB
 * constraint that a promotional price can never have an open-ended window.
 */
export async function upsertPromoPrice(productId: string, existingPromoId: string | null, formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();

  const parsed = promoPriceSchema.safeParse({
    amount_minor_units: Number(formData.get("amount_minor_units")),
    valid_from: String(formData.get("valid_from") ?? ""),
    valid_until: String(formData.get("valid_until") ?? ""),
    access_duration_days: formData.get("access_duration_days") ? Number(formData.get("access_duration_days")) : undefined,
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) throw new Error(logAndSummarize("upsertPromoPrice", parsed.error.flatten().fieldErrors));

  const { data: regular } = await supabase
    .from("prices")
    .select("currency, access_duration_days")
    .eq("product_id", productId)
    .eq("kind", "regular")
    .maybeSingle();
  const regularRow = regular as { currency: string; access_duration_days: number | null } | null;
  const currency = regularRow?.currency ?? "AED";

  const payload = {
    product_id: productId,
    kind: "promotional" as const,
    currency,
    amount_minor_units: parsed.data.amount_minor_units,
    valid_from: new Date(parsed.data.valid_from).toISOString(),
    valid_until: new Date(parsed.data.valid_until).toISOString(),
    // Falls back to the regular price's access duration (e.g. "12 months")
    // if the admin leaves this blank, rather than silently defaulting to
    // NULL/lifetime - a promo should grant the same access length as the
    // product normally would unless explicitly overridden.
    access_duration_days: parsed.data.access_duration_days ?? regularRow?.access_duration_days ?? null,
    is_active: parsed.data.is_active,
  };

  const { error } = existingPromoId
    ? await supabase.from("prices").update(payload).eq("id", existingPromoId)
    : await supabase.from("prices").insert(payload);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/commerce");
  revalidatePath("/courses");
}

export async function deactivatePromoPrice(promoId: string): Promise<void> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("prices").update({ is_active: false }).eq("id", promoId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/commerce");
  revalidatePath("/courses");
}

/**
 * Manual entitlement grant (comped access, support fix). Looks up the
 * target user by email, then inserts/refreshes their entitlement for the
 * given product. Uses the normal RLS-bound admin client - the
 * "Admins create/update entitlements" policies (migration 019) are the
 * actual authorization boundary, requireAdmin() is the page-level gate.
 * Also ensures the matching course enrollment row, same as the free-
 * enrollment RPC, so admin-granted course access behaves identically.
 */
export async function adminGrantEntitlement(productSlug: string, formData: FormData): Promise<void> {
  const { supabase, user: adminUser } = await requireAdmin();

  const parsed = grantEntitlementSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    duration_days: formData.get("duration_days") ? Number(formData.get("duration_days")) : undefined,
  });
  if (!parsed.success) throw new Error(logAndSummarize("adminGrantEntitlement", parsed.error.flatten().fieldErrors));

  const { data: targetProfile } = await supabase.from("profiles").select("id").eq("email", parsed.data.email).maybeSingle();
  if (!targetProfile) throw new Error("No user found with that email.");
  const targetUserId = (targetProfile as { id: string }).id;

  const { data: product } = await supabase.from("products").select("id").eq("slug", productSlug).maybeSingle();
  if (!product) throw new Error("Product not found.");
  const productId = (product as { id: string }).id;

  const expiresAt = parsed.data.duration_days
    ? new Date(Date.now() + parsed.data.duration_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: existing } = await supabase
    .from("entitlements")
    .select("id")
    .eq("user_id", targetUserId)
    .eq("product_id", productId)
    .eq("status", "active")
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("entitlements")
        .update({ expires_at: expiresAt, source: "admin_grant", granted_by: adminUser.id, granted_at: new Date().toISOString() })
        .eq("id", (existing as { id: string }).id)
    : await supabase.from("entitlements").insert({
        user_id: targetUserId,
        product_id: productId,
        source: "admin_grant",
        status: "active",
        expires_at: expiresAt,
        granted_by: adminUser.id,
      });

  if (error) throw new Error(error.message);

  const { data: capRows } = await supabase.from("product_capabilities").select("capability").eq("product_id", productId);
  const courseSlugs = ((capRows ?? []) as { capability: string }[])
    .filter((r) => r.capability.startsWith("course:"))
    .map((r) => r.capability.split(":")[1]);

  for (const courseSlug of courseSlugs) {
    const { data: course } = await supabase.from("courses").select("id").eq("slug", courseSlug).maybeSingle();
    if (course) {
      // enrollments' own RLS only allows a user to insert their own row
      // (user_id = auth.uid()) - the admin is writing on someone else's
      // behalf here, so this one write deliberately uses the service-role
      // client. requireAdmin() above is the authorization boundary for
      // this whole action.
      await supabaseAdmin
        .from("enrollments")
        .upsert(
          { user_id: targetUserId, course_id: (course as { id: string }).id, status: "active" },
          { onConflict: "user_id,course_id", ignoreDuplicates: true }
        );
    }
  }

  revalidatePath("/admin/commerce");
}
