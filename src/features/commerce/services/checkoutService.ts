"use server";

/**
 * Ziina checkout for paid products (currently: PMP Exam Simulator, AED 350,
 * granting practice:pmp + mock_exam:pmp for 12 months). Built on the same
 * products/prices/purchases/entitlements tables as the free-enrollment path
 * (migration 019) - no parallel commerce schema.
 *
 * Security model (see CRITICAL SECURITY RULES the caller was given):
 *  - The client sends only a product slug / a purchase id it was handed by
 *    us. It never sends an amount, currency, or "paid" claim - the price is
 *    always re-resolved here from `prices`, server-side.
 *  - Reaching /checkout/success proves nothing by itself. Both the success
 *    and cancel pages call verifyAndFulfillZiinaPurchase(), which always
 *    re-fetches the Payment Intent from Ziina and only grants access when
 *    Ziina's own `status` is "completed" and the amount/currency it charged
 *    match what we told it to charge.
 *  - Writes to `purchases`/`entitlements` use supabaseAdmin (service role)
 *    because, by design (migration 019), authenticated users have no
 *    INSERT/UPDATE policy on either table - only a trusted server path may
 *    write them. Every read that decides *who* the money belongs to is
 *    re-checked against the caller's own user id in code, not left to RLS.
 *  - Idempotent: a purchase already 'completed' short-circuits without
 *    calling Ziina again or granting a second entitlement; the actual
 *    completion write is a conditional `UPDATE ... WHERE status = 'pending'`
 *    so a replayed/concurrent success-page hit can win the race at most once.
 */

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveEffectivePriceRow } from "./productService";
import { createZiinaPaymentIntent, getZiinaPaymentIntent, ZIINA_TEST_MODE, type ZiinaPaymentIntentStatus } from "./ziinaClient";
import type { Price } from "@/features/commerce/types/commerce";
import { checkRateLimit, getHashedClientIp } from "@/lib/upstashRateLimit";

const PRICE_COLUMNS = "id, product_id, kind, currency, amount_minor_units, access_duration_days, valid_from, valid_until, is_active";

export interface StartCheckoutResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

function appUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_APP_URL");
  return url.replace(/\/$/, "");
}

export async function startZiinaCheckout(productSlug: string): Promise<StartCheckoutResult> {
  const { supabase, user, profile } = await requireProfile({ loginRedirectTo: `/courses/${productSlug}` });

  // Checked BEFORE any product/entitlement lookup, purchase row, or Ziina
  // call - a rejected request here creates zero DB state and never reaches
  // Ziina. Per-user AND per-IP: per-user stops one account hammering
  // Start Checkout; per-IP (looser) stops one IP cycling through many
  // accounts to do the same. See src/lib/upstashRateLimit.ts for the
  // fail-open-with-warning behavior when Upstash isn't configured.
  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit("checkout-create", user.id),
    checkRateLimit("checkout-create-ip", getHashedClientIp()),
  ]);
  if (!userLimit.allowed || !ipLimit.allowed) {
    return { success: false, error: "rate_limited" };
  }

  // PRODUCTION SAFETY GATE (2026-09-06 incident): Ziina remains in test
  // mode (ZIINA_TEST_MODE, ziinaClient.ts) - its hosted checkout accepts
  // any card input as a simulated success, since it's not talking to a
  // real card network. That's fine for controlled testing, but with real
  // public signups on production, it means ANY ordinary visitor could
  // "pay" nothing at all and receive a genuine, durable practice:pmp +
  // mock_exam:pmp entitlement - confirmed live when an admin's own test
  // checkout completed and unlocked the Simulator for that account.
  // verifyAndFulfillZiinaPurchase() was never the problem (it already
  // never trusts anything but Ziina's own verified status/amount/
  // currency) - the gap is that checkout was reachable by anyone at all
  // while test mode is active. Restricting it to admin/instructor lets
  // the team keep validating the full flow end-to-end without exposing
  // it publicly. Remove this block only as part of a deliberate,
  // explicit decision to go live (i.e. when ZIINA_TEST_MODE is flipped
  // to false and Ziina is genuinely configured for real payments).
  if (ZIINA_TEST_MODE && profile?.role !== "admin" && profile?.role !== "instructor") {
    return { success: false, error: "checkout_unavailable" };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, is_active, is_published")
    .eq("slug", productSlug)
    .maybeSingle();

  if (!product || !(product as { is_active: boolean }).is_active || !(product as { is_published: boolean }).is_published) {
    return { success: false, error: "product_unavailable" };
  }
  const productId = (product as { id: string }).id;

  // Never let a user pay twice for a product they already actively hold.
  const { data: existingEntitlement } = await supabase
    .from("entitlements")
    .select("id, expires_at")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("status", "active")
    .maybeSingle();

  if (existingEntitlement) {
    const row = existingEntitlement as { expires_at: string | null };
    if (!row.expires_at || new Date(row.expires_at) > new Date()) {
      return { success: false, error: "already_owned" };
    }
  }

  const { data: priceRows } = await supabase.from("prices").select(PRICE_COLUMNS).eq("product_id", productId);
  const priceRow = resolveEffectivePriceRow((priceRows ?? []) as Price[]);

  // A free (AED 0) effective price means this product should go through
  // grant_free_enrollment(), not Ziina - never start a paid checkout for it.
  if (!priceRow || priceRow.amount_minor_units <= 0) {
    return { success: false, error: "not_payable" };
  }

  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from("purchases")
    .insert({
      user_id: user.id,
      product_id: productId,
      price_id: priceRow.id,
      provider: "ziina",
      status: "pending",
      amount_minor_units: priceRow.amount_minor_units,
      currency: priceRow.currency,
      is_test_payment: ZIINA_TEST_MODE,
    })
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    console.error("[checkoutService] failed to create purchase row:", purchaseError?.message);
    return { success: false, error: "checkout_unavailable" };
  }
  const purchaseId = (purchase as { id: string }).id;

  const base = appUrl();
  let intent;
  try {
    intent = await createZiinaPaymentIntent({
      amountMinorUnits: priceRow.amount_minor_units,
      currencyCode: priceRow.currency,
      successUrl: `${base}/checkout/success?purchase_id=${purchaseId}`,
      cancelUrl: `${base}/checkout/cancel?purchase_id=${purchaseId}`,
      // Single source of truth - see ZIINA_TEST_MODE in ziinaClient.ts.
      // Do not hardcode `true` here separately from that constant again.
      test: ZIINA_TEST_MODE,
    });
  } catch (err) {
    console.error("[checkoutService] Ziina create payment intent failed:", err instanceof Error ? err.message : String(err));
    await supabaseAdmin.from("purchases").update({ status: "failed" }).eq("id", purchaseId);
    return { success: false, error: "checkout_unavailable" };
  }

  await supabaseAdmin.from("purchases").update({ provider_reference: intent.id }).eq("id", purchaseId);

  return { success: true, redirectUrl: intent.redirect_url };
}

