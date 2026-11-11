import type { Lang } from "@/design-lab/content";
import { solutionsCopy } from "./solutionsCopy";
import styles from "./solutions.module.css";

/**
 * "Solutions in action": four editorial rows (number, title, description)
 * separated by thin champagne rules. Informational only: there are no
 * detail pages yet, so nothing here is a link. Scroll reveal uses the page's
 * existing LabMotion layer ([data-reveal]); the rules draw in with it.
 */
export default function Solutions({ lang }: { lang: Lang }) {
  const k = solutionsCopy[lang];

  return (
    <section id="solutions" className={styles.section} aria-labelledby="solutions-title">
      <header className={styles.head} data-reveal>
        <div>
          <p className={styles.eyebrow}>{k.eyebrow}</p>
          <h2 id="solutions-title" className={styles.title}>
            {k.title.lead}
            <span className={styles.accent}>{k.title.highlight}</span>
            {k.title.tail}
          </h2>
        </div>
        <p className={styles.sub}>{k.sub}</p>
      </header>

      <ol className={styles.rows}>
        {k.items.map((s, i) => (
          <li key={s.title} className={styles.row} data-reveal style={{ "--i": i * 1.5 } as React.CSSProperties}>
            <span className={styles.num} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <h3 className={styles.rowTitle}>{s.title}</h3>
            <p className={styles.text}>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
