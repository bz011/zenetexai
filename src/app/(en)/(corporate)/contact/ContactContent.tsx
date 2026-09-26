"use client";

import { useLang } from "@/lib/LanguageContext";
import ContactForm from "@/components/ContactForm";

export default function ContactContent() {
  const { t } = useLang();
  const ct = t.contact;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-20 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.1] blur-[100px]" />
        <div className="container-page relative text-center">
          <span className="label">{ct.hero_eyebrow}</span>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">{ct.hero_h1}</h1>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-slate-400">{ct.hero_sub}</p>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 py-20">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* Form */}
            <div className="card p-8">
              <h2 className="mb-6 text-[16px] font-semibold text-white">{ct.form_heading}</h2>
              <ContactForm />
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {ct.details.map((item) => (
                <div key={item.id} className="card p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/[0.08] text-[15px] text-indigo-400">
                      {item.icon}
                    </div>
                    <div>
                      <p className="label text-[10px]">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="mt-0.5 block text-[14px] font-medium text-white hover:text-indigo-300 transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-[14px] font-medium text-white">{item.value}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-indigo-500/[0.15] bg-indigo-500/[0.05] p-5">
                <p className="text-[13px] leading-relaxed text-slate-400">{ct.note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
