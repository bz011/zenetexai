"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase/client";
import { login, signUp, resetPassword, updatePassword, resendVerificationEmail } from "@/features/auth/services/authService";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  fieldErrorsFrom,
} from "@/lib/validators/authValidators";
import { mapAuthError, mapValidationError } from "@/lib/auth/authErrors";
import { resolveSafeRedirect } from "@/lib/auth/safeRedirect";
import { AuthColumn } from "./AuthFrame";
import { Field, PasswordInput, Submit, TextInput } from "./AuthFields";
import { authHref, authStrings } from "./authCopy";
import styles from "./auth.module.css";

/**
 * The live account screens in the approved Teal Flow design. Each flow is the
 * production behaviour it replaces, unchanged (previous files:
 * src/app/(en)/(corporate)/{login,signup,forgot-password,reset-password,
 * verify-email}/*Content.tsx):
 *
 *  - same authService calls (Supabase), same zod schemas, same translated
 *    validation (mapValidationError) and Supabase error mapping (mapAuthError);
 *  - Login: redirectTo goes through resolveSafeRedirect, then router.push +
 *    refresh;
 *  - Sign up: synchronous double-submit guard; a real session (confirmation
 *    off) goes to /dashboard, otherwise to /verify-email?email=...;
 *  - Forgot: on success, the "check your email" state;
 *  - Reset: requires the recovery session set by /auth/callback (otherwise
 *    the invalid-link state); on success, back to /login after 2s;
 *  - Verify email: resend via authService.
 *
 * useSearchParams screens render inside Suspense with a same-size skeleton,
 * as before (a null fallback caused layout shift).
 */

function useCopy() {
  const { lang, t } = useLang();
  return { s: authStrings(lang), t };
}

function FormError({ message }: { message: string | null }) {
  return message ? (
    <p className={styles.alert} role="alert">
      {message}
    </p>
  ) : null;
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className={styles.column} aria-hidden="true">
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonLine} />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.skeletonField} />
      ))}
    </div>
  );
}

/* ---------------- Login ---------------- */

