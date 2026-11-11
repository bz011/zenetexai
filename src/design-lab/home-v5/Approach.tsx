import type { Lang } from "@/design-lab/content";
import { approachCopy } from "./approachCopy";
import ApproachMotion from "./ApproachMotion";
import styles from "./approach.module.css";

/**
 * "Our approach": three stages on one timeline, joined by a thin champagne
 * line (horizontal on wide screens, vertical on phones; it runs in the
 * reading direction, so it starts on the right in Arabic). Plain markup and
 * CSS; ApproachMotion only adds the one-time entrance sequence, so all
 * content is visible without JavaScript and under reduced motion.
 */
export default function Approach({ lang }: { lang: Lang }) {
  const k = approachCopy[lang];

  return (
    <section id="approach" className={styles.section} aria-labelledby="approach-title">
      <header className={styles.head}>
        <p className={styles.eyebrow}>{k.eyebrow}</p>
        <h2 id="approach-title" className={styles.title}>
          {k.title.lead}
          <span className={styles.accent}>{k.title.highlight}</span>
          {k.title.tail}
        </h2>
        <p className={styles.sub}>{k.sub}</p>
      </header>

      <ol className={styles.stages}>
        {k.stages.map((s, i) => (
          <li key={s.title} className={styles.stage} style={{ "--n": i } as React.CSSProperties}>
            <span className={styles.marker} aria-hidden="true">
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
            </span>
            {i < k.stages.length - 1 && (
              <span className={styles.link} aria-hidden="true">
                <span className={styles.linkLine} />
                <span className={styles.glow} />
              </span>
            )}
            <div className={styles.body}>
              <h3 className={styles.stageTitle}>{s.title}</h3>
              <p className={styles.text}>{s.text}</p>
              <ul className={styles.keywords}>
                {s.keywords.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      {/* Flowing lines along the foot of the section (decorative). */}
      <svg className={styles.flow} viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path pathLength={1} d="M0 96 C 240 40, 420 130, 720 84 S 1180 30, 1440 76" className={styles.gold} />
        <path pathLength={1} d="M0 110 C 260 70, 480 140, 760 102 S 1200 58, 1440 96" className={styles.teal} />
        <path pathLength={1} d="M0 82 C 300 30, 520 118, 800 74 S 1220 46, 1440 62" className={styles.gold2} />
      </svg>

      <ApproachMotion targetId="approach" />
    </section>
  );
}
