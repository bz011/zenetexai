"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import HeroSection from "@/components/HeroSection";
import CTASection from "@/components/CTASection";
import type { PublishedPost } from "@/lib/posts";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function excerpt(body: string, maxLen = 110) {
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

interface Props {
  latestPosts: PublishedPost[];
}

export default function HomeContent({ latestPosts }: Props) {
  const { t } = useLang();
  const h = t.home;
  const sv = t.services;

  return (
    <>
      <HeroSection />

      {/* ── Core Services ───────────────────────────────────────────────── */}
      <section className="py-36">
        <div className="container-page">
          <div className="animate-fade-up mb-16 max-w-lg">
            <span className="label">{h.core_services_eyebrow}</span>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">{h.core_services_h2}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-400">{h.core_services_sub}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {sv.categories.map((cat, i) => (
              <div
                key={cat.id}
                className="animate-fade-up card card-hover p-7"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <span className="label text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2.5 text-[16px] font-semibold text-white">{cat.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-slate-400">{cat.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {cat.examples.slice(0, 3).map((ex) => (
                    <span key={ex} className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/services" className="btn-ghost">{h.core_services_link}</Link>
          </div>
        </div>
      </section>

      {/* ── Why ZentexAI ───────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] py-36">
        <div className="container-page">
          <div className="animate-fade-up mb-16 text-center">
            <span className="label">{h.why_eyebrow}</span>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">{h.why_h2}</h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-slate-400">{h.why_sub}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {h.benefits.map((b, i) => (
              <div
                key={b.title}
                className="animate-fade-up card card-hover p-7"
                style={{ animationDelay: `${100 + i * 60}ms` }}
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-indigo-500 to-violet-500" />
                <h3 className="text-[15px] font-semibold text-white">{b.title}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Product: PMP Mastery Program ─────────────────────── */}
      <section className="border-t border-white/[0.06] py-36">
        <div className="container-page">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="animate-fade-up">
              <span className="label">{h.featured_eyebrow}</span>
              <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                {h.featured_h2_line1}
                <br />
                <span className="gradient-text">{h.featured_h2_line2}</span>
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-slate-400">{h.featured_p1}</p>
              <p className="mt-3.5 text-[15px] leading-relaxed text-slate-400">{h.featured_p2}</p>
              <div className="mt-9 flex gap-3">
                <Link href="/courses" className="btn-primary">{h.featured_btn1}</Link>
                <Link href="/academy" className="btn-secondary">{h.featured_btn2}</Link>
              </div>
            </div>

            <div className="space-y-3">
              {h.featured_features.map((feature, i) => (
                <div
                  key={feature}
                  className="animate-fade-up flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-4"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span className="text-[14px] leading-relaxed text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Meet the Founder ───────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] py-32">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="label">{h.founder_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{h.founder_h2}</h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-slate-400">{h.founder_summary}</p>
            <div className="mt-7">
              <Link href="/about" className="btn-ghost">{h.founder_btn}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest Articles ────────────────────────────────────────────── */}
      {latestPosts.length > 0 && (
        <section className="border-t border-white/[0.06] py-32">
          <div className="container-page">
            <div className="animate-fade-up mb-12 text-center">
              <span className="label">{t.nav.blog}</span>
              <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{h.articles_h2}</h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] text-slate-400">{h.articles_sub}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card card-hover block p-6">
                  <p className="text-[11px] text-slate-500">{formatDate(post.published_at)}</p>
                  <h3 className="mt-2 text-[14px] font-semibold leading-snug text-white">{post.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{excerpt(post.body)}</p>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/blog" className="btn-ghost">{h.articles_view_all}</Link>
            </div>
          </div>
        </section>
      )}

      <CTASection />
    </>
  );
}
