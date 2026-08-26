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
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

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
    <div className="relative flex min-h-screen items-center justify-center px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[18px] font-bold text-white">
            ZENTEX<span className="text-indigo-400">AI</span>
          </Link>
          <p className="mt-2 text-[14px] text-slate-500">{rp.tagline}</p>
        </div>

        <div className="card p-7">
          {checkingSession ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-500" />
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">{rp.success_title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{rp.success_sub}</p>
            </div>
          ) : !hasSession ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">{rp.invalid_link_title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{rp.invalid_link_sub}</p>
              <Link href="/forgot-password" className="btn-primary mt-6 inline-flex px-5 py-2.5 text-[13px]">
                {rp.request_new_link}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{rp.password}</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {fieldErrors.password && (
                  <p className="mt-1.5 text-[12px] text-red-400">
                    {mapValidationError(fieldErrors.password, t)}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{rp.confirm_password}</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={inputCls}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-[12px] text-red-400">
                    {mapValidationError(fieldErrors.confirmPassword, t)}
                  </p>
                )}
              </div>

              {formError && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-400">
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
