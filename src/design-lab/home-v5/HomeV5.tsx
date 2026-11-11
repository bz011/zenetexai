import { Fragment } from "react";
import Image from "next/image";
import { getLabContent, type Lang } from "@/design-lab/content";
import { hanken, plexArabicA3 } from "@/design-lab/a3/fonts";
import LabMotion from "@/design-lab/LabMotion";
import HeroParticles from "./HeroParticles";
import profile from "../../../public/design-lab/services/ai-profile.png";
import { homeV5Copy } from "./copy";
import Services from "./Services";
import BusinessValue from "./BusinessValue";
import Approach from "./Approach";
import Solutions from "./Solutions";
import FinalCta from "./FinalCta";
import Footer from "./Footer";
import SiteHeader from "./SiteHeader";
import styles from "./hero.module.css";

/**
 * Homepage v5, a refinement of v4: Hero D's header, copy and controls with the
 * AI profile, the dataflow services section, three business-value sections
 * "Our approach", "Solutions in action" and the final call to action, in
 * one <main>; then the footer.
 * The profile keeps its own proportions so the particle layer (HeroParticles)
 * lines up with it; the image itself never moves and is never mirrored.
 * In Arabic the copy keeps its physical place on the left.
 */
export default function HomeV5({ lang }: { lang: Lang }) {
  const c = getLabContent(lang);
  const k = homeV5Copy.hero[lang];
  const h = c.href;

  return (
    <div className={`${styles.page} ${hanken.variable} ${plexArabicA3.variable}`} lang={lang} dir={c.dir}>
      <SiteHeader lang={lang} languageHref={k.language.href} />

      <main>
        <section className={styles.hero} aria-labelledby="h5-title">
          <div className={styles.media}>
            <div className={styles.mediaInner}>
              <Image
                src={profile}
                alt=""
                priority
                quality={88}
                sizes="(max-width: 900px) 185vw, 1480px"
                placeholder="blur"
                className={styles.img}
              />
              <HeroParticles className={styles.particles} />
            </div>
          </div>
          <div className={styles.inner}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>
                {k.eyebrow.map((part, i) => (
                  <Fragment key={part}>
                    {i > 0 && " "}
                    <span className={styles.part}>
                      {i > 0 && <span className={styles.sep} aria-hidden="true">·&nbsp;</span>}
                      {part}
                    </span>
                  </Fragment>
                ))}
              </p>
              <h1 id="h5-title" className={styles.title}>
                {k.title.lead}{" "}
                <span className={styles.line}>
                  {k.title.pre}
                  <span className={styles.accent}>{k.title.highlight}</span>
                  {k.title.tail}
                </span>
              </h1>
              <p className={styles.sub}>{k.sub}</p>
              <p className={styles.actions}>
                <a href={h("/services")} className={styles.btnInk}>{k.primary}</a>
                <a href={h("/contact")} className={styles.btnLine}>{k.secondary}</a>
              </p>
            </div>
          </div>
        </section>

        <Services lang={lang} />
        <BusinessValue lang={lang} />
        <Approach lang={lang} />
        <Solutions lang={lang} />
        <FinalCta lang={lang} />
      </main>
      <Footer lang={lang} />
      <LabMotion />
    </div>
  );
}
