import Image from "next/image";
import portrait from "../../../public/images/about/founder-portrait-cutout.webp";
import styles from "./about.module.css";

/**
 * The About hero's founder portrait: the owner's approved transparent
 * cut-out, used exactly as supplied (never flipped or retouched), set into
 * the ivory page rather than framed as a photograph.
 *
 *  - behind: a soft pale-teal glow, an organic teal shape that fades into
 *    the ivory toward the bottom, and a fine champagne arch (after the lit
 *    arch of the approved corporate portrait);
 *  - the photograph's lower quarter fades softly into the ivory (a CSS
 *    mask below the chest), so its straight crop is never seen.
 *
 * The decorative layer mirrors for Arabic (CSS); the photograph does not.
 * Box size is fixed by aspect-ratio, so nothing shifts while it loads.
 */
export default function HeroPortrait({ alt }: { alt: string }) {
  return (
    <div className={styles.portraitArt}>
      <svg className={`${styles.portraitDecor} ${styles.portraitBack}`} viewBox="0 0 600 600" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="abp-glow" cx="330" cy="300" r="300" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#cfe4df" stopOpacity="0.7" />
            <stop offset="0.6" stopColor="#dfece7" stopOpacity="0.35" />
            <stop offset="1" stopColor="#f6f2ea" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="abp-shape" x1="0" y1="90" x2="0" y2="560" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#c6dfd9" />
            <stop offset="0.55" stopColor="#d9e8e2" />
            <stop offset="1" stopColor="#f6f2ea" stopOpacity="0" />
          </linearGradient>
          {/* The one gold curve: it fades out well above the suit's lower edge. */}
          <linearGradient id="abp-arch" x1="0" y1="470" x2="0" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#c9ab76" stopOpacity="0" />
            <stop offset="0.35" stopColor="#c9ab76" stopOpacity="0.75" />
            <stop offset="1" stopColor="#c9ab76" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect className={styles.pGlow} x="0" y="0" width="600" height="600" fill="url(#abp-glow)" />
        <path
          className={styles.pShape}
          d="M 132 372 C 104 262 156 150 262 112 C 362 76 488 104 532 214 C 572 316 530 450 420 512 C 318 570 166 500 132 372 Z"
          fill="url(#abp-shape)"
        />
        <path className={styles.pArch} d="M 70 586 C 52 330 176 66 404 58 C 470 56 520 70 560 92" pathLength={1} fill="none" stroke="url(#abp-arch)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      <Image
        src={portrait}
        alt={alt}
        className={styles.portraitPhoto}
        sizes="(max-width: 900px) min(calc(100vw - 40px), 420px), 520px"
        quality={85}
        priority
      />
    </div>
  );
}
