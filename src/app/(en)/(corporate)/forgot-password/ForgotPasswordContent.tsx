"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { resetPassword } from "@/features/auth/services/authService";
import { forgotPasswordSchema, fieldErrorsFrom } from "@/lib/validators/authValidators";
import { mapAuthError, mapValidationError } from "@/lib/auth/authErrors";

const inputCls =
  "w-full rounded-card border border-line-strong bg-surface-1 px-4 py-3 text-[14px] text-ink placeholder:text-ink-3 outline-none transition-all focus:border-accent-fg focus:bg-surface-2 focus:ring-2 focus:ring-accent/25";

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

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[18px] font-bold text-ink">
            ZENTEX<span className="text-accent-fg">AI</span>
          </Link>
          <p className="mt-2 text-[14px] text-ink-3">{fp.tagline}</p>
        </div>

        <div className="card p-7">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-positive/40 bg-positive/10 text-positive">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-ink">{fp.success_title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{fp.success_sub}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <p className="text-[13px] leading-relaxed text-ink-2">{fp.sub}</p>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-2">{fp.email}</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-[12px] text-danger">
                    {mapValidationError(fieldErrors.email, t)}
                  </p>
                )}
              </div>

              {formError && (
                <p className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
                  {formError}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[14px]">
                {loading ? fp.btn_loading : fp.btn}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-[13px] text-ink-3">
          <Link href="/login" className="text-accent-fg hover:underline underline-offset-4 transition-colors">
            {fp.back_to_login}
          </Link>
        </p>
      </div>
    </div>
  );
}