export type CheckoutVerificationStatus = "completed" | "pending" | "failed" | "cancelled" | "not_found" | "forbidden";

export interface CheckoutVerificationResult {
  status: CheckoutVerificationStatus;
  expiresAt?: string | null;
  productSlug?: string | null;
}

/** Ziina's terminal-negative statuses (its own spelling, "canceled") mapped
 * to this app's `purchases.status` values ("cancelled" - the check
 * constraint in migration 019 uses the British spelling). */
const ZIINA_TO_LOCAL_TERMINAL: Partial<Record<ZiinaPaymentIntentStatus, "failed" | "cancelled">> = {
  failed: "failed",
  canceled: "cancelled",
};

interface PurchaseRow {
  id: string;
  user_id: string;
  product_id: string;
  price_id: string;
  status: string;
  amount_minor_units: number;
  currency: string;
  provider_reference: string | null;
  is_test_payment: boolean;
}

const STAFF_ROLES_ALLOWED_TO_HOLD_TEST_ENTITLEMENTS = new Set(["admin", "instructor"]);

async function getProductSlug(productId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("products").select("slug").eq("id", productId).maybeSingle();
  return (data as { slug: string } | null)?.slug ?? null;
}

async function getProfileRole(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).maybeSingle();
  return (data as { role: string } | null)?.role ?? null;
}

async function getActiveEntitlementExpiry(userId: string, productId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("entitlements")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("status", "active")
    .maybeSingle();
  return (data as { expires_at: string | null } | null)?.expires_at ?? null;
}

/**
 * Called from both /checkout/success and /checkout/cancel with the same
 * purchase id - which URL the browser landed on is only a UI hint; the
 * actual grant decision always comes from Ziina's live status, never from
 * which page the request is on.
 */
