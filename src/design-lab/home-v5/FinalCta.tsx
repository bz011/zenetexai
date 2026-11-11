import { getLabContent, type Lang } from "@/design-lab/content";
import { ctaCopy, type CtaCopy } from "./ctaCopy";
import CtaMotion from "./CtaMotion";
import styles from "./cta.module.css";

/**
 * Final call to action: a dark-teal band with a centred headline and one
 * champagne button to the contact page. Thin curves sweep in from the outer
 * edges (SVG, decorative), kept clear of the text. CtaMotion adds the one-time
 * entrance and runs the slow line motion only while the band is on screen.
 */

// Corner arcs for one side (bottom left, in a 400 x 400 box anchored to the
// corner); the right side is the same art mirrored. Each enters and leaves
// off-canvas, so no line ends in mid-air.
const curves = [
  "M 400 430 C 320 330, 180 250, -30 210",
  "M 300 430 C 230 360, 120 310, -30 290",
  "M 400 410 C 320 300, 190 180, -30 110",
];

function Side({ className }: { className: string }) {
  return (
    <svg className={`${styles.lines} ${className}`} viewBox="0 0 400 400" preserveAspectRatio="xMinYMax meet" aria-hidden="true" focusable="false">
      <g className={styles.drift}>
        <path d={curves[0]} pathLength={1} className={styles.gold} />
        <path d={curves[1]} pathLength={1} className={styles.teal} />
        <path d={curves[2]} pathLength={1} className={styles.gold2} />
        {/* A short light travelling along the first curve. */}
        <path d={curves[0]} pathLength={1} className={styles.spark} />
      </g>
    </svg>
  );
}

/**
 * `copy` and `href` let an inner page use the same band with its own words and
 * destination; `compact` is a shorter band for a headline without body text.
 */
export default function FinalCta({ lang, copy, href, compact = false }: { lang: Lang; copy?: CtaCopy; href?: string; compact?: boolean }) {
  const c = getLabContent(lang);
  const k = copy ?? ctaCopy[lang];

  return (
    <section id="lets-connect" className={compact ? `${styles.section} ${styles.compact}` : styles.section} aria-labelledby="cta-title">
      <Side className={styles.start} />
      <Side className={styles.end} />

      <div className={styles.inner}>
        {k.eyebrow && <p className={styles.eyebrow}>{k.eyebrow}</p>}
        <h2 id="cta-title" className={styles.title}>
          <span className={styles.line}>{k.lead}</span>{" "}
          {k.highlight && <span className={`${styles.line} ${styles.accent}`}>{k.highlight}</span>}
        </h2>
        {k.text && <p className={styles.text}>{k.text}</p>}
        <p className={styles.action}>
          <a href={href ?? c.href("/contact")} className={styles.button}>
            {k.button}
            <svg className={styles.arrow} viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M5 11L11 5M6 5h5v5" />
            </svg>
          </a>
        </p>
      </div>

      <CtaMotion targetId="lets-connect" />
    </section>
  );
}
