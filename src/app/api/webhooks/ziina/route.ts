/**
 * Ziina payment webhook receiver.
 *
 * DEFERRED (2026-09-25): implemented and tested, but NOT registered with
 * Ziina in production yet - intentionally deferred to a later payment-
 * hardening phase (see docs/STABILIZATION.md, "Future payment-hardening
 * task"). Until that webhook is registered, Ziina will never actually call
 * this route, and this route's own ZIINA_WEBHOOK_SECRET check fails closed
 * (503) if invoked without it configured - so its absence cannot break or
 * block the live checkout flow (checkoutService.ts's success/cancel path).
 *
 * Per Ziina's official docs (docs.ziina.com/api-reference/webhook): a webhook
 * URL + secret is registered once via POST /webhook (a manual, one-time owner
 * action in the Ziina dashboard/API - not something this app does at
 * runtime), Ziina POSTs `{ event, data }` here on payment/refund status
 * changes, signs the raw request body with HMAC-SHA256 (hex digest) using
 * that secret in the `X-Hmac-Signature` header, and retries delivery up to
 * 3 times on any non-2xx response - so this handler MUST tolerate duplicate
 * and out-of-order delivery.
 *
 * This route is deliberately "dumb": once the signature is verified, it does
 * not trust anything else about the payload (status, amount, currency) - it
 * only uses `data.id` to identify WHICH purchase to re-check, then hands off
 * to reconcilePurchase(), the same authoritative function the success page
 * and the reconciliation cron use. That function always re-fetches the
 * Payment Intent from Ziina's own API before deciding anything, so a forged
 * (but signature-valid - impossible without the secret) or stale payload
 * can never itself grant an entitlement.
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { reconcilePurchase } from "@/features/commerce/services/checkoutService";

function isValidSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(signatureHeader, "hex");
  // Different lengths would make timingSafeEqual throw rather than return
  // false - an obviously-wrong-length header is just an invalid signature.
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export async function POST(request: Request) {
  const secret = process.env.ZIINA_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[ziina webhook] ZIINA_WEBHOOK_SECRET is not configured - rejecting delivery");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  // Signature is computed over the exact raw bytes Ziina sent - must read as
  // text, never request.json() first (that would re-serialize and break
  // verification against a differently-formatted byte stream).
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hmac-signature");
  if (!signatureHeader || !isValidSignature(rawBody, signatureHeader, secret)) {
    console.error("[ziina webhook] rejected delivery with missing or invalid signature");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[ziina webhook] rejected delivery with malformed JSON body");
    return NextResponse.json({ error: "malformed_payload" }, { status: 400 });
  }

  const event = (payload as { event?: unknown } | null)?.event;
  const intentId = (payload as { data?: { id?: unknown } } | null)?.data?.id;

  if (event !== "payment_intent.status.updated" || typeof intentId !== "string" || intentId.length === 0) {
    // Not an error: Ziina also sends refund.status.updated and possibly
    // future event types this app doesn't act on. Acknowledge with 2xx so
    // Ziina doesn't burn its 3 retries on an event we intentionally ignore.
    return NextResponse.json({ received: true, ignored: true });
  }

  const { data: purchaseRow } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("provider", "ziina")
    .eq("provider_reference", intentId)
    .maybeSingle();

  if (!purchaseRow) {
    // We can never resolve this event by retrying - acknowledge rather than
    // asking Ziina to keep re-sending it.
    console.error("[ziina webhook] no purchase found for provider_reference", intentId);
    return NextResponse.json({ received: true, matched: false });
  }

  // Idempotent by construction: reconcilePurchase() short-circuits on an
  // already-completed/failed/cancelled purchase, and its own pending ->
  // completed transition is an atomic compare-and-swap - so duplicate or
  // out-of-order webhook deliveries for the same purchase are automatically
  // safe with no extra dedup bookkeeping here.
  const result = await reconcilePurchase((purchaseRow as { id: string }).id);
  return NextResponse.json({ received: true, status: result.status });
}
