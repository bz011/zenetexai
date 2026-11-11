"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { login } from "@/features/auth/services/authService";
import { loginSchema, fieldErrorsFrom } from "@/lib/validators/authValidators";
import { mapAuthError, mapValidationError } from "@/lib/auth/authErrors";
import { resolveSafeRedirect } from "@/lib/auth/safeRedirect";

const inputCls =
  "w-full rounded-card border border-line-strong bg-surface-1 px-4 py-3 text-[14px] text-ink placeholder:text-ink-3 outline-none transition-all focus:border-accent-fg focus:bg-surface-2 focus:ring-2 focus:ring-accent/25";

function LoginForm() {
  const { t } = useLang();
  const lg = t.login;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = resolveSafeRedirect(searchParams.get("redirectTo"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const res = await login({ email, password });
    setLoading(false);

    if (!res.success) {
      setFormError(mapAuthError(res.error, t));
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[18px] font-bold text-ink">
            ZENTEX<span className="text-accent-fg">AI</span>
          </Link>
          <p className="mt-2 text-[14px] text-ink-3">{lg.tagline}</p>
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-2">{lg.email}</label>
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
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[13px] font-medium text-ink-2">{lg.password}</label>
                <Link href="/forgot-password" className="text-[12px] text-accent-fg hover:underline underline-offset-4 transition-colors">
                  {lg.forgot_password}
                </Link>
              </div>
              <input
                type="password"
                autoComplete="current-password"
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

            {formError && (
              <p className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
                {formError}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[14px]">
              {loading ? lg.signing_in : lg.btn}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-ink-3">
          {lg.no_account}{" "}
          <Link href="/signup" className="text-accent-fg hover:underline underline-offset-4 transition-colors">
            {lg.create_account}
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Matches LoginForm's own outer wrapper/card dimensions (min-h-screen
 * centering + roughly the same input/button heights) rather than `null` -
 * a `null` fallback measurably caused a ~0.5 CLS on this page (confirmed
 * via Lighthouse), since the whole min-h-screen block popped in from
 * nothing the instant useSearchParams() resolved on the client, pushing
 * the footer down by a full screen's worth of height. Purely a loading
 * placeholder - no behavior change.
 */
function LoginFormSkeleton() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      <div className="w-full max-w-sm animate-pulse">
        <div className="mb-8 text-center">
          <div className="mx-auto h-[22px] w-32 rounded bg-surface-2" />
          <div className="mx-auto mt-3 h-[14px] w-40 rounded bg-surface-1" />
        </div>
        <div className="card space-y-4 p-7">
          <div className="h-[62px] rounded-card bg-surface-1" />
          <div className="h-[62px] rounded-card bg-surface-1" />
          <div className="h-[46px] rounded-card bg-surface-1" />
        </div>
        <div className="mx-auto mt-5 h-[14px] w-48 rounded bg-surface-1" />
      </div>
    </div>
  );
}

export default function LoginContent() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
