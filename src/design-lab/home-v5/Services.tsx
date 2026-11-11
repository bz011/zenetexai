import Image from "next/image";
import { localizeHref } from "@/lib/i18nRoutes";
import type { Lang } from "@/design-lab/content";
import wave from "../../../public/design-lab/services/dataflow-waves.png";
import { homeV5Copy, type IconName, type Offering } from "./copy";
import WaveFlow from "./WaveFlow";
import styles from "./services.module.css";

/**
 * Section 2: the seven offerings around the dataflow wave, three above it and
 * four below, as type with a small line icon each. No heading is shown; the
 * section is named for assistive technology only. The wave is static and
 * never mirrored; light and particles flow along it on a canvas (WaveFlow),
 * in the reading direction.
 */

export const iconPaths: Record<IconName, React.ReactNode> = {
  // Connected agents: a hub with three linked nodes.
  agents: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="4.5" cy="5.5" r="1.8" />
      <circle cx="19.5" cy="5.5" r="1.8" />
      <circle cx="12" cy="20.5" r="1.8" />
      <path d="M6 6.8l3.8 3.3M18 6.8l-3.8 3.3M12 15v3.7" />
    </>
  ),
  // Layers of a small network.
  ml: (
    <>
      <circle cx="5" cy="6" r="1.7" />
      <circle cx="5" cy="18" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="6" r="1.7" />
      <circle cx="19" cy="18" r="1.7" />
      <path d="M6.5 7l4 4M6.5 17l4-4M13.5 11l4-4M13.5 13l4 4" />
    </>
  ),
  // A conversation.
  whatsapp: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5z" />
      <path d="M8.5 10.5h7M8.5 13.5h4.5" />
    </>
  ),
  // Bars on a baseline.
  data: <path d="M3.5 20.5h17M6.5 17v-5M11 17V7M15.5 17v-7.5M20 17V4.5" />,
  // A compass: direction.
  advice: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5z" />
    </>
  ),
  // A schedule of staggered tasks.
  pm: <path d="M3.5 4v16.5M3.5 20.5h17M6.5 7.5h7M9.5 12h8M12.5 16.5h7" />,
  // An open book.
  academy: (
    <>
      <path d="M12 6.5C9.8 5 7 4.5 3.5 4.8v13.7c3.5-.3 6.3.2 8.5 1.7 2.2-1.5 5-2 8.5-1.7V4.8C17 4.5 14.2 5 12 6.5z" />
      <path d="M12 6.5v13.7" />
    </>
  ),
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {iconPaths[name]}
    </svg>
  );
}

export default function Services({ lang }: { lang: Lang }) {
  const k = homeV5Copy.services[lang];

  const item = (o: Offering) => (
    <li key={o.href}>
      <a href={localizeHref(o.href, lang)} className={styles.offering}>
        <Icon name={o.icon} />
        <span className={styles.name}>{o.name}</span>
        <span className={styles.line}>{o.line}</span>
      </a>
    </li>
  );

  return (
    <section className={styles.section} aria-labelledby="sv-label">
      <h2 id="sv-label" className={styles.srOnly}>{k.label}</h2>

      <ul className={`${styles.row} ${styles.above}`} data-reveal>
        {k.above.map(item)}
      </ul>

      <div className={styles.wave}>
        <div className={styles.waveInner}>
          <Image src={wave} alt="" quality={88} sizes="(max-width: 640px) 200vw, 100vw" className={styles.img} />
          <WaveFlow className={styles.flow} flow={lang === "ar" ? -1 : 1} />
        </div>
      </div>

      <ul className={`${styles.row} ${styles.below}`} data-reveal style={{ "--i": 1 } as React.CSSProperties}>
        {k.below.map(item)}
      </ul>
    </section>
  );
}
