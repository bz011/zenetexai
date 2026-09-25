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
 *  - Reaching /checkout/success proves nothing by itself. reconcilePurchase()
 *    always re-fetches the Payment Intent from Ziina and only grants access
 *    when Ziina's own `status` is "completed" and the amount/currency it
 *    charged match what we told it to charge.
 *  - Writes to `purchases`/`entitlements` use supabaseAdmin (service role)
 *    because, by design (migration 019), authenticated users have no
 *    INSERT/UPDATE policy on either table - only a trusted server path may
 *    write them. Every read that decides *who* the money belongs to is
 *    re-checked against the caller's own user id in code, not left to RLS.
 *  - Idempotent: a purchase already 'completed' short-circuits without
 *    calling Ziina again or granting a second entitlement; the actual
 *    completion write is a conditional `UPDATE ... WHERE status = 'pending'`
 *    so a replayed/concurrent hit from any of the three callers below can
 *    win the race at most once.
 *
 * Stabilization sprint (payment reliability): the success page is no longer
 * the only way a purchase ever gets reconciled. reconcilePurchase() below is
 * the one authoritative function, reused by THREE independent triggers so
 * no business rule is duplicated between them:
 *   1. /checkout/success and /checkout/cancel (verifyAndFulfillZiinaPurchase
 *      wraps it with a browser-session ownership check - see that function)
 *      - fast path, best UX when the redirect back from Ziina succeeds. This
 *      is the ONLY one of the three currently live in production - see (2)
 *      and (3) below.
 *   2. The Ziina webhook (src/app/api/webhooks/ziina/route.ts) - catches the
 *      case where Ziina completes the payment but the customer's browser
 *      never makes it back to us (closed tab, crashed, flaky redirect).
 *   3. The reconciliation cron (src/app/api/cron/reconcile-purchases/route.ts)
 *      - the actual safety net: periodically re-checks any purchase still
 *      'pending' after a threshold, so a missed webhook delivery or a
 *      customer who abandons the tab before either of the above ever fires
 *      still gets fixed automatically. See that route for why this, not (1)
 *      or (2), is the mechanism this system's reliability actually rests on.
 *
 * DEFERRED (2026-09-25): (2) and (3) are fully implemented and tested but
 * intentionally NOT active in production yet - a later payment-hardening
 * phase will register the Ziina webhook and re-enable the cron schedule
 * (see docs/STABILIZATION.md, "Future payment-hardening task"). Neither
 * ZIINA_WEBHOOK_SECRET nor CRON_SECRET is required for the checkout flow
 * above to work correctly right now: both routes fail closed (503, no
 * effect on anything else) when their secret is unset, and vercel.json
 * currently has no cron entry, so Vercel never even calls (3). Until
 * activation, a purchase whose browser never returns to (1) has no other
 * path to completion - the bilingual "don't close this page" notice on
 * BuyNowButton is the interim mitigation (see docs/STABILIZATION.md).
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

  // PRODUCTION SAFETY GATE (2026-09-06 incident). While ZIINA_TEST_MODE is
  // true, Ziina's hosted checkout accepts any card input as a simulated
  // success (no real card network involved), so an ordinary visitor could
  // "pay" nothing and receive a genuine, durable entitlement - confirmed
  // live in the original incident. Restricting checkout to admin/instructor
  // during test mode lets the team validate the full flow without exposing
  // it publicly.
  //
  // Deliberately kept as a live conditional rather than deleted now that
  // Ziina has gone live (ZIINA_TEST_MODE = false, 2026-09-06): it is
  // already inert for ordinary students today, since the condition starts
  // with `ZIINA_TEST_MODE &&`, and it automatically re-arms itself with no
  // further code change if this constant is ever flipped back to `true`
  // for a future controlled test cycle. verifyAndFulfillZiinaPurchase()'s
  // separate, row-driven `is_test_payment` check below is the one that
  // actually protects real money - this gate only ever controlled who
  // could *start* a test-mode checkout.
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
 * The one authoritative place any code path (the success/cancel pages, the
 * Ziina webhook, and the stale-purchase reconciliation job) reconciles a
 * purchase against Ziina's real state and grants access. Never trusts
 * anything about the purchase's status except what is re-derived here on
 * every call: the browser landing on a "success" URL, a webhook payload
 * claiming "completed", and a cron sweep noticing an old "pending" row are
 * all just DIFFERENT REASONS to run the exact same check - none of them by
 * itself is evidence of payment. No caller-supplied user id is accepted
 * here on purpose: this function's only input is our own purchase id, and
 * who it belongs to is read from the purchase row itself, never asserted
 * by whichever caller happened to trigger reconciliation (the webhook and
 * cron job have no "current user" at all - see verifyAndFulfillZiinaPurchase
 * below for the one caller that does, and where that identity is actually
 * checked).
 */
export async function reconcilePurchase(purchaseId: string): Promise<CheckoutVerificationResult> {
  const { data: purchaseData, error } = await supabaseAdmin
    .from("purchases")
    .select("id, user_id, product_id, price_id, status, amount_minor_units, currency, provider_reference, is_test_payment")
    .eq("id", purchaseId)
    .maybeSingle();

  if (error || !purchaseData) return { status: "not_found" };
  const purchase = purchaseData as PurchaseRow;

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

/**
 * Called from /checkout/success and /checkout/cancel with the same purchase
 * id - which URL the browser landed on is only a UI hint; the actual grant
 * decision always comes from reconcilePurchase() above, never from which
 * page the request is on. This wrapper adds exactly one thing
 * reconcilePurchase() cannot do itself: confirming the browser session
 * asking about this purchase is actually the one it belongs to, BEFORE
 * doing any Ziina call or returning any status/expiry - a lightweight,
 * separate lookup so a logged-in user who is handed (or guesses) someone
 * else's ?purchase_id= can never trigger reconciliation of, or learn
 * anything about, a purchase that isn't theirs. The webhook and
 * reconciliation job call reconcilePurchase() directly instead, since
 * neither has (or should trust) a browser session to check against.
 */
export async function verifyAndFulfillZiinaPurchase(purchaseId: string, userId: string): Promise<CheckoutVerificationResult> {
  const { data: ownerRow, error } = await supabaseAdmin.from("purchases").select("user_id").eq("id", purchaseId).maybeSingle();

  if (error || !ownerRow) return { status: "not_found" };
  if ((ownerRow as { user_id: string }).user_id !== userId) return { status: "forbidden" };

  return reconcilePurchase(purchaseId);
}
