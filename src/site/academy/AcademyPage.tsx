import Image from "next/image";
import { getLabContent, type Lang } from "@/site/content";
import LabMotion from "@/site/RevealMotion";
import FinalCta from "@/site/home/FinalCta";
import page from "@/site/home/hero.module.css";
import heroArt from "../../../public/images/academy/academy-hero.webp";
import masteryArt from "../../../public/images/academy/program-pmp-mastery.webp";
import simulatorArt from "../../../public/images/academy/program-pmp-simulator.webp";
import { formatMoney } from "@/features/commerce/utils/money";
import type { EffectivePrice } from "@/features/commerce/types/commerce";
import { academyCopy, type FeatureIcon } from "./academyCopy";
import styles from "./academy.module.css";

/**
 * Academy overview (v5), after the approved reference (design-references/
 * ZentexAI Academy Learning Programs.png): shared header (logo still), a
 * compact two-column hero with the education illustration, the two programs
 * side by side, the compact CTA band (scrolling to the programs) and the
 * footer. Illustrations (public/images/academy/): the hero art keeps its own
 * soft transparency; the two program images are trimmed to their artwork
 * (1.28:1) and shown whole on their own ivory. Decorative, so alt="".
 * Motion: hero and illustration rise in once; panels reveal on scroll
 * (LabMotion). Nothing is hidden without JS or under reduced motion.
 */

const art = { mastery: masteryArt, simulator: simulatorArt };

const icons: Record<FeatureIcon, React.ReactNode> = {
  // Stacked layers.
  modules: <path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z M3.5 12l8.5 4.5 8.5-4.5 M3.5 16l8.5 4.5 8.5-4.5" />,
  // A play button in a circle.
  quiz: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 8.8v6.4l5-3.2z" />
    </>
  ),
  // A rosette with ribbons.
  certificate: (
    <>
      <circle cx="12" cy="9.5" r="5.5" />
      <path d="M8.6 13.8L7 20.5l5-2.6 5 2.6-1.6-6.7" />
    </>
  ),
  // A question mark in a circle.
  exam: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 16.8v.2" />
    </>
  ),
  // Stacked layers: repeated sessions.
  practice: <path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z M3.5 12l8.5 4.5 8.5-4.5 M3.5 16l8.5 4.5 8.5-4.5" />,
  // Bars.
  results: <path d="M4 20.5h16M6.5 17v-4.5M11 17V8M15.5 17v-6M20 17V4.5" />,
};

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/**
 * Rendered inside the Academy shell (its own sticky header), so the hero
 * needs no space for an overlay header (--header: 0). Prices: `prices` maps
 * product slug -> effective price from the commerce tables; none is shown
 * when it is unknown, and "Free" only for an active AED 0 promotion.
 */
/** Display label of a product's effective price (commerce tables), or null when unknown. */
export function priceLabel(price: EffectivePrice | null | undefined, lang: Lang): string | null {
  if (!price) return null;
  if (price.isPromotionActive && price.effectiveAmountMinorUnits === 0) return lang === "ar" ? "مجاني" : "Free";
  return formatMoney(price.effectiveAmountMinorUnits, price.currency);
}

const slugOf = (href: string) => href.replace(/^\/courses\//, "");

export default function AcademyPage({ lang, prices }: { lang: Lang; prices: Record<string, EffectivePrice | null> }) {
  const c = getLabContent(lang);
  const k = academyCopy[lang];
  const programHref = (_id: string, href: string) => c.href(href);

  return (
    <div className={`${page.page}`} lang={lang} dir={c.dir} style={{ ["--header" as string]: "0px" }}>
      <div>
        <section className={styles.hero} aria-labelledby="ac-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{k.eyebrow}</p>
              <h1 id="ac-title" className={styles.title}>
                <span className={styles.lead}>{k.title.lead}</span>{" "}
                <span className={styles.accent}>{k.title.highlight}</span>
              </h1>
              <p className={styles.sub}>{k.sub}</p>
              <p className={styles.actions}>
                <a href="#programs" className={styles.button}>
                  {k.heroCta}
                  <Arrow />
                </a>
              </p>
            </div>
            <div className={styles.heroArt}>
              <Image src={heroArt} alt="" sizes="(max-width: 640px) 100vw, (max-width: 900px) 92vw, 60vw" quality={90} priority />
            </div>
          </div>
        </section>

        <section id="programs" className={styles.programs} aria-labelledby="ac-programs">
          <div className={styles.programsHead}>
            <h2 id="ac-programs" className={styles.programsTitle}>{k.programsTitle}</h2>
            <span className={styles.rule} aria-hidden="true" />
            <p className={styles.programsSub}>{k.programsSub}</p>
          </div>

          <ul className={styles.panels}>
            {k.programs.map((p, i) => (
              <li key={p.id} className={styles.panel} data-reveal style={{ "--i": i } as React.CSSProperties}>
                <div className={styles.media}>
                  <Image src={art[p.id]} alt="" sizes="(max-width: 640px) 70vw, 300px" quality={90} priority={i === 0} />
                </div>
                <div className={styles.body}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.programTitle}>{p.title}</h3>
                    {priceLabel(prices[slugOf(p.href)], lang) && (
                      <span className={styles.price}>{priceLabel(prices[slugOf(p.href)], lang)}</span>
                    )}
                  </div>
                  <p className={styles.desc}>{p.desc}</p>
                  <ul className={styles.features}>
                    {p.features.map((f) => (
                      <li key={f.label}>
                        <svg className={styles.featureIcon} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                          {icons[f.icon]}
                        </svg>
                        <span>{f.label}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.programAction}>
                    <a href={programHref(p.id, p.href)} className={styles.button}>
                      {p.cta}
                      <Arrow />
                    </a>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <FinalCta lang={lang} copy={k.cta} href="#programs" compact />
      </div>
      <LabMotion />
    </div>
  );
}
