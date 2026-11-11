import { getLabContent, type Lang } from "@/site/content";
import FinalCta from "@/site/home/FinalCta";
import site from "@/site/site.module.css";
import page from "@/site/home/hero.module.css";
import ResourcesHub from "./ResourcesHub";
import { resourcesCopy, type Article } from "./resourcesCopy";
import styles from "./resources.module.css";

/**
 * Resources / Knowledge Hub (v5): shared header (logo still), a compact
 * editorial hero, the topic filters with the featured insight and the
 * latest-insights list (ResourcesHub, client), the compact CTA band and the
 * footer. `articles` are the published posts (website_posts), newest first.
 */
export default function ResourcesPage({ lang, articles }: { lang: Lang; articles: Article[] }) {
  const c = getLabContent(lang);
  const k = resourcesCopy[lang];

  return (
    <div className={`${page.page} ${site.underHeader}`} lang={lang} dir={c.dir}>
      <div className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>{k.eyebrow}</p>
          <h1 className={styles.title}>
            {k.title.lead}
            <span className={styles.accent}>{k.title.highlight}</span>
          </h1>
          <p className={styles.sub}>{k.sub}</p>
        </header>

        <ResourcesHub lang={lang} articles={articles} />

        <FinalCta lang={lang} copy={k.cta} compact />
      </div>
    </div>
  );
}
