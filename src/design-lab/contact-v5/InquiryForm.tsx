"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { contactSchema } from "@/lib/validators/contactValidators";
import type { Lang } from "@/design-lab/content";
import { contactCopy, type InquiryValue } from "./contactCopy";
import styles from "./contact.module.css";

/**
 * The Contact inquiry form (v5).
 *
 * CONTRACT: identical to the live form (src/components/ContactForm.tsx).
 * Same five fields and names, the same JSON body, validated with the live
 * server's own schema (contactSchema), so what passes here is exactly what
 * /api/contact would accept. Length caps match it (maxLength).
 *
 * MODES
 *  - "preview" (every design-lab route): NOTHING is sent. /api/contact
 *    forwards real submissions to the business's Google Apps Script inbox
 *    even from a local dev server, so the lab never calls it. After the
 *    same checks, the form says plainly that nothing was sent; it never
 *    shows a success message. For testing the other states, add
 *    ?preview=error or ?preview=rate-limited to the URL.
 *  - "live": POSTs to /api/contact exactly as the live form does and shows
 *    success only when the route answers { success: true }; 429 shows the
 *    rate-limit message, anything else a generic error (no internals).
 *
 * The topic is optional: no choice is sent as "general", the live form's
 * own default. Double submits are ignored while a request is in flight.
 */

type Field = "name" | "email" | "company" | "message";
type Values = { name: string; email: string; company: string; inquiryType: InquiryValue | ""; message: string };
type Status = "idle" | "sending" | "preview" | "success" | "failed" | "rateLimited";

const EMPTY: Values = { name: "", email: "", company: "", inquiryType: "", message: "" };
const LIMITS = { name: 120, email: 254, company: 160, message: 5000 } as const;
const ORDER: Field[] = ["name", "email", "company", "message"];

