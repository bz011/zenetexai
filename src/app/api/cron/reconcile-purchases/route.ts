/**
 * Stale-purchase reconciliation sweep - the actual reliability backstop for
 * Ziina payments (see checkoutService.ts's file header for the full
 * three-caller architecture). Catches whatever the success-page redirect and
 * the Ziina webhook both miss: a customer whose browser never returns AND
 * whose webhook delivery was delayed, dropped, or never configured.
 *
 * DEFERRED (2026-09-25): implemented and tested, but not yet scheduled in
 * production - vercel.json currently has no cron entry for this route, and
 * this route's own CRON_SECRET check fails closed (503) if invoked without
 * it configured, so its absence cannot break or block the live checkout
 * flow. Re-adding the cron entry (and setting CRON_SECRET) is part of a
 * later payment-hardening phase (see docs/STABILIZATION.md, "Future
 * payment-hardening task").
 *
 * Protected by a bearer secret (CRON_SECRET) rather than the webhook's HMAC
 * scheme, since this endpoint is meant to be invoked by our own scheduler
 * (see vercel.json, once re-added), not by Ziina.
 *
 * Safe to invoke concurrently or more than once for the same stale purchase:
 * every purchase is reconciled through reconcilePurchase(), whose pending ->
 * completed transition is an atomic compare-and-swap, so two overlapping
 * sweeps (or a sweep racing the webhook) can never double-grant.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { reconcilePurchase } from "@/features/commerce/services/checkoutService";

// Gives the success-page redirect and the webhook a fair chance to land
// first - this job exists for the cases where neither one ever fires, not
// to race them.
const STALE_THRESHOLD_MINUTES = 30;

// Bounds worst-case run time/Ziina API load per invocation. Any purchase
// still pending after this run stays pending and is picked up next run.
const MAX_PURCHASES_PER_RUN = 200;

interface StalePurchaseRow {
  id: string;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[reconcile-purchases] CRON_SECRET is not configured - refusing to run");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();
  const { data: staleRows, error } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("provider", "ziina")
    .eq("status", "pending")
    .not("provider_reference", "is", null)
    .lt("created_at", staleBefore)
    .limit(MAX_PURCHASES_PER_RUN);

  if (error) {
    console.error("[reconcile-purchases] failed to query stale purchases:", error.message);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const rows = (staleRows ?? []) as StalePurchaseRow[];
  const settled = await Promise.allSettled(rows.map((row) => reconcilePurchase(row.id)));

  const summary = { checked: rows.length, completed: 0, pending: 0, failed: 0, cancelled: 0, errors: 0 };
  for (const outcome of settled) {
    if (outcome.status === "rejected") {
      summary.errors += 1;
      console.error("[reconcile-purchases] reconcilePurchase threw:", outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason));
      continue;
    }
    switch (outcome.value.status) {
      case "completed":
        summary.completed += 1;
        break;
      case "pending":
        summary.pending += 1;
        break;
      case "failed":
        summary.failed += 1;
        break;
      case "cancelled":
        summary.cancelled += 1;
        break;
      default:
        break;
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}
