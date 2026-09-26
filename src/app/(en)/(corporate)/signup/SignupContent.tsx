"use client";

import { useState, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { signUp } from "@/features/auth/services/authService";
import { signupSchema, fieldErrorsFrom } from "@/lib/validators/authValidators";
import { mapAuthError, mapValidationError } from "@/lib/auth/authErrors";

const inputCls =
  "w-full rounded-card border border-line-strong bg-surface-1 px-4 py-3 text-[14px] text-ink placeholder:text-ink-3 outline-none transition-all focus:border-accent-fg focus:bg-surface-2 focus:ring-2 focus:ring-accent/25";

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
  // Synchronous guard against a double-submit (rapid double-click/double-tap,
  // or an Enter-key submit racing a click) actually reaching Supabase twice.
  // `disabled={loading}` on the button already covers the common case, but
  // that only takes effect after a state update/re-render; a ref is
  // read/written immediately, with no such gap, so this is a strictly
  // stronger guarantee that one submit == exactly one signUp() call.
  const submittingRef = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
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

    submittingRef.current = true;
    setLoading(true);
    const res = await signUp({ email, password, firstName, lastName });
    setLoading(false);
    submittingRef.current = false;

    if (!res.success) {
      setFormError(mapAuthError(res.error, t));
      return;
    }

    if (!res.requiresEmailConfirmation) {
      // Email confirmation is off for this project (or this address was
      // already confirmed) - Supabase returned a real session, so this
      // user IS genuinely logged in already. Sending them to "check your
      // email, then log in" would be actively wrong here.
      router.push("/dashboard");
      router.refresh();
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[18px] font-bold text-ink">
            ZENTEX<span className="text-accent-fg">AI</span>
          </Link>
          <p className="mt-2 text-[14px] text-ink-3">{su.tagline}</p>
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-2">{su.first_name}</label>
                <input
                  type="text"
                  autoComplete="given-name"
                  className={inputCls}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1.5 text-[12px] text-danger">
                    {mapValidationError(fieldErrors.firstName, t)}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-2">{su.last_name}</label>
                <input
                  type="text"
                  autoComplete="family-name"
                  className={inputCls}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1.5 text-[12px] text-danger">
                    {mapValidationError(fieldErrors.lastName, t)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-2">{su.email}</label>
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

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-2">{su.password}</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password ? (
                <p className="mt-1.5 text-[12px] text-danger">
                  {mapValidationError(fieldErrors.password, t)}
                </p>
              ) : (
                <p className="mt-1.5 text-[12px] text-ink-3">{su.password_hint}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-2">{su.confirm_password}</label>
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
              {loading ? su.btn_loading : su.btn}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-ink-3">
          {su.have_account}{" "}
          <Link href="/login" className="text-accent-fg hover:underline underline-offset-4 transition-colors">
            {su.sign_in}
          </Link>
        </p>
      </div>
    </div>
  );
}