function LoginInner() {
  const { s, t } = useCopy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = resolveSafeRedirect(searchParams.get("redirectTo"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const err = (k: string) => mapValidationError(fieldErrors[k], t);

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
    <AuthColumn title={s.ui.titles.login} sub={s.ui.subs.login}>
      <form className={styles.form} noValidate aria-busy={loading || undefined} onSubmit={handleSubmit}>
        <Field id="lg-email" label={s.login.email} error={err("email")}>
          <TextInput id="lg-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" ltr value={email} onChange={setEmail} error={err("email")} />
        </Field>
        <Field id="lg-password" label={s.login.password} error={err("password")} aside={<Link href={authHref("forgot-password")} className={styles.inlineLink}>{s.login.forgot_password}</Link>}>
          <PasswordInput id="lg-password" name="password" autoComplete="current-password" value={password} onChange={setPassword} error={err("password")} s={s} />
        </Field>
        <FormError message={formError} />
        <Submit sending={loading} label={s.login.btn} sendingLabel={s.login.signing_in} />
      </form>
      <p className={styles.switch}>
        {s.login.no_account} <Link href={authHref("signup")}>{s.login.create_account}</Link>
      </p>
    </AuthColumn>
  );
}

export function LoginLive() {
  return (
    <Suspense fallback={<Skeleton rows={2} />}>
      <LoginInner />
    </Suspense>
  );
}

/* ---------------- Sign up ---------------- */

export function SignupLive() {
  const { s, t } = useCopy();
  const router = useRouter();
  const [v, setV] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Synchronous guard: one submit == exactly one signUp() call, even before
  // the disabled state re-renders (as in the previous screen).
  const submittingRef = useRef(false);
  const err = (k: string) => mapValidationError(fieldErrors[k], t);
  const set = (k: keyof typeof v) => (val: string) => setV((p) => ({ ...p, [k]: val }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setFormError(null);
    const result = signupSchema.safeParse(v);
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }
    setFieldErrors({});
    submittingRef.current = true;
    setLoading(true);
    const res = await signUp({ email: v.email, password: v.password, firstName: v.firstName, lastName: v.lastName });
    setLoading(false);
    submittingRef.current = false;
    if (!res.success) {
      setFormError(mapAuthError(res.error, t));
      return;
    }
    if (!res.requiresEmailConfirmation) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    router.push(`${authHref("verify-email")}?email=${encodeURIComponent(v.email)}`);
  }

  return (
    <AuthColumn title={s.ui.titles.signup} sub={s.ui.subs.signup} size="wide">
      <form className={styles.form} noValidate aria-busy={loading || undefined} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <Field id="su-first" label={s.signup.first_name} error={err("firstName")}>
            <TextInput id="su-first" name="firstName" autoComplete="given-name" value={v.firstName} onChange={set("firstName")} error={err("firstName")} />
          </Field>
          <Field id="su-last" label={s.signup.last_name} error={err("lastName")}>
            <TextInput id="su-last" name="lastName" autoComplete="family-name" value={v.lastName} onChange={set("lastName")} error={err("lastName")} />
          </Field>
        </div>
        <Field id="su-email" label={s.signup.email} error={err("email")}>
          <TextInput id="su-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" ltr value={v.email} onChange={set("email")} error={err("email")} />
        </Field>
        <Field id="su-password" label={s.signup.password} error={err("password")} hint={s.signup.password_hint}>
          <PasswordInput id="su-password" name="password" autoComplete="new-password" value={v.password} onChange={set("password")} error={err("password")} hint={s.signup.password_hint} s={s} />
        </Field>
        <Field id="su-confirm" label={s.signup.confirm_password} error={err("confirmPassword")}>
          <PasswordInput id="su-confirm" name="confirmPassword" autoComplete="new-password" value={v.confirmPassword} onChange={set("confirmPassword")} error={err("confirmPassword")} s={s} />
        </Field>
        <FormError message={formError} />
        <Submit sending={loading} label={s.signup.btn} sendingLabel={s.signup.btn_loading} />
      </form>
      <p className={styles.switch}>
        {s.signup.have_account} <Link href={authHref("login")}>{s.signup.sign_in}</Link>
      </p>
    </AuthColumn>
  );
}

/* ---------------- Forgot password ---------------- */

function EnvelopeMark() {
  return (
    <span className={styles.mark} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5.5" width="18" height="13" rx="2" />
        <path d="M3.5 7l8.5 6 8.5-6" />
      </svg>
    </span>
  );
}

export function ForgotPasswordLive() {
  const { s, t } = useCopy();
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const err = mapValidationError(fieldErrors.email, t);

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

  if (sent) {
    return (
      <AuthColumn title={s.forgot.success_title}>
        <div role="status">
          <EnvelopeMark />
          <p className={styles.body}>{s.forgot.success_sub}</p>
        </div>
        <Link href={authHref("login")} className={styles.primaryLink}>{s.forgot.back_to_login}</Link>
      </AuthColumn>
    );
  }

  return (
    <AuthColumn title={s.ui.titles.forgot} sub={s.forgot.sub}>
      <form className={styles.form} noValidate aria-busy={loading || undefined} onSubmit={handleSubmit}>
        <Field id="fp-email" label={s.forgot.email} error={err}>
          <TextInput id="fp-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" ltr value={email} onChange={setEmail} error={err} />
        </Field>
        <FormError message={formError} />
        <Submit sending={loading} label={s.forgot.btn} sendingLabel={s.forgot.btn_loading} />
      </form>
      <p className={styles.switch}>
        <Link href={authHref("login")}>{s.forgot.back_to_login}</Link>
      </p>
    </AuthColumn>
  );
}

/* ---------------- Reset password (from the emailed recovery link) ---------------- */

export function ResetPasswordLive() {
  const { s, t } = useCopy();
  const router = useRouter();
  // /auth/callback exchanges the recovery code for a session before
  // redirecting here; no session means the link was invalid or expired.
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [v, setV] = useState({ password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const err = (k: string) => mapValidationError(fieldErrors[k], t);
  const set = (k: keyof typeof v) => (val: string) => setV((p) => ({ ...p, [k]: val }));

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
    const result = resetPasswordSchema.safeParse(v);
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const res = await updatePassword(v.password);
    setLoading(false);
    if (!res.success) {
      setFormError(mapAuthError(res.error, t));
      return;
    }
    setDone(true);
    setTimeout(() => router.push(authHref("login")), 2000);
  }

  if (checkingSession) return <Skeleton rows={2} />;

  if (!hasSession) {
    return (
      <AuthColumn title={s.reset.invalid_link_title}>
        <p className={styles.body}>{s.reset.invalid_link_sub}</p>
        <Link href={authHref("forgot-password")} className={styles.primaryLink}>{s.reset.request_new_link}</Link>
      </AuthColumn>
    );
  }

  if (done) {
    return (
      <AuthColumn title={s.reset.success_title}>
        <p className={styles.body} role="status">{s.reset.success_sub}</p>
        <Link href={authHref("login")} className={styles.primaryLink}>{s.reset.go_to_login}</Link>
      </AuthColumn>
    );
  }

  return (
    <AuthColumn title={s.ui.titles.reset} sub={s.ui.subs.reset}>
      <form className={styles.form} noValidate aria-busy={loading || undefined} onSubmit={handleSubmit}>
        <Field id="rp-password" label={s.reset.password} error={err("password")} hint={s.signup.password_hint}>
          <PasswordInput id="rp-password" name="password" autoComplete="new-password" value={v.password} onChange={set("password")} error={err("password")} hint={s.signup.password_hint} s={s} />
        </Field>
        <Field id="rp-confirm" label={s.reset.confirm_password} error={err("confirmPassword")}>
          <PasswordInput id="rp-confirm" name="confirmPassword" autoComplete="new-password" value={v.confirmPassword} onChange={set("confirmPassword")} error={err("confirmPassword")} s={s} />
        </Field>
        <FormError message={formError} />
        <Submit sending={loading} label={s.reset.btn} sendingLabel={s.reset.btn_loading} />
      </form>
    </AuthColumn>
  );
}

/* ---------------- Verify email (after sign-up) ---------------- */

function VerifyEmailInner() {
  const { s, t } = useCopy();
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
    <AuthColumn title={s.verify.title}>
      <EnvelopeMark />
      <p className={styles.body}>
        {email ? (
          <>
            {s.verify.sub}{" "}
            <bdi dir="ltr" className={styles.email}>{email}</bdi>
            {s.verify.sub_after_email}
          </>
        ) : (
          s.verify.sub_generic
        )}
      </p>
      <div aria-live="polite" className={styles.live}>
        {status === "sent" && (
          <p className={styles.notice} role="status">
            {s.verify.resend_success}
          </p>
        )}
      </div>
      {status === "error" && error && <FormError message={error} />}
      <Link href={authHref("login")} className={styles.primaryLink}>{s.verify.back_to_login}</Link>
      {email && (
        <button type="button" className={styles.secondary} onClick={handleResend} disabled={status === "sending"}>
          {status === "sending" ? s.verify.resend_loading : s.verify.resend_btn}
        </button>
      )}
    </AuthColumn>
  );
}

export function VerifyEmailLive() {
  return (
    <Suspense fallback={<Skeleton rows={1} />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