export async function verifyAndFulfillZiinaPurchase(purchaseId: string, userId: string): Promise<CheckoutVerificationResult> {
  const { data: purchaseData, error } = await supabaseAdmin
    .from("purchases")
    .select("id, user_id, product_id, price_id, status, amount_minor_units, currency, provider_reference, is_test_payment")
    .eq("id", purchaseId)
    .maybeSingle();

  if (error || !purchaseData) return { status: "not_found" };
  const purchase = purchaseData as PurchaseRow;

  if (purchase.user_id !== userId) return { status: "forbidden" };

  const productSlug = await getProductSlug(purchase.product_id);

  // PRODUCTION SAFETY GATE, fulfillment boundary (2026-09-06 incident,
  // defense-in-depth alongside the checkout-creation gate above): decided
  // from THIS PURCHASE ROW's own is_test_payment flag, never from the
  // current ZIINA_TEST_MODE constant - a purchase created while test mode
  // was active must always be treated as a test purchase for its own
  // fulfillment, even if the constant is later flipped for live payments;
  // conversely a genuinely live purchase (is_test_payment = false) is
  // never subject to this check, regardless of what the constant says at
  // verification time. The checkout-creation gate stops an ordinary user
  // from STARTING a new test checkout, but an old pending purchase or a
  // stale success-URL created before that fix shipped could still reach
  // this function directly - so the same rule is enforced here too,
  // independent of and in addition to the creation-time gate.
  //
  // Deliberately checked BEFORE any status branching below and without
  // ever inspecting Ziina for this case: a test payment's owner without a
  // staff role can never end up with a granted entitlement no matter what
  // Ziina reports, and repeating this call changes nothing (the role is
  // re-checked fresh every time, and is_test_payment never changes after
  // the row is created) - so replay/retry cannot bypass it. The purchase
  // row itself is never modified here - whatever Ziina did or didn't do
  // stays exactly as history/audit trail; only entitlement-granting is
  // blocked. Returns the same generic "failed" a real declined payment
  // would - never a distinct status, never any role/security detail.
  if (purchase.is_test_payment) {
    const ownerRole = await getProfileRole(purchase.user_id);
    if (!ownerRole || !STAFF_ROLES_ALLOWED_TO_HOLD_TEST_ENTITLEMENTS.has(ownerRole)) {
      return { status: "failed", productSlug };
    }
  }

  if (purchase.status === "completed") {
    const expiresAt = await getActiveEntitlementExpiry(purchase.user_id, purchase.product_id);
    return { status: "completed", expiresAt, productSlug };
  }
  if (purchase.status === "failed") return { status: "failed", productSlug };
  if (purchase.status === "cancelled") return { status: "cancelled", productSlug };

  // status === "pending" from here.
  if (!purchase.provider_reference) {
    return { status: "pending", productSlug };
  }

  let intent;
  try {
    intent = await getZiinaPaymentIntent(purchase.provider_reference);
  } catch (err) {
    console.error("[checkoutService] Ziina verification call failed:", err instanceof Error ? err.message : String(err));
    return { status: "pending", productSlug };
  }

  const terminal = ZIINA_TO_LOCAL_TERMINAL[intent.status];
  if (terminal) {
    await supabaseAdmin.from("purchases").update({ status: terminal }).eq("id", purchase.id).eq("status", "pending");
    return { status: terminal, productSlug };
  }

  if (intent.status !== "completed") {
    // requires_payment_instrument / requires_user_action / pending
    return { status: "pending", productSlug };
  }

  if (intent.amount !== purchase.amount_minor_units || intent.currency_code !== purchase.currency) {
    console.error("[checkoutService] Ziina amount/currency mismatch for purchase", purchase.id);
    await supabaseAdmin.from("purchases").update({ status: "failed" }).eq("id", purchase.id).eq("status", "pending");
    return { status: "failed", productSlug };
  }

  // Atomically claim fulfillment: only the request that actually flips
  // pending -> completed grants the entitlement, so a replayed or
  // concurrent hit on this success/cancel URL can never double-grant.
  const { data: claimed } = await supabaseAdmin
    .from("purchases")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", purchase.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!claimed) {
    // Lost the race - another concurrent request already completed this
    // purchase and granted the entitlement.
    const expiresAt = await getActiveEntitlementExpiry(purchase.user_id, purchase.product_id);
    return { status: "completed", expiresAt, productSlug };
  }

  const { data: priceRowData } = await supabaseAdmin
    .from("prices")
    .select("access_duration_days")
    .eq("id", purchase.price_id)
    .maybeSingle();
  const accessDurationDays = (priceRowData as { access_duration_days: number | null } | null)?.access_duration_days ?? null;

  const expiresAt = accessDurationDays ? new Date(Date.now() + accessDurationDays * 24 * 60 * 60 * 1000).toISOString() : null;

  const { data: insertedEntitlement, error: entError } = await supabaseAdmin
    .from("entitlements")
    .insert({
      user_id: purchase.user_id,
      product_id: purchase.product_id,
      source: "purchase",
      purchase_id: purchase.id,
      status: "active",
      expires_at: expiresAt,
    })
    .select("expires_at")
    .single();

  if (entError || !insertedEntitlement) {
    // Most likely the active-entitlement-per-product unique index: the
    // user already holds this product some other way. The purchase is
    // genuinely paid and stays 'completed' regardless - never fail a real
    // payment over this.
    console.error("[checkoutService] entitlement insert failed after payment:", entError?.message);
    const expiresAtFallback = await getActiveEntitlementExpiry(purchase.user_id, purchase.product_id);
    return { status: "completed", expiresAt: expiresAtFallback, productSlug };
  }

  revalidatePath("/dashboard");
  revalidatePath("/pmp/practice");
  revalidatePath("/pmp/mock-exam");

  return { status: "completed", expiresAt: (insertedEntitlement as { expires_at: string | null }).expires_at, productSlug };
}
