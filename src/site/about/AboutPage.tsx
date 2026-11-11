import { getLabContent, type Lang } from "@/site/content";
import site from "@/site/site.module.css";
import LabMotion from "@/site/RevealMotion";
import FinalCta from "@/site/home/FinalCta";
import page from "@/site/home/hero.module.css";
import { aboutCopy } from "./aboutCopy";
import styles from "./about.module.css";
import HeroPortrait from "./HeroPortrait";

/**
 * About page (v5): a founder-led hero (the headline and description beside
 * the founder's transparent portrait, set into the ivory page, see
 * HeroPortrait), "Who we are" as an editorial spread, three principles on a
 * sand band, a type-led founder section (the portrait is not repeated), then
 * the shared CTA band and footer. Server-rendered; the hero rises in once and
 * sections reveal on scroll (LabMotion). Reduced motion: static.
 */

export default function AboutPage({ lang }: { lang: Lang }) {
  const c = getLabContent(lang);
  const k = aboutCopy[lang];

  return (
    <div className={`${page.page} ${site.underHeader}`} lang={lang} dir={c.dir}>
      <div className={styles.main}>
        <section className={styles.hero} aria-labelledby="ab-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{k.eyebrow}</p>
            <h1 id="ab-title" className={styles.title}>
              <span className={styles.line}>{k.title.lead}</span>{" "}
              <span className={`${styles.line} ${styles.accent}`}>{k.title.highlight}</span>
            </h1>
            <p className={styles.sub}>{k.sub}</p>
          </div>
          <HeroPortrait alt={k.founder.portraitAlt} />
        </section>

        <section className={styles.who} aria-labelledby="ab-who">
          <div className={styles.whoHead} data-reveal>
            <p className={styles.kicker}>{k.who.eyebrow}</p>
            <h2 id="ab-who" className={styles.h2}>{k.who.title}</h2>
          </div>
          <div className={styles.whoBody}>
            <p className={styles.lead} data-reveal>{k.who.lead}</p>
            <p className={styles.body} data-reveal>{k.who.body}</p>
            <dl className={styles.focus}>
              {k.who.focus.map((f, i) => (
                <div key={f.title} data-reveal style={{ "--i": i } as React.CSSProperties}>
                  <dt>{f.title}</dt>
                  <dd>{f.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={styles.think} aria-labelledby="ab-think">
          <div className={styles.thinkInner}>
            <div className={styles.thinkHead} data-reveal>
              <p className={styles.kicker}>{k.think.eyebrow}</p>
              <h2 id="ab-think" className={styles.h2}>{k.think.title}</h2>
            </div>
            <ol className={styles.principles}>
              {k.think.principles.map((p, i) => (
                <li key={p.title} data-reveal style={{ "--i": i } as React.CSSProperties}>
                  <span className={styles.num} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className={styles.h3}>{p.title}</h3>
                  <p>{p.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.founder} aria-labelledby="ab-founder">
          <div className={styles.founderHead} data-reveal>
            <p className={styles.kicker}>{k.founder.eyebrow}</p>
            <h2 id="ab-founder" className={styles.name}>{k.founder.name}</h2>
            <p className={styles.role}>{k.founder.role}</p>
          </div>
          <div className={styles.founderBody} data-reveal>
            <ul className={styles.credentials}>
              {k.founder.credentials.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className={styles.bio}>{k.founder.bio}</p>
          </div>
        </section>

        <FinalCta lang={lang} copy={k.cta} compact />
      </div>
      <LabMotion />
    </div>
  );
}
