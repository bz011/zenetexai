"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { resetPassword } from "@/features/auth/services/authService";
import { forgotPasswordSchema, fieldErrorsFrom } from "@/lib/validators/authValidators";
import { mapAuthError, mapValidationError } from "@/lib/auth/authErrors";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

export default function ForgotPasswordContent() {
  const { t } = useLang();
  const fp = t.auth.forgotPassword;

  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const res = await resetPassword(email);
    setLoading(false);

    if (!res.success) {
      setFormError(mapAuthError(res.error, t));
      return;
    }

    setSent(true);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[18px] font-bold text-white">
            ZENTEX<span className="text-indigo-400">AI</span>
          </Link>
          <p className="mt-2 text-[14px] text-slate-500">{fp.tagline}</p>
        </div>

        <div className="card p-7">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">{fp.success_title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{fp.success_sub}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <p className="text-[13px] leading-relaxed text-slate-400">{fp.sub}</p>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{fp.email}</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-[12px] text-red-400">
                    {mapValidationError(fieldErrors.email, t)}
                  </p>
                )}
              </div>

              {formError && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-400">
                  {formError}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[14px]">
                {loading ? fp.btn_loading : fp.btn}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-[13px] text-slate-500">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            {fp.back_to_login}
          </Link>
        </p>
      </div>
    </div>
  );
}