export default function InquiryForm({ lang, mode, privacyHref }: { lang: Lang; mode: "preview" | "live"; privacyHref: string }) {
  const k = contactCopy[lang];
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const busy = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const payload = (v: Values) => ({ ...v, inquiryType: v.inquiryType || "general" });

  function validate(v: Values): Partial<Record<Field, string>> {
    const parsed = contactSchema.safeParse(payload(v));
    if (parsed.success) return {};
    const out: Partial<Record<Field, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as Field;
      if (out[field] || !ORDER.includes(field)) continue;
      if (issue.code === "too_big") out[field] = k.errors.tooLong;
      else if (field === "name") out.name = k.errors.nameRequired;
      else if (field === "email") out.email = v.email.trim() ? k.errors.emailInvalid : k.errors.emailRequired;
      else if (field === "message") out.message = k.errors.messageRequired;
      else out[field] = k.errors.tooLong;
    }
    return out;
  }

  function onChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const next = { ...values, [e.target.name]: e.target.value } as Values;
    setValues(next);
    if (status === "preview" || status === "failed" || status === "rateLimited") setStatus("idle");
    if (attempted) setErrors(validate(next));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setAttempted(true);
    const found = validate(values);
    setErrors(found);
    const first = ORDER.find((f) => found[f]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    busy.current = true;
    setStatus("sending");
    try {
      if (mode === "preview") {
        // Nothing leaves the browser. A short pause shows the sending state.
        await new Promise((r) => setTimeout(r, 900));
        const sim = new URLSearchParams(window.location.search).get("preview");
        setStatus(sim === "error" ? "failed" : sim === "rate-limited" ? "rateLimited" : "preview");
        return;
      }
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(values)),
      });
      if (res.status === 429) {
        setStatus("rateLimited");
        return;
      }
      const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (res.ok && data?.success) {
        setStatus("success");
        setValues(EMPTY);
        setAttempted(false);
      } else {
        setStatus("failed");
      }
    } catch {
      setStatus("failed");
    } finally {
      busy.current = false;
    }
  }

  if (status === "success") {
    return (
      <div className={styles.done} role="status">
        <span className={styles.doneMark} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.2 4.2L19 7" />
          </svg>
        </span>
        <h2 className={styles.doneTitle}>{k.result.successTitle}</h2>
        <p className={styles.doneText}>{k.result.successText}</p>
        <button type="button" className={styles.textButton} onClick={() => setStatus("idle")}>
          {k.result.sendAnother}
        </button>
      </div>
    );
  }

  const sending = status === "sending";
  const hasErrors = attempted && Object.keys(errors).length > 0;
  const fieldProps = (f: Field) => ({
    id: `cf-${f}`,
    name: f,
    value: values[f],
    onChange,
    maxLength: LIMITS[f],
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": errors[f] ? `cf-${f}-error` : undefined,
    className: styles.input,
  });
  const fieldError = (f: Field) =>
    errors[f] ? (
      <p id={`cf-${f}-error`} className={styles.fieldError}>
        {errors[f]}
      </p>
    ) : null;

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-labelledby="cf-heading" aria-busy={sending || undefined}>
      <h2 id="cf-heading" className={styles.formHeading}>{k.form.heading}</h2>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="cf-name" className={styles.label}>{k.form.name}</label>
          <input {...fieldProps("name")} type="text" autoComplete="name" required />
          {fieldError("name")}
        </div>
        <div className={styles.field}>
          <label htmlFor="cf-email" className={styles.label}>{k.form.email}</label>
          <input {...fieldProps("email")} type="email" inputMode="email" autoComplete="email" dir="ltr" required />
          {fieldError("email")}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="cf-company" className={styles.label}>
          {k.form.company} <span className={styles.optional}>{k.form.optional}</span>
        </label>
        <input {...fieldProps("company")} type="text" autoComplete="organization" />
        {fieldError("company")}
      </div>

      <fieldset className={styles.topics}>
        <legend className={styles.label}>
          {k.form.topic} <span className={styles.optional}>{k.form.optional}</span>
        </legend>
        <div className={styles.topicGrid}>
          {k.form.topics.map((t) => (
            <label key={t.value} className={styles.topic}>
              <input
                type="radio"
                name="inquiryType"
                value={t.value}
                checked={values.inquiryType === t.value}
                onChange={onChange}
                className={styles.topicInput}
              />
              <span className={styles.topicBody}>
                <span className={styles.topicLabel}>{t.label}</span>
                <span className={styles.topicHint}>{t.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="cf-message" className={styles.label}>{k.form.message}</label>
        <textarea {...fieldProps("message")} rows={6} required placeholder={k.form.messagePlaceholder} className={`${styles.input} ${styles.textarea}`} />
        {values.message.length > LIMITS.message - 500 && (
          <p className={styles.counter} dir="ltr">
            {values.message.length} / {LIMITS.message}
          </p>
        )}
        {fieldError("message")}
      </div>

      <p className={styles.privacy}>
        {k.form.privacy.before}
        <a href={privacyHref}>{k.form.privacy.link}</a>
        {k.form.privacy.after}
      </p>

      <div aria-live="polite" className={styles.live}>
        {hasErrors && <p className={styles.summary}>{k.errors.summary}</p>}
        {status === "preview" && (
          <div className={styles.notice} role="status">
            <p className={styles.noticeTitle}>{k.result.previewTitle}</p>
            <p>{k.result.previewText}</p>
          </div>
        )}
      </div>
      {(status === "failed" || status === "rateLimited") && (
        <p className={styles.alert} role="alert">
          {status === "failed" ? k.result.failed : k.result.rateLimited}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={sending}>
          {sending && <span className={styles.spinner} aria-hidden="true" />}
          <span>{sending ? k.form.sending : k.form.submit}</span>
          {!sending && (
            <svg className={styles.arrow} viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          )}
        </button>
        {mode === "preview" && <p className={styles.previewBadge}>{k.form.previewBadge}</p>}
      </div>
    </form>
  );
}
