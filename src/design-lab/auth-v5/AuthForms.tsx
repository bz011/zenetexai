"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  fieldErrorsFrom,
} from "@/lib/validators/authValidators";
import type { AuthStrings } from "./authCopy";
import styles from "./auth.module.css";

/**
 * Auth forms (v5), DESIGN-LAB PREVIEW ONLY.
 *
 * Same fields, autocomplete hints and validation as the live screens: each
 * form runs the live zod schema (authValidators.ts) and shows the live
 * translated message for each error code. What they never do is call the
 * account service: no Supabase sign-in, sign-up, reset email or password
 * change happens here, and no session is created. After the checks pass,
 * the form says plainly that nothing was attempted. Success screens exist
 * only as their own preview states (?state=...), labelled as such.
 *
 * To see the live error messages, add ?preview= to the URL:
 * invalid-credentials, email-not-confirmed, email-taken, rate-limited or
 * error. Each shows the exact string production maps that Supabase error to.
 *
 * The show/hide password control is a display aid only.
 */

type Errors = Record<string, string>;
type Simulate = string | undefined;

const SIMULATED: Record<string, keyof AuthStrings["errors"]> = {
  "invalid-credentials": "invalid_credentials",
  "email-not-confirmed": "email_not_confirmed",
  "email-taken": "email_taken",
  "rate-limited": "rate_limited",
  error: "generic",
};

/** Validation, a short "sending" pause, then the preview notice or a simulated live error. */
function usePreviewForm(s: AuthStrings, simulate: Simulate) {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "notice" | "failed">("idle");
  const [failure, setFailure] = useState("");
  const busy = useRef(false);

  const message = (code: string) => s.validation[code as keyof AuthStrings["validation"]] ?? code;

  async function run(e: FormEvent<HTMLFormElement>, schema: z.ZodTypeAny, values: Record<string, string>) {
    e.preventDefault();
    if (busy.current) return;
    const result = schema.safeParse(values);
    if (!result.success) {
      const found = fieldErrorsFrom(result);
      setErrors(found);
      setStatus("idle");
      const first = Object.keys(values).find((k) => found[k]);
      if (first) e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    busy.current = true;
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 800));
    busy.current = false;
    const key = simulate ? SIMULATED[simulate] : undefined;
    if (key) {
      setFailure(s.errors[key]);
      setStatus("failed");
    } else {
      setStatus("notice");
    }
  }

  const reset = () => status !== "sending" && status !== "idle" && setStatus("idle");
  return { errors, status, failure, message, run, reset };
}

