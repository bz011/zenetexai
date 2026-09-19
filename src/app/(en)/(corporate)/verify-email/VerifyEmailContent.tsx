"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { resendVerificationEmail } from "@/features/auth/services/authService";
import { mapAuthError } from "@/lib/auth/authErrors";

function VerifyEmailInner() {
  const { t } = useLang();
  const v = t.auth.verifyEmail;
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!email) return;
    setStatus("sending");
    setError(null);
    const res = await resendVerificationEmail(email);
    if (res.success) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(mapAuthError(res.error, t));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[120px]" />

      <div className="relative w-full max-w-sm text-center">
        <Link href="/" className="text-[18px] font-bold text-white">
          ZENTEX<span className="text-indigo-400">AI</span>
        </Link>

        <div className="card mt-8 p-7">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="mt-5 text-lg font-semibold text-white">{v.title}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-400">
            {email ? `${v.sub} ${email}${v.sub_after_email}` : v.sub_generic}
          </p>

          {status === "sent" && (
            <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-[13px] text-emerald-400">
              {v.resend_success}
            </p>
          )}
          {status === "error" && error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-400">
              {error}
            </p>
          )}

          <Link href="/login" className="btn-primary mt-6 block w-full py-2.5 text-center text-[13px]">
            {v.back_to_login}
          </Link>

          {email && (
            <button
              onClick={handleResend}
              disabled={status === "sending"}
              className="btn-ghost mt-3 w-full py-2.5 text-[13px]"
            >
              {status === "sending" ? v.resend_loading : v.resend_btn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Matches VerifyEmailInner's own outer wrapper/card dimensions rather than
 * `null` - see the identical fix/rationale in LoginContent.tsx (a `null`
 * fallback here causes the same class of CLS regression, the whole
 * min-h-screen block popping in from nothing once useSearchParams()
 * resolves). Purely a loading placeholder - no behavior change.
 */
function VerifyEmailSkeleton() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      <div className="w-full max-w-sm animate-pulse text-center">
        <div className="mx-auto h-[22px] w-32 rounded bg-white/[0.06]" />
        <div className="card mt-8 space-y-3 p-7">
          <div className="mx-auto h-14 w-14 rounded-full bg-white/[0.05]" />
          <div className="mx-auto mt-2 h-[18px] w-48 rounded bg-white/[0.06]" />
          <div className="mx-auto h-[14px] w-56 rounded bg-white/[0.04]" />
          <div className="mt-6 h-[38px] rounded-xl bg-white/[0.05]" />
          <div className="mt-3 h-[38px] rounded-xl bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailContent() {
  return (
    <Suspense fallback={<VerifyEmailSkeleton />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
