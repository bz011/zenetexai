"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { signUp } from "@/features/auth/services/authService";
import { signupSchema, fieldErrorsFrom } from "@/lib/validators/authValidators";
import { mapAuthError, mapValidationError } from "@/lib/auth/authErrors";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

export default function SignupContent() {
  const { t } = useLang();
  const su = t.auth.signup;
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = signupSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const res = await signUp({ email, password, firstName, lastName });
    setLoading(false);

    if (!res.success) {
      setFormError(mapAuthError(res.error, t));
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[18px] font-bold text-white">
            ZENTEX<span className="text-indigo-400">AI</span>
          </Link>
          <p className="mt-2 text-[14px] text-slate-500">{su.tagline}</p>
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{su.first_name}</label>
                <input
                  type="text"
                  autoComplete="given-name"
                  className={inputCls}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1.5 text-[12px] text-red-400">
                    {mapValidationError(fieldErrors.firstName, t)}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{su.last_name}</label>
                <input
                  type="text"
                  autoComplete="family-name"
                  className={inputCls}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1.5 text-[12px] text-red-400">
                    {mapValidationError(fieldErrors.lastName, t)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{su.email}</label>
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

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{su.password}</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password ? (
                <p className="mt-1.5 text-[12px] text-red-400">
                  {mapValidationError(fieldErrors.password, t)}
                </p>
              ) : (
                <p className="mt-1.5 text-[12px] text-slate-600">{su.password_hint}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{su.confirm_password}</label>
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
              {loading ? su.btn_loading : su.btn}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-slate-500">
          {su.have_account}{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            {su.sign_in}
          </Link>
        </p>
      </div>
    </div>
  );
}
