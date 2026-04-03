"use client";

import { useState, FormEvent } from "react";
import { useLang } from "@/lib/LanguageContext";

interface FormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

const empty: FormData = { name: "", email: "", company: "", message: "" };

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

export default function ContactForm() {
  const { t } = useLang();
  const f = t.form;

  const [form, setForm] = useState<FormData>(empty);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    console.log("Contact form submission:", form);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm(empty);
    }, 900);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-5 text-lg font-semibold text-white">{f.success_title}</h3>
        <p className="mt-2 text-[14px] text-slate-400">{f.success_sub}</p>
        <button
          onClick={() => setSubmitted(false)}
          className="btn-ghost mt-6 text-[13px]"
        >
          {f.send_another}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-slate-400">
            {f.name} <span className="text-indigo-400">*</span>
          </label>
          <input id="name" name="name" type="text" required value={form.name}
            onChange={handleChange} placeholder={f.name_placeholder} className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-slate-400">
            {f.email} <span className="text-indigo-400">*</span>
          </label>
          <input id="email" name="email" type="email" required value={form.email}
            onChange={handleChange} placeholder={f.email_placeholder} className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="company" className="mb-1.5 block text-[13px] font-medium text-slate-400">
          {f.company}{" "}
          <span className="text-[12px] font-normal text-slate-600">{f.company_optional}</span>
        </label>
        <input id="company" name="company" type="text" value={form.company}
          onChange={handleChange} placeholder={f.company_placeholder} className={inputCls} />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-[13px] font-medium text-slate-400">
          {f.message} <span className="text-indigo-400">*</span>
        </label>
        <textarea id="message" name="message" rows={5} required value={form.message}
          onChange={handleChange} placeholder={f.message_placeholder}
          className={`${inputCls} resize-none`} />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[14px]">
        {loading ? f.submitting : f.submit}
      </button>
    </form>
  );
}
