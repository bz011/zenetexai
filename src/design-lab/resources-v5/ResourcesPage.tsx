import { getLabContent, type Lang } from "@/design-lab/content";
import { hanken, plexArabicA3 } from "@/design-lab/a3/fonts";
import SiteHeader from "@/design-lab/home-v5/SiteHeader";
import FinalCta from "@/design-lab/home-v5/FinalCta";
import Footer from "@/design-lab/home-v5/Footer";
import page from "@/design-lab/home-v5/hero.module.css";
import ResourcesHub from "./ResourcesHub";
import { resourcesCopy } from "./resourcesCopy";
import styles from "./resources.module.css";

/**
 * Resources / Knowledge Hub (v5): shared header (logo still), a compact
 * editorial hero, the topic filters with the featured insight and the
 * latest-insights list (ResourcesHub, client), the compact CTA band and the
 * footer. `liveArticleLinks` (design lab only) points article and blog links
 * at zentexai.com, since the local preview has no posts database.
 */
export default function ResourcesPage({ lang, liveArticleLinks = false }: { lang: Lang; liveArticleLinks?: boolean }) {
  const c = getLabContent(lang);
  const k = resourcesCopy[lang];
  const other = lang === "en" ? "/design-lab/ar/resources" : "/design-lab/resources";

  return (
    <div className={`${page.page} ${hanken.variable} ${plexArabicA3.variable}`} lang={lang} dir={c.dir}>
      <SiteHeader lang={lang} languageHref={other} current="/resources" logoIntro={false} />

      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>{k.eyebrow}</p>
          <h1 className={styles.title}>
            {k.title.lead}
            <span className={styles.accent}>{k.title.highlight}</span>
          </h1>
          <p className={styles.sub}>{k.sub}</p>
        </header>

        <ResourcesHub lang={lang} articleOrigin={liveArticleLinks ? "https://zentexai.com" : ""} />

        <FinalCta lang={lang} copy={k.cta} compact />
      </main>

      <Footer lang={lang} onHome={false} />
    </div>
  );
}
