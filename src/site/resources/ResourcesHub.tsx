"use client";

import { useState } from "react";
import type { Lang } from "@/site/content";
import { formatArticleDate } from "./formatDate";
import { localizeHref } from "@/lib/i18nRoutes";
import translations from "@/lib/translations";
import InsightNetwork from "./InsightNetwork";
import { FEATURED_SLUG, resourcesCopy, type Article, type Topic } from "./resourcesCopy";
import styles from "./resources.module.css";

type Filter = "all" | Topic;
const FILTERS: Filter[] = ["all", "ai", "data", "pm"];

/**
 * Topic filters, the featured insight and the latest-insights list. Filtering
 * is client-side over the real article list (topics derived from slugs, see
 * resourcesCopy.ts). The featured article shows under "All topics" and its
 * own topic, and is never repeated in the list. Without JavaScript everything
 * renders under "All topics".
 *
 * `articleOrigin`: "" in production (relative /blog links); the design lab
 * passes the live origin, because the local preview has no posts database
 * and /blog/<slug> answers 404 there.
 */
export default function ResourcesHub({ lang, articles, articleOrigin = "" }: { lang: Lang; articles: Article[]; articleOrigin?: string }) {
  const k = resourcesCopy[lang];
  const [filter, setFilter] = useState<Filter>("all");
  // The designated feature when it is published, otherwise the newest article.
  const featured: Article | undefined = articles.find((a) => a.slug === FEATURED_SLUG) ?? articles[0];
  const rest = articles.filter((a) => a !== featured);
  const matches = (a: Article) => filter === "all" || a.topic === filter;
  const list = rest.filter(matches);
  const showFeatured = !!featured && matches(featured);
  const total = list.length + (showFeatured ? 1 : 0);
  const href = (slug: string) => `${articleOrigin}${localizeHref(`/blog/${slug}`, lang)}`;
  const count = (f: Filter) => articles.filter((a) => f === "all" || a.topic === f).length;
  const other = (a: Article) => a.lang !== lang;

  return (
    <>
      <div className={styles.filters} role="group" aria-label={k.filtersLabel}>
        {FILTERS.map((f) => (
          <button key={f} type="button" className={styles.pill} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? k.all : k.topics[f]}
            <span className={styles.pillCount}>{count(f)}</span>
          </button>
        ))}
      </div>
      <p className={styles.srOnly} aria-live="polite">
        {k.count(total)}
      </p>

      <div key={filter} className={styles.results}>
        {articles.length === 0 && <p className={styles.empty}>{translations[lang].resources.articles_empty}</p>}
        {showFeatured && featured && (
          <article className={styles.featured} aria-labelledby="rs-featured">
            <div className={styles.featuredCopy}>
              <p className={styles.featuredLabel}>
                {k.featuredLabel}
                {featured.topic && <span className={styles.topicTag}>{k.topics[featured.topic]}</span>}
              </p>
              <h2 id="rs-featured" className={styles.featuredTitle}>
                <a href={href(featured.slug)} lang={featured.lang} dir="auto" className={styles.featuredLink}>
                  {featured.title}
                </a>
              </h2>
              <p className={styles.excerpt}>{k.featuredExcerpt}</p>
              <p className={styles.featuredMeta}>
                <time dateTime={featured.date}>{formatArticleDate(featured.date, lang)}</time>
                {other(featured) && <span className={styles.langTag}>{k.otherLang}</span>}
              </p>
              <a href={href(featured.slug)} className={styles.readMore} aria-describedby="rs-featured">
                {k.read}
                <Arrow />
              </a>
            </div>
            <div className={styles.featuredArt}>
              <InsightNetwork />
            </div>
          </article>
        )}

        <section className={styles.latest} aria-labelledby="rs-latest">
          <div className={styles.latestHead}>
            <h2 id="rs-latest" className={styles.latestTitle}>{k.latest}</h2>
            <a href={`${articleOrigin}${localizeHref("/blog", lang)}`} className={styles.viewAll}>
              {k.viewAll}
              <Arrow />
            </a>
          </div>

          {list.length > 0 ? (
            <ul className={styles.list}>
              {list.map((a, i) => (
                <li key={a.slug} style={{ "--i": i } as React.CSSProperties}>
                  <a href={href(a.slug)} className={styles.row}>
                    <span className={styles.rowTitle} lang={a.lang} dir="auto">{a.title}</span>
                    <span className={styles.rowMeta}>
                      {a.topic && <span className={styles.rowTopic}>{k.topics[a.topic]}</span>}
                      {other(a) && <span className={styles.langTag}>{k.otherLang}</span>}
                      <time dateTime={a.date} className={styles.rowDate}>{formatArticleDate(a.date, lang)}</time>
                    </span>
                    <Arrow />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            !showFeatured && (
              <p className={styles.empty}>
                {k.empty}{" "}
                <a href={localizeHref(k.emptyHref, lang)} className={styles.emptyLink}>{k.emptyLink}</a>
              </p>
            )
          )}
        </section>
      </div>
    </>
  );
}

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
