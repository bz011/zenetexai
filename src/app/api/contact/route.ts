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
import { z } from "zod";
import { contactSchema } from "@/lib/validators/contactValidators";
import { checkRateLimit, getHashedClientIp } from "@/lib/upstashRateLimit";

// Same Google Apps Script destination the client used to call directly -
// unchanged behavior for the business's existing spreadsheet/inbox side,
// only the transport moved server-side.
const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbw_XdWko2zRiJ084YgzxJZq3ftxBZCxuDYpmRdu8WFHdNt3QVIfcjU18vsTQ4CRXuBE/exec";

// Bounds worst-case time spent waiting on a slow/hanging upstream Apps
// Script execution, so one stuck request can't tie up the function.
// Apps Script can take a few seconds to start, then saves the row and sends
// the email under a lock. A timeout after the row was saved is safe: the
// visitor's retry reuses the submissionId and no second row is written.
const UPSTREAM_TIMEOUT_MS = 15_000;
export const maxDuration = 25;

// The live project's production domains. VERCEL_PROJECT_PRODUCTION_URL is set
// by Vercel per project (no protocol), so another project - including
// zentexai-staging - never matches, whatever its VERCEL_ENV.
const LIVE_PRODUCTION_HOSTS = new Set(["zentexai.com", "www.zentexai.com"]);

function isLiveProduction(): boolean {
  return (
    process.env.VERCEL_ENV === "production" &&
    LIVE_PRODUCTION_HOSTS.has((process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").toLowerCase())
  );
}

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
  const submissionId = parsed.data.submissionId ?? crypto.randomUUID();

  // Same field shape the Apps Script has always received from the old
  // direct-from-browser submission, plus the id it uses to de-duplicate retries.
  const params = new URLSearchParams();
  params.append("name", name);
  params.append("email", email);
  params.append("company", company);
  params.append("inquiryType", inquiryType);
  params.append("message", message);
  params.append("submissionId", submissionId);

  // Real enquiries are forwarded only from the live ZentexAI project's
  // Production deployment. Local dev/start, tests, Vercel Preview, and the
  // separate staging project (whose own production builds also have
  // VERCEL_ENV "production") stop here, so they can never reach the
  // business's real Apps Script inbox/spreadsheet.
  if (!isLiveProduction()) {
    return NextResponse.json({ success: false, error: "contact_disabled" }, { status: 503 });
  }

  let upstream: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    upstream = await fetch(WEBHOOK_URL, { method: "POST", body: params, signal: controller.signal });
  } catch (error: unknown) {
    clearTimeout(timeout);
    const errorName = error instanceof Error ? error.name : "unknown";
    console.error(`[contact] failed to reach upstream (inquiryType=${inquiryType}, error=${errorName})`);
    return NextResponse.json({ success: false, error: "upstream_error" }, { status: 502 });
  }

  // HTTP 200 alone proves nothing: Apps Script answers 200 for its own error
  // pages and sign-in redirects too. Only the script's JSON verdict counts.
  let result: ScriptResult | null = null;
  try {
    result = upstream.ok ? parseScriptResult(await upstream.text()) : null;
  } catch {
    result = null;
  } finally {
    clearTimeout(timeout);
  }

  // Only the HTTP status, content type, the script's short error code and the
  // enquiry type are logged, never the enquirer's name, email or message.
  if (!result) {
    const contentType = (upstream.headers?.get("content-type") ?? "none").split(";")[0];
    console.error(`[contact] unconfirmed upstream response (status=${upstream.status}, type=${contentType}, inquiryType=${inquiryType})`);
    return NextResponse.json({ success: false, error: "upstream_error" }, { status: 502 });
  }
  if (!result.saved) {
    console.error(`[contact] enquiry not saved (code=${safeCode(result.error)}, inquiryType=${inquiryType})`);
    return NextResponse.json({ success: false, error: "upstream_error" }, { status: 502 });
  }
  if (!result.emailed) {
    // Saved but the team was not notified: never reported as success. A retry
    // with the same submissionId re-attempts only the email, without a second row.
    console.error(`[contact] enquiry saved but notification failed (code=${safeCode(result.error)}, inquiryType=${inquiryType})`);
    return NextResponse.json({ success: false, error: "notification_failed" }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}

const scriptResultSchema = z.object({
  ok: z.boolean(),
  saved: z.boolean(),
  emailed: z.boolean(),
  duplicate: z.boolean().optional(),
  error: z.string().nullable().optional(),
});
type ScriptResult = z.infer<typeof scriptResultSchema>;

const MAX_UPSTREAM_BODY = 4096;

/** The script's verdict, or null when the body is not the JSON it promises. */
function parseScriptResult(body: string): ScriptResult | null {
  if (body.length > MAX_UPSTREAM_BODY) return null;
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return null;
  }
  const parsed = scriptResultSchema.safeParse(json);
  if (!parsed.success) return null;
  // A self-contradicting answer ("ok" without both steps done) is not trusted.
  if (parsed.data.ok !== (parsed.data.saved && parsed.data.emailed)) return null;
  return parsed.data;
}

function safeCode(code: string | null | undefined): string {
  return code && /^[a-z_]{1,40}$/.test(code) ? code : "unknown";
}
