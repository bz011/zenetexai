import { getLabContent, type Lang } from "@/site/content";
import site from "@/site/site.module.css";
import { hanken, plexArabicA3 } from "@/site/fonts";
import FinalCta from "@/site/home/FinalCta";
import { iconPaths } from "@/site/home/Services";
import page from "@/site/home/hero.module.css";
import { servicesCopy } from "./servicesCopy";
import styles from "./services.module.css";

/**
 * Services overview (v5): the shared header (logo still), a short two-column
 * hero, six linked service rows (the homepage's line icons), the CTA band with
 * this page's copy, and the footer. The hero has no picture yet: three thin
 * lines balance it on desktop until a dedicated visual exists. Motion: the
 * hero rises in once, rows respond to hover. Nothing is hidden without JS or
 * under reduced motion.
 */
/**
 * The production section anchors (/services#ai-solutions etc.), used by the
 * Service structured data and by links elsewhere on the site; kept so those
 * URLs keep landing on the right service.
 */
const SECTION_ANCHOR: Partial<Record<string, string>> = {
  agents: "ai-solutions",
  data: "data-analytics",
  ml: "machine-learning",
  advice: "ai-consulting",
  pm: "pm-consulting",
};

export default function ServicesPage({ lang }: { lang: Lang }) {
  const c = getLabContent(lang);
  const k = servicesCopy[lang];

  return (
    <div className={`${page.page} ${site.underHeader} ${hanken.variable} ${plexArabicA3.variable}`} lang={lang} dir={c.dir}>
      <div>
        <section className={styles.hero} aria-labelledby="sv-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{k.eyebrow}</p>
              <h1 id="sv-title" className={styles.title}>
                {k.title.lead}
                <span className={styles.accent}>{k.title.highlight}</span>
              </h1>
              <p className={styles.sub}>{k.sub}</p>
              <p className={styles.actions}>
                <a href={c.href("/contact")} className={page.btnInk}>{k.heroCta}</a>
              </p>
            </div>
            <svg className={styles.flow} viewBox="0 0 560 420" preserveAspectRatio="xMaxYMid meet" aria-hidden="true" focusable="false">
              <path pathLength={1} className={styles.gold} d="M 600 40 C 470 60, 400 150, 320 220 S 140 330, 20 340" />
              <path pathLength={1} className={styles.teal} d="M 600 110 C 490 130, 420 210, 340 280 S 170 390, 40 400" />
              <path pathLength={1} className={styles.gold2} d="M 600 0 C 500 15, 430 80, 370 140 S 220 240, 80 250" />
            </svg>
          </div>
        </section>

        <section className={styles.services} aria-labelledby="sv-list">
          <div className={styles.listHead}>
            <h2 id="sv-list" className={styles.listTitle}>{k.listTitle}</h2>
            <p className={styles.listSub}>{k.listSub}</p>
          </div>
          <ul className={styles.rows}>
            {k.services.map((s) => (
              <li key={s.name} id={SECTION_ANCHOR[s.icon]} className={styles.anchored}>
                <a href={c.href(s.href)} className={styles.row}>
                  <svg className={styles.icon} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    {iconPaths[s.icon]}
                  </svg>
                  <span className={styles.name}>{s.name}</span>
                  <span className={styles.line}>{s.line}</span>
                  <svg className={styles.arrow} viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <FinalCta lang={lang} copy={k.cta} />
      </div>
    </div>
  );
}
