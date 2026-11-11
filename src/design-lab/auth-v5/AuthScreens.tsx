import type { Lang } from "@/design-lab/content";
import AuthShell from "./AuthShell";
import { authHref, authStrings } from "./authCopy";
import { ForgotPasswordForm, LoginForm, ResendButton, ResetPasswordForm, SignupForm } from "./AuthForms";
import styles from "./auth.module.css";

/**
 * The five auth screens (v5) as the live site has them: Login, Sign up,
 * Forgot password, Reset password (reached from the emailed recovery link)
 * and Verify email (shown after sign-up). No other method exists (no social
 * login, magic link or OTP), so none is shown.
 *
 * Screens that follow a real step (the reset email sent, the password
 * updated, an invalid recovery link) are shown here only as named preview
 * states (?state=sent | done | invalid-link), each labelled as a preview.
 */

type Params = { state?: string; preview?: string; email?: string };
const other = (lang: Lang) => (lang === "en" ? "ar" : "en");

function PreviewState({ label }: { label: string }) {
  return <p className={styles.stateLabel}>{label}</p>;
}

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

export function LoginScreen({ lang, params }: { lang: Lang; params: Params }) {
  const s = authStrings(lang);
  return (
    <AuthShell lang={lang} otherLangHref={authHref(other(lang), "login")} title={s.ui.titles.login} sub={s.ui.subs.login}>
      <LoginForm s={s} simulate={params.preview} hrefs={{ forgot: authHref(lang, "forgot-password"), signup: authHref(lang, "signup") }} />
    </AuthShell>
  );
}

export function SignupScreen({ lang, params }: { lang: Lang; params: Params }) {
  const s = authStrings(lang);
  return (
    <AuthShell lang={lang} otherLangHref={authHref(other(lang), "signup")} title={s.ui.titles.signup} sub={s.ui.subs.signup} size="wide">
      <SignupForm
        s={s}
        simulate={params.preview}
        hrefs={{ login: authHref(lang, "login"), verify: `${authHref(lang, "verify-email")}?email=${encodeURIComponent("you@example.com")}` }}
      />
    </AuthShell>
  );
}

export function ForgotPasswordScreen({ lang, params }: { lang: Lang; params: Params }) {
  const s = authStrings(lang);
  const otherHref = authHref(other(lang), "forgot-password") + (params.state === "sent" ? "?state=sent" : "");

  if (params.state === "sent") {
    return (
      <AuthShell lang={lang} otherLangHref={otherHref} title={s.forgot.success_title}>
        <PreviewState label={s.ui.previewState} />
        <EnvelopeMark />
        <p className={styles.body}>{s.forgot.success_sub}</p>
        <a href={authHref(lang, "login")} className={styles.primaryLink}>{s.forgot.back_to_login}</a>
      </AuthShell>
    );
  }
  return (
    <AuthShell lang={lang} otherLangHref={otherHref} title={s.ui.titles.forgot} sub={s.forgot.sub}>
      <ForgotPasswordForm s={s} simulate={params.preview} hrefs={{ login: authHref(lang, "login") }} />
    </AuthShell>
  );
}

export function ResetPasswordScreen({ lang, params }: { lang: Lang; params: Params }) {
  const s = authStrings(lang);
  const state = params.state === "done" || params.state === "invalid-link" ? params.state : undefined;
  const otherHref = authHref(other(lang), "reset-password") + (state ? `?state=${state}` : "");

  if (state === "invalid-link") {
    return (
      <AuthShell lang={lang} otherLangHref={otherHref} title={s.reset.invalid_link_title}>
        <PreviewState label={s.ui.previewState} />
        <p className={styles.body}>{s.reset.invalid_link_sub}</p>
        <a href={authHref(lang, "forgot-password")} className={styles.primaryLink}>{s.reset.request_new_link}</a>
      </AuthShell>
    );
  }
  if (state === "done") {
    return (
      <AuthShell lang={lang} otherLangHref={otherHref} title={s.reset.success_title}>
        <PreviewState label={s.ui.previewState} />
        <p className={styles.body}>{s.reset.success_sub}</p>
        <a href={authHref(lang, "login")} className={styles.primaryLink}>{s.reset.go_to_login}</a>
      </AuthShell>
    );
  }
  return (
    <AuthShell lang={lang} otherLangHref={otherHref} title={s.ui.titles.reset} sub={s.ui.subs.reset}>
      <ResetPasswordForm s={s} simulate={params.preview} />
    </AuthShell>
  );
}

export function VerifyEmailScreen({ lang, params }: { lang: Lang; params: Params }) {
  const s = authStrings(lang);
  const email = params.email ?? "";
  const otherHref = authHref(other(lang), "verify-email") + (email ? `?email=${encodeURIComponent(email)}` : "");
  return (
    <AuthShell lang={lang} otherLangHref={otherHref} title={s.verify.title}>
      <PreviewState label={s.ui.previewState} />
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
      <a href={authHref(lang, "login")} className={styles.primaryLink}>{s.verify.back_to_login}</a>
      {email && <ResendButton s={s} simulate={params.preview} />}
    </AuthShell>
  );
}
