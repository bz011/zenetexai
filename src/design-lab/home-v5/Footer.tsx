import { getLabContent, type Lang } from "@/design-lab/content";
import { LogoLockup } from "@/design-lab/logos/Logos";
import { footerCopy } from "./footerCopy";
import styles from "./footer.module.css";

/**
 * Footer: deep navy, picking up from the CTA's dark teal. The logo is the
 * header's own lockup (concept 1) in its dark-surface colours (ivory ink, light
 * teal signal; same geometry and wordmark). Static apart from hover and focus.
 */
/** `onHome` false: section links ("#solutions") point at the homepage. */
export default function Footer({ lang, onHome = true }: { lang: Lang; onHome?: boolean }) {
  const c = getLabContent(lang);
  const k = footerCopy[lang];
  const href = (to: string) => (!to.startsWith("#") ? c.href(to) : onHome ? to : c.href("/") + to);
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <a href={c.href("/")} className={styles.logo} aria-label={k.home}>
            <LogoLockup id={1} surface="dark" height={30} />
          </a>
          <p className={styles.statement}>{k.statement}</p>
        </div>

        <nav className={styles.nav} aria-label={k.navLabel}>
          {k.columns.map((col) => (
            <div key={col.title} className={styles.col}>
              <h2 className={styles.colTitle}>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={href(l.href)} className={styles.link}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.bottom}>
        <p className={styles.rights}>
          <span dir="ltr">© {year} ZentexAI.</span> {k.rights}
        </p>
        <ul className={styles.legal} aria-label={k.legalLabel}>
          {k.legal.map((l) => (
            <li key={l.label}>
              <a href={href(l.href)} className={styles.link}>{l.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