function Field({
  id,
  label,
  error,
  hint,
  aside,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>{label}</label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className={styles.fieldError}>{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className={styles.hint}>{hint}</p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

function TextInput({
  id,
  name,
  value,
  onChange,
  error,
  hint,
  ltr,
  ...rest
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  ltr?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "email" | "text";
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
      dir={ltr ? "ltr" : undefined}
      className={`${styles.input} ${ltr ? styles.ltrInput : ""}`}
      type={rest.type ?? "text"}
      {...rest}
    />
  );
}

function PasswordInput({
  id,
  name,
  value,
  onChange,
  error,
  hint,
  autoComplete,
  s,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  autoComplete: "current-password" | "new-password";
  s: AuthStrings;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className={styles.passwordWrap}>
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        spellCheck={false}
        autoCapitalize="none"
        dir="ltr"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${styles.input} ${styles.ltrInput} ${styles.passwordInput}`}
      />
      <button
        type="button"
        className={styles.reveal}
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? s.ui.hide : s.ui.show}
        aria-pressed={shown}
        aria-controls={id}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="2.8" />
          {shown && <path d="M4 20L20 4" />}
        </svg>
      </button>
    </div>
  );
}

function Submit({ sending, label, sendingLabel }: { sending: boolean; label: string; sendingLabel: string }) {
  return (
    <button type="submit" className={styles.submit} disabled={sending}>
      {sending && <span className={styles.spinner} aria-hidden="true" />}
      <span>{sending ? sendingLabel : label}</span>
    </button>
  );
}

function Outcome({ status, failure, title, s, next }: { status: string; failure: string; title: string; s: AuthStrings; next?: string }) {
  return (
    <>
      <div aria-live="polite" className={styles.live}>
        {status === "notice" && (
          <div className={styles.notice} role="status">
            <p className={styles.noticeTitle}>{title}</p>
            <p>{s.ui.notice.text}</p>
            {next && (
              <p>
                <a href={next}>{s.ui.nextScreen}</a>
              </p>
            )}
          </div>
        )}
      </div>
      {status === "failed" && (
        <p className={styles.alert} role="alert">
          {failure}
        </p>
      )}
    </>
  );
}

/* ---------------- Login ---------------- */

export function LoginForm({ s, simulate, hrefs }: { s: AuthStrings; simulate: Simulate; hrefs: { forgot: string; signup: string } }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const f = usePreviewForm(s, simulate);
  const err = (k: string) => (f.errors[k] ? f.message(f.errors[k]) : undefined);
  const on = (set: (v: string) => void) => (v: string) => {
    set(v);
    f.reset();
  };

  return (
    <>
      <form className={styles.form} noValidate aria-busy={f.status === "sending" || undefined} onSubmit={(e) => f.run(e, loginSchema, { email, password })}>
        <Field id="lg-email" label={s.login.email} error={err("email")}>
          <TextInput id="lg-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" ltr value={email} onChange={on(setEmail)} error={err("email")} />
        </Field>
        <Field
          id="lg-password"
          label={s.login.password}
          error={err("password")}
          aside={<a href={hrefs.forgot} className={styles.inlineLink}>{s.login.forgot_password}</a>}
        >
          <PasswordInput id="lg-password" name="password" autoComplete="current-password" value={password} onChange={on(setPassword)} error={err("password")} s={s} />
        </Field>
        <Outcome status={f.status} failure={f.failure} title={s.ui.notice.login} s={s} />
        <Submit sending={f.status === "sending"} label={s.login.btn} sendingLabel={s.login.signing_in} />
      </form>
      <p className={styles.switch}>
        {s.login.no_account} <a href={hrefs.signup}>{s.login.create_account}</a>
      </p>
    </>
  );
}

/* ---------------- Sign up ---------------- */

export function SignupForm({ s, simulate, hrefs }: { s: AuthStrings; simulate: Simulate; hrefs: { login: string; verify: string } }) {
  const [v, setV] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const f = usePreviewForm(s, simulate);
  const err = (k: string) => (f.errors[k] ? f.message(f.errors[k]) : undefined);
  const set = (k: keyof typeof v) => (val: string) => {
    setV((p) => ({ ...p, [k]: val }));
    f.reset();
  };

  return (
    <>
      <form className={styles.form} noValidate aria-busy={f.status === "sending" || undefined} onSubmit={(e) => f.run(e, signupSchema, v)}>
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
        <Outcome status={f.status} failure={f.failure} title={s.ui.notice.signup} s={s} next={hrefs.verify} />
        <Submit sending={f.status === "sending"} label={s.signup.btn} sendingLabel={s.signup.btn_loading} />
      </form>
      <p className={styles.switch}>
        {s.signup.have_account} <a href={hrefs.login}>{s.signup.sign_in}</a>
      </p>
    </>
  );
}

/* ---------------- Forgot password ---------------- */

export function ForgotPasswordForm({ s, simulate, hrefs }: { s: AuthStrings; simulate: Simulate; hrefs: { login: string } }) {
  const [email, setEmail] = useState("");
  const f = usePreviewForm(s, simulate);
  const err = f.errors.email ? f.message(f.errors.email) : undefined;

  return (
    <>
      <form className={styles.form} noValidate aria-busy={f.status === "sending" || undefined} onSubmit={(e) => f.run(e, forgotPasswordSchema, { email })}>
        <Field id="fp-email" label={s.forgot.email} error={err}>
          <TextInput
            id="fp-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            ltr
            value={email}
            onChange={(val) => {
              setEmail(val);
              f.reset();
            }}
            error={err}
          />
        </Field>
        <Outcome status={f.status} failure={f.failure} title={s.ui.notice.forgot} s={s} />
        <Submit sending={f.status === "sending"} label={s.forgot.btn} sendingLabel={s.forgot.btn_loading} />
      </form>
      <p className={styles.switch}>
        <a href={hrefs.login}>{s.forgot.back_to_login}</a>
      </p>
    </>
  );
}

/* ---------------- Reset password (after the recovery link) ---------------- */

export function ResetPasswordForm({ s, simulate }: { s: AuthStrings; simulate: Simulate }) {
  const [v, setV] = useState({ password: "", confirmPassword: "" });
  const f = usePreviewForm(s, simulate);
  const err = (k: string) => (f.errors[k] ? f.message(f.errors[k]) : undefined);
  const set = (k: keyof typeof v) => (val: string) => {
    setV((p) => ({ ...p, [k]: val }));
    f.reset();
  };

  return (
    <form className={styles.form} noValidate aria-busy={f.status === "sending" || undefined} onSubmit={(e) => f.run(e, resetPasswordSchema, v)}>
      <Field id="rp-password" label={s.reset.password} error={err("password")} hint={s.signup.password_hint}>
        <PasswordInput id="rp-password" name="password" autoComplete="new-password" value={v.password} onChange={set("password")} error={err("password")} hint={s.signup.password_hint} s={s} />
      </Field>
      <Field id="rp-confirm" label={s.reset.confirm_password} error={err("confirmPassword")}>
        <PasswordInput id="rp-confirm" name="confirmPassword" autoComplete="new-password" value={v.confirmPassword} onChange={set("confirmPassword")} error={err("confirmPassword")} s={s} />
      </Field>
      <Outcome status={f.status} failure={f.failure} title={s.ui.notice.reset} s={s} />
      <Submit sending={f.status === "sending"} label={s.reset.btn} sendingLabel={s.reset.btn_loading} />
    </form>
  );
}

/* ---------------- Verify email: resend ---------------- */

export function ResendButton({ s, simulate }: { s: AuthStrings; simulate: Simulate }) {
  const [status, setStatus] = useState<"idle" | "sending" | "notice" | "failed">("idle");
  const busy = useRef(false);
  async function resend() {
    if (busy.current) return;
    busy.current = true;
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 800));
    busy.current = false;
    setStatus(simulate && SIMULATED[simulate] ? "failed" : "notice");
  }
  return (
    <>
      <div aria-live="polite" className={styles.live}>
        {status === "notice" && (
          <div className={styles.notice} role="status">
            <p className={styles.noticeTitle}>{s.ui.notice.resend}</p>
            <p>{s.ui.notice.text}</p>
          </div>
        )}
      </div>
      {status === "failed" && simulate && (
        <p className={styles.alert} role="alert">
          {s.errors[SIMULATED[simulate]]}
        </p>
      )}
      <button type="button" className={styles.secondary} onClick={resend} disabled={status === "sending"}>
        {status === "sending" ? s.verify.resend_loading : s.verify.resend_btn}
      </button>
    </>
  );
}
