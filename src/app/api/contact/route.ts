/**
 * Same-origin contact-form submission proxy.
 *
 * WHY THIS EXISTS: the contact form used to POST directly from the browser
 * to a Google Apps Script URL. The production CSP's connect-src is
 * `'self' blob: <supabase-url>` - it does not, and per the Security
 * Remediation Sprint's own posture should not, list script.google.com, so
 * every one of those browser-side requests was silently blocked (confirmed
 * live: a CSP violation on script.google.com, not a network failure).
 * ZentexAI Pre-Implementation Master Audit, 2026-09-30 first raised this as
 * a P0. This route restores a working submission path without widening the
 * CSP: the browser now only ever talks to this same-origin route, which
 * forwards server-side, where CSP does not apply.
 *
 * The destination URL is intentionally not exported or referenced from any
 * client-bundled file - it never needs to be known to the browser at all
 * once submission happens through this route.
 */

import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validators/contactValidators";
import { checkRateLimit, getHashedClientIp } from "@/lib/upstashRateLimit";

// Same Google Apps Script destination the client used to call directly -
// unchanged behavior for the business's existing spreadsheet/inbox side,
// only the transport moved server-side.
const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbw_XdWko2zRiJ084YgzxJZq3ftxBZCxuDYpmRdu8WFHdNt3QVIfcjU18vsTQ4CRXuBE/exec";

// Bounds worst-case time spent waiting on a slow/hanging upstream Apps
// Script execution, so one stuck request can't tie up the function.
const UPSTREAM_TIMEOUT_MS = 10_000;

export async function POST(request: Request) {
  const limit = await checkRateLimit("contact-form-ip", getHashedClientIp());
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "rate_limited" },
      { status: 429, headers: limit.retryAfterSeconds ? { "Retry-After": String(limit.retryAfterSeconds) } : undefined }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "invalid_input" }, { status: 400 });
  }
  const { name, email, company, inquiryType, message } = parsed.data;

  // Same field shape the Apps Script has always received from the old
  // direct-from-browser submission - only the sender changed.
  const params = new URLSearchParams();
  params.append("name", name);
  params.append("email", email);
  params.append("company", company);
  params.append("inquiryType", inquiryType);
  params.append("message", message);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let upstreamOk: boolean;
    try {
      const upstream = await fetch(WEBHOOK_URL, { method: "POST", body: params, signal: controller.signal });
      upstreamOk = upstream.ok;
    } finally {
      clearTimeout(timeout);
    }

    if (!upstreamOk) {
      // No name/email/message logged - inquiryType alone identifies the
      // failure class without recording the inquiry's actual content.
      console.error(`[contact] upstream rejected submission (inquiryType=${inquiryType})`);
      return NextResponse.json({ success: false, error: "upstream_error" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[contact] failed to reach upstream (inquiryType=${inquiryType}):`, errorMessage);
    return NextResponse.json({ success: false, error: "upstream_error" }, { status: 502 });
  }
}
