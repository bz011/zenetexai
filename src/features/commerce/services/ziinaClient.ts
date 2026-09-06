/**
 * Minimal server-only client for Ziina's Payment Intent API.
 *
 * Base URL, auth header format, request fields, and the full `status` enum
 * below all come directly from Ziina's own OpenAPI spec
 * (docs.ziina.com/api-reference/payment-service-openapi.json), confirmed
 * live against the real API with ZIINA_API_KEY in test mode - nothing here
 * is guessed. Amounts are in fils (AED minor units), matching this app's
 * `amount_minor_units` columns exactly, so no conversion happens here.
 *
 * ZIINA_API_KEY is read lazily (first call, not module import time - same
 * reasoning as src/lib/supabase/admin.ts) and is NEVER logged, returned to
 * a caller, or embedded in a thrown error message.
 */

const ZIINA_API_BASE = "https://api-v2.ziina.com/api";

/**
 * Single source of truth for whether this deployment is running Ziina in
 * test mode. Every caller that needs to know ("should checkout be
 * restricted to staff while test mode is active?", "should this purchase
 * row be flagged as a test transaction?") imports THIS constant rather
 * than hardcoding `true` in more than one place - see checkoutService.ts.
 * Flip to `false` only once Ziina is genuinely configured for live
 * payments (a real merchant/live API key, live webhook/verification
 * config, and an explicit decision to accept real charges) - never as a
 * side effect of an unrelated change.
 */
export const ZIINA_TEST_MODE = true;

export type ZiinaPaymentIntentStatus =
  | "requires_payment_instrument"
  | "requires_user_action"
  | "pending"
  | "completed"
  | "failed"
  | "canceled";

export interface ZiinaPaymentIntent {
  id: string;
  amount: number;
  currency_code: string;
  status: ZiinaPaymentIntentStatus;
  redirect_url: string;
  success_url: string | null;
  cancel_url: string | null;
}

function getApiKey(): string {
  const key = process.env.ZIINA_API_KEY;
  if (!key) throw new Error("Missing ZIINA_API_KEY");
  return key;
}

interface CreateIntentParams {
  amountMinorUnits: number;
  currencyCode: string;
  successUrl: string;
  cancelUrl: string;
  /** Ziina test mode - simulates a payment without moving real money. */
  test: boolean;
}

export async function createZiinaPaymentIntent(params: CreateIntentParams): Promise<ZiinaPaymentIntent> {
  const res = await fetch(`${ZIINA_API_BASE}/payment_intent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountMinorUnits,
      currency_code: params.currencyCode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      test: params.test,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ziina create payment intent failed: HTTP ${res.status}`);
  }

  return (await res.json()) as ZiinaPaymentIntent;
}

export async function getZiinaPaymentIntent(id: string): Promise<ZiinaPaymentIntent> {
  const res = await fetch(`${ZIINA_API_BASE}/payment_intent/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!res.ok) {
    throw new Error(`Ziina get payment intent failed: HTTP ${res.status}`);
  }

  return (await res.json()) as ZiinaPaymentIntent;
}
