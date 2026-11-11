import styles from "./auth.module.css";

/**
 * Teal Flow: the auth screens' decoration (v5). Soft, translucent teal
 * ribbons with fine champagne lines, drawn once and used twice: flowing out
 * of the upper-left corner, and turned 180° out of the lower-right. Each
 * corner fades out toward the middle (a CSS radial mask on its box, so it
 * always reaches nothing before the box's edges), so it never reaches the
 * form. Pure SVG; the CSS sizes each corner to the free space beside
 * the form (desktop) or to the margins above and below it (phones), so it
 * never sits under text, inputs or the header. Decorative only.
 */
export default function TealFlow({ id, corner }: { id: string; corner: "start" | "end" }) {
  const g = (n: string) => `${id}-${n}`;
  return (
    <svg
      className={`${styles.flow} ${corner === "start" ? styles.flowStart : styles.flowEnd}`}
      viewBox="0 0 600 520"
      preserveAspectRatio="xMinYMin slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={g("teal")} x1="0" y1="0" x2="600" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1e6461" />
          <stop offset="0.55" stopColor="#3f8f88" />
          <stop offset="1" stopColor="#7fbdb5" />
        </linearGradient>
      </defs>

      <g fill="none" strokeLinecap="round">
        {/* Teal ribbons: wide and faint to narrow and clearer. */}
        <path className={styles.ribbon} d="M 560 -40 C 430 110 300 120 190 190 C 90 255 40 360 -40 470" stroke={`url(#${g("teal")})`} strokeWidth="96" strokeOpacity="0.09" />
        <path className={styles.ribbon} d="M 470 -40 C 380 70 270 90 170 150 C 80 205 30 300 -40 390" stroke={`url(#${g("teal")})`} strokeWidth="54" strokeOpacity="0.14" />
        <path className={styles.ribbon} d="M 620 10 C 470 150 350 175 245 235 C 150 290 95 390 30 540" stroke={`url(#${g("teal")})`} strokeWidth="30" strokeOpacity="0.17" />
        <path className={styles.ribbon} d="M 390 -40 C 320 40 240 65 150 110 C 70 150 20 220 -40 300" stroke={`url(#${g("teal")})`} strokeWidth="14" strokeOpacity="0.26" />
        {/* Champagne lines, following the flow. */}
        <path className={styles.flowLine} d="M 600 40 C 460 165 330 160 225 215 C 130 265 75 360 10 500" stroke="#c9ab76" strokeWidth="1.2" strokeOpacity="0.75" pathLength={1} />
        <path className={styles.flowLine} d="M 430 -20 C 350 60 260 85 165 130 C 85 168 35 235 -20 330" stroke="#c9ab76" strokeWidth="0.9" strokeOpacity="0.45" pathLength={1} />
      </g>
    </svg>
  );
}
