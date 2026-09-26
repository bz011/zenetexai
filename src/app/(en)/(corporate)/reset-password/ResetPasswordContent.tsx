"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase/client";
import { updatePassword } from "@/features/auth/services/authService";
import { resetPasswordSchema, fieldErrorsFrom } from "@/lib/validators/authValidators";
import { mapAuthError, mapValidationError } from "@/lib/auth/authErrors";

const inputCls =
  "w-full rounded-card border border-line-strong bg-surface-1 px-4 py-3 text-[14px] text-ink placeholder:text-ink-3 outline-none transition-all focus:border-accent-fg focus:bg-surface-2 focus:ring-2 focus:ring-accent/25";

export default function ResetPasswordContent() {
  const { t } = useLang();
  const rp = t.auth.resetPassword;
  const router = useRouter();

  // /auth/callback exchanges the recovery code for a session before
  // redirecting here — if there's no session, the link was invalid/expired
  // (or someone landed here directly without going through the email link).
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasSession(!!session);
      setCheckingSession(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const res = await updatePassword(password);
    setLoading(false);

    if (!res.success) {
      setFormError(mapAuthError(res.error, t));
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[18px] font-bold text-ink">
            ZENTEX<span className="text-accent-fg">AI</span>
          </Link>
          <p className="mt-2 text-[14px] text-ink-3">{rp.tagline}</p>
        </div>

        <div className="card p-7">
          {checkingSession ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-positive/40 bg-positive/10 text-positive">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-ink">{rp.success_title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{rp.success_sub}</p>
            </div>
          ) : !hasSession ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-ink">{rp.invalid_link_title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{rp.invalid_link_sub}</p>
              <Link href="/forgot-password" className="btn-primary mt-6 inline-flex px-5 py-2.5 text-[13px]">
                {rp.request_new_link}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-2">{rp.password}</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {fieldErrors.password && (
                  <p className="mt-1.5 text-[12px] text-danger">
                    {mapValidationError(fieldErrors.password, t)}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-2">{rp.confirm_password}</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={inputCls}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-[12px] text-danger">
                    {mapValidationError(fieldErrors.confirmPassword, t)}
                  </p>
                )}
              </div>

              {formError && (
                <p className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
                  {formError}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[14px]">
                {loading ? rp.btn_loading : rp.btn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
