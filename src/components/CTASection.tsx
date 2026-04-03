"use client";

import { useLang } from "@/lib/LanguageContext";
import ContactForm from "@/components/ContactForm";

export default function CTASection() {
  const { t } = useLang();
  const c = t.cta;

  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-36">

      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-600/[0.09] blur-[130px]" />
        <div className="absolute left-1/2 bottom-0 h-[300px] w-[600px] -translate-x-1/2 translate-y-1/3 rounded-full bg-violet-600/[0.06] blur-[100px]" />
      </div>

      <div className="container-page relative">
        <div className="mx-auto max-w-2xl">

          {/* Heading */}
          <div className="animate-fade-up mb-12 text-center">
            <span className="label">{c.badge}</span>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">{c.headline}</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-slate-400">{c.sub}</p>
          </div>

          {/* Form card — elevated with glow border */}
          <div className="animate-fade-up delay-100 relative rounded-2xl border border-indigo-500/[0.18] bg-white/[0.03] p-8 shadow-[0_0_60px_rgba(99,102,241,0.08)] backdrop-blur-sm md:p-10">
            {/* Corner accent line */}
            <div className="absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            <ContactForm />
          </div>

        </div>
      </div>
    </section>
  );
}
