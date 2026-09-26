"use client";

import { useLang } from "@/lib/LanguageContext";
import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/ui/PageHero";

export default function ContactContent() {
  const { t } = useLang();
  const ct = t.contact;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <PageHero eyebrow={ct.hero_eyebrow} title={ct.hero_h1} sub={ct.hero_sub} />

      {/* Content */}
      <section className="px-6 py-20">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* Form */}
            <div className="card p-8">
              <h2 className="mb-6 text-[16px] font-semibold text-ink">{ct.form_heading}</h2>
              <ContactForm />
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {ct.details.map((item) => (
                <div key={item.id} className="card p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-accent/40 bg-accent/10 text-[15px] text-accent-fg">
                      {item.icon}
                    </div>
                    <div>
                      <p className="label text-[10px]">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="mt-0.5 block text-[14px] font-medium text-ink hover:text-accent-fg transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-[14px] font-medium text-ink">{item.value}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-card border border-accent/40 bg-accent/10 p-5">
                <p className="text-[13px] leading-relaxed text-ink-2">{ct.note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
