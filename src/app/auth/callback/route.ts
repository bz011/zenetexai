/**
 * Supabase email-link callback.
 *
 * Both the signup-confirmation link and the password-recovery link point
 * here (see emailRedirectTo / redirectTo in authService.ts). Exchanges the
 * `code` param for a session, then redirects to `next` (defaults to
 * /dashboard for signup confirmation, /reset-password for recovery).
 */

import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resolveSafeRedirect } from "@/lib/auth/safeRedirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = resolveSafeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
