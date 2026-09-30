"use client";

import { useState, FormEvent } from "react";
import { useLang } from "@/lib/LanguageContext";
import { formCopy } from "@/lib/chromeCopy";

interface FormData {
  name: string;
  email: string;
  company: string;
  inquiryType: string;
  message: string;
}

const empty: FormData = { name: "", email: "", company: "", inquiryType: "general", message: "" };

const inputCls =
  "w-full rounded-inner border border-line-strong bg-surface-0 px-4 py-3 text-[15px] text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-accent-fg focus:ring-2 focus:ring-accent-fg/25";
const labelCls = "mb-1.5 block text-small font-medium text-ink-2";

export default function ContactForm() {
  const { lang, t } = useLang();
  const f = t.form;

  const [form, setForm] = useState<FormData>(empty);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Same-origin route, not script.google.com directly - the browser
      // never talks to the destination itself (see src/app/api/contact/route.ts
      // for why: the CSP correctly has no reason to allow that origin).
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { success: boolean };
      if (!data.success) throw new Error();
      setSubmitted(true);
      setForm(empty);
    } catch {
      setError(formCopy[lang].error);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div role="status" className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-positive/40 bg-positive/10 text-positive">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-5 text-h3 text-ink">{f.success_title}</h3>
        <p className="mt-2 text-small text-ink-2">{f.success_sub}</p>
        <button type="button" onClick={() => setSubmitted(false)} className="btn-ghost mt-4">
          {f.send_another}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>
            {f.name} <span aria-hidden="true" className="text-accent-fg">*</span>
          </label>
          <input id="name" name="name" type="text" autoComplete="name" required value={form.name}
            onChange={handleChange} placeholder={f.name_placeholder} className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>
            {f.email} <span aria-hidden="true" className="text-accent-fg">*</span>
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required value={form.email}
            onChange={handleChange} placeholder={f.email_placeholder} className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="company" className={labelCls}>
          {f.company}{" "}
          <span className="text-caption font-normal text-ink-3">{f.company_optional}</span>
        </label>
        <input id="company" name="company" type="text" autoComplete="organization" value={form.company}
          onChange={handleChange} placeholder={f.company_placeholder} className={inputCls} />
      </div>

      <div>
        <label htmlFor="inquiryType" className={labelCls}>
          {f.inquiry_type}
        </label>
        <select id="inquiryType" name="inquiryType" autoComplete="off" value={form.inquiryType} onChange={handleChange} className={inputCls}>
          {t.contact.inquiry_types.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className={labelCls}>
          {f.message} <span aria-hidden="true" className="text-accent-fg">*</span>
        </label>
        <textarea id="message" name="message" rows={5} required autoComplete="off" value={form.message}
          onChange={handleChange} placeholder={f.message_placeholder}
          className={`${inputCls} resize-none`} />
      </div>

      {error && (
        <p role="alert" className="rounded-inner border border-danger/40 bg-danger/10 px-4 py-3 text-small text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? f.submitting : f.submit}
      </button>
    </form>
  );
}
