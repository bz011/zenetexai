import translations from "@/lib/translations";
import type { Lang } from "@/design-lab/content";

/**
 * Auth screens (v5) copy. Field labels, buttons, the password hint, the
 * recovery / verification wording and every validation and error message
 * are the live site's own (src/lib/translations.ts: login, auth.*), so the
 * redesign says exactly what production says. Only the page headlines,
 * their one-line introductions and the preview notices are new.
 */

type UiCopy = {
  back: string;
  language: string;
  preview: string;
  previewState: string;
  titles: { login: string; signup: string; forgot: string; reset: string };
  subs: { login: string; signup: string; reset: string };
  show: string;
  hide: string;
  notice: { login: string; signup: string; forgot: string; reset: string; resend: string; text: string };
  nextScreen: string;
  footer: { privacy: string; terms: string };
};

const ui: Record<Lang, UiCopy> = {
  en: {
    back: "Back to website",
    language: "العربية",
    preview: "Design preview: sign-in, sign-up and account emails are switched off here.",
    previewState: "Preview of the screen shown after this step",
    titles: {
      login: "Welcome back.",
      signup: "Start your journey.",
      forgot: "Reset your password.",
      reset: "Choose a new password.",
    },
    subs: {
      login: "Sign in to continue learning and access your ZentexAI account.",
      signup: "Create your ZentexAI account to explore our learning programs and tools.",
      reset: "Enter your new password twice to confirm it.",
    },
    show: "Show password",
    hide: "Hide password",
    notice: {
      login: "Preview only: no sign-in was attempted",
      signup: "Preview only: no account was created",
      forgot: "Preview only: no email was sent",
      reset: "Preview only: no password was changed",
      resend: "Preview only: no email was sent",
      text: "Your details passed the same checks as the live form, but this design preview does not contact the account service.",
    },
    nextScreen: "View the next screen",
    footer: { privacy: "Privacy Policy", terms: "Terms of Service" },
  },
  ar: {
    back: "العودة إلى الموقع",
    language: "English",
    preview: "نسخة تصميم تجريبية: تسجيل الدخول وإنشاء الحساب ورسائل الحساب معطّلة هنا.",
    previewState: "معاينة للشاشة التي تظهر بعد هذه الخطوة",
    titles: {
      login: "مرحبًا بعودتك.",
      signup: "ابدأ رحلتك معنا.",
      forgot: "إعادة تعيين كلمة المرور.",
      reset: "اختر كلمة مرور جديدة.",
    },
    subs: {
      login: "سجّل الدخول لمتابعة التعلّم والوصول إلى حسابك في ZentexAI.",
      signup: "أنشئ حسابك في ZentexAI لاستكشاف برامجنا التعليمية وأدواتنا.",
      reset: "أدخل كلمة المرور الجديدة مرتين لتأكيدها.",
    },
    show: "إظهار كلمة المرور",
    hide: "إخفاء كلمة المرور",
    notice: {
      login: "نسخة تجريبية: لم تتم أي محاولة لتسجيل الدخول",
      signup: "نسخة تجريبية: لم يُنشأ أي حساب",
      forgot: "نسخة تجريبية: لم يُرسَل أي بريد",
      reset: "نسخة تجريبية: لم تُغيَّر كلمة المرور",
      resend: "نسخة تجريبية: لم يُرسَل أي بريد",
      text: "اجتازت بياناتك عمليات التحقق نفسها المعتمدة في النموذج الفعلي، لكن هذه النسخة التجريبية من التصميم لا تتصل بخدمة الحسابات.",
    },
    nextScreen: "عرض الشاشة التالية",
    footer: { privacy: "سياسة الخصوصية", terms: "شروط الخدمة" },
  },
};

/** Everything the auth screens show, for one language (serializable, passed to the client forms). */
export function authStrings(lang: Lang) {
  const t = translations[lang];
  return {
    ui: ui[lang],
    login: t.login,
    signup: t.auth.signup,
    forgot: t.auth.forgotPassword,
    reset: t.auth.resetPassword,
    verify: t.auth.verifyEmail,
    validation: t.auth.validation,
    errors: t.auth.errors,
  };
}

export type AuthStrings = ReturnType<typeof authStrings>;

/** Design-lab routes for the auth screens (the live routes are /login, /signup, ...). */
export function authHref(lang: Lang, screen: "login" | "signup" | "forgot-password" | "reset-password" | "verify-email") {
  return `${lang === "ar" ? "/design-lab/ar" : "/design-lab"}/${screen}`;
}
