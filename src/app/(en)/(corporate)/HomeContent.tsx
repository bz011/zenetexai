"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import { homeCopy } from "@/lib/homeCopy";
import GovernedFlow from "@/components/flow/GovernedFlow";
import CTASection from "@/components/CTASection";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import type { PublishedPost } from "@/lib/posts";

function formatDate(iso: string, lang: "en" | "ar") {
  return new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

function excerpt(body: string, maxLen = 110) {
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-1 shrink-0 text-accent-fg">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  latestPosts: PublishedPost[];
}

export default function HomeContent({ latestPosts }: Props) {
  const { lang, t } = useLang();
  const c = homeCopy[lang];
  const h = t.home;

  return (
    <div>
      {/* ── Hero ─ text is plain HTML, visible at first paint (no entrance animation on copy) ── */}
      <section aria-labelledby="hero-title">
        <div className="container-page grid items-center gap-12 pb-16 pt-10 md:pb-24 md:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div>
            <p className="label">{c.hero.eyebrow}</p>
            <h1 id="hero-title" className="mt-4 text-display text-ink">{c.hero.title}</h1>
            <p className="mt-6 max-w-xl text-lead text-ink-2">{c.hero.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">{c.hero.ctaPrimary}</Link>
              <Link href="/services" className="btn-secondary">{c.hero.ctaSecondary}</Link>
            </div>
            <dl className="mt-10 grid gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-3">
              {c.hero.facts.map((f) => (
                <div key={f.k}>
                  <dt className="text-caption font-semibold uppercase tracking-[0.1em] text-ink-3">{f.k}</dt>
                  <dd className="mt-1 text-small text-ink">{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <GovernedFlow />
        </div>
      </section>

      {/* ── What we do: a plain, crawlable statement of what / who / how ── */}
      <Section bordered aria-labelledby="what-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader flush eyebrow={c.what.eyebrow} title={c.what.title} id="what-title" />
          <dl className="divide-y divide-line border-y border-line">
            {c.what.items.map((item) => (
              <div key={item.term} className="grid gap-2 py-6 md:grid-cols-[9.5rem_minmax(0,1fr)] md:gap-6">
                <dt className="font-heading text-h4 text-ink">{item.term}</dt>
                <dd className="text-body text-ink-2">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* ── Services: an index, each with its own mechanism ── */}
      <Section bordered aria-labelledby="services-title">
        <SectionHeader eyebrow={c.services.eyebrow} title={c.services.title} description={c.services.sub} id="services-title" />
        <ul className="divide-y divide-line border-y border-line">
          {c.services.build.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="group grid gap-x-8 gap-y-2 py-6 transition-colors hover:bg-surface-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_auto] md:px-3"
              >
                <h3 className="text-h3 text-ink">{s.name}</h3>
                <div>
                  <p className="text-body text-ink-2">{s.line}</p>
                  <p className={`mt-2 text-caption text-ink-3 ${lang === "en" ? "font-mono" : ""}`}>{s.flow}</p>
                </div>
                <span aria-hidden="true" className="hidden items-center text-accent-fg md:flex">
                  <Chevron className="transition-transform duration-150 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] md:gap-8">
          <p className="label">{c.services.advisoryTitle}</p>
          <ul className="grid gap-6 sm:grid-cols-2">
            {c.services.advisory.map((a) => (
              <li key={a.name}>
                <h3 className="font-heading text-h4 text-ink">{a.name}</h3>
                <p className="mt-1 text-small text-ink-2">{a.line}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8">
          <Link href="/services" className="btn-ghost">{c.services.allServices} <Chevron className="rtl:rotate-180" /></Link>
        </div>
      </Section>

      {/* ── Working principles: statements, not claim cards ── */}
      <Section bordered aria-labelledby="principles-title">
        <SectionHeader eyebrow={c.principles.eyebrow} title={c.principles.title} id="principles-title" />
        <ol className="grid gap-x-16 gap-y-10 md:grid-cols-2">
          {c.principles.items.map((p, i) => (
            <li key={p.title} className="border-t border-line-strong pt-5">
              <p aria-hidden="true" className="font-mono text-caption text-ink-3">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-h3 text-ink">{p.title}</h3>
              <p className="mt-2 max-w-md text-body text-ink-2">{p.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Featured program ── */}
      <Section bordered aria-labelledby="program-title">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div>
            <p className="label">{h.featured_eyebrow}</p>
            <h2 id="program-title" className="mt-3 text-h2 text-ink">{h.featured_h2_line1}</h2>
            <p className="mt-5 text-body text-ink-2">{h.featured_p1}</p>
            <p className="mt-3 text-body text-ink-2">{h.featured_p2}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="btn-primary">{h.featured_btn1}</Link>
              <Link href="/academy" className="btn-secondary">{h.featured_btn2}</Link>
            </div>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {h.featured_features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 py-4 text-body text-ink-2">
                <Check />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── Founder ── */}
      <Section bordered tight aria-labelledby="founder-title">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader flush eyebrow={h.founder_eyebrow} title={h.founder_h2} id="founder-title" />
          <div>
            <p className="text-body text-ink-2">{h.founder_summary}</p>
            <div className="mt-4">
              <Link href="/about" className="btn-ghost">{h.founder_btn}</Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Latest articles (only when published) ── */}
      {latestPosts.length > 0 && (
        <Section bordered aria-labelledby="articles-title">
          <SectionHeader eyebrow={t.nav.blog} title={h.articles_h2} description={h.articles_sub} id="articles-title" />
          <ul className="divide-y divide-line border-y border-line">
            {latestPosts.map((post) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group grid gap-x-8 gap-y-1 py-5 transition-colors hover:bg-surface-1 md:grid-cols-[9rem_minmax(0,1fr)] md:px-3">
                  <p className="text-caption text-ink-3">{formatDate(post.published_at, lang)}</p>
                  <div>
                    <h3 className="text-h4 text-ink">{post.title}</h3>
                    <p className="mt-1 text-small text-ink-2">{excerpt(post.body)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link href="/blog" className="btn-ghost">{h.articles_view_all}</Link>
          </div>
        </Section>
      )}

      <CTASection />
    </div>
  );
}
