import { getLabContent, WHATSAPP_URL, type Lang } from "@/site/content";
import site from "@/site/site.module.css";
import page from "@/site/home/hero.module.css";
import { contactCopy } from "./contactCopy";
import InquiryForm from "./InquiryForm";
import styles from "./contact.module.css";

/**
 * Contact page (v5): one spread, no illustration. The introduction (large
 * light headline, the one verified direct channel, and what is helpful to
 * include) sits beside the inquiry form, which is set straight onto the
 * ivory page between two hairlines rather than in a boxed card. Topic
 * choices are quiet selectable tiles. Server-rendered; only the form is a
 * client component. The form runs in live mode: it posts to the existing
 * /api/contact route with the production contract (see InquiryForm).
 */
export default function ContactPage({ lang }: { lang: Lang }) {
  const c = getLabContent(lang);
  const k = contactCopy[lang];

  return (
    <div className={`${page.page} ${site.underHeader}`} lang={lang} dir={c.dir}>
      <div className={styles.main}>
        <div className={styles.spread}>
          <section className={styles.intro} aria-labelledby="ct-title">
            <p className={styles.eyebrow}>{k.eyebrow}</p>
            <h1 id="ct-title" className={styles.title}>
              <span className={styles.line}>{k.title.lead}</span>{" "}
              <span className={`${styles.line} ${styles.accent}`}>{k.title.highlight}</span>
            </h1>
            <p className={styles.sub}>{k.sub}</p>

            <div className={styles.direct}>
              <h2 className={styles.minorHeading}>{k.direct.heading}</h2>
              <a className={styles.channel} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <span className={styles.channelIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 19.5l1.1-3.6A8 8 0 1 1 8.3 18.6z" />
                    <path d="M9.2 8.6c.2 1.9 2.3 4.3 4.6 5 .5.1 1-.2 1.3-.6l.3-.5-1.6-.9-.7.6c-.9-.3-1.9-1.3-2.2-2.2l.6-.7-.9-1.6-.5.3c-.5.2-.8.5-.9.6z" />
                  </svg>
                </span>
                <span className={styles.channelText}>
                  <span className={styles.channelLabel}>{k.direct.label}</span>
                  <span className={styles.channelValue} dir="ltr">{k.direct.value}</span>
                </span>
                <svg className={styles.channelArrow} viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 14L14 6M7.5 6H14v6.5" />
                </svg>
                <span className={styles.srOnly}>{k.direct.note}</span>
              </a>
            </div>

            <div className={styles.include}>
              <h2 className={styles.minorHeading}>{k.include.heading}</h2>
              <ul>
                {k.include.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <div className={styles.formWrap}>
            <InquiryForm lang={lang} mode="live" privacyHref={c.href("/privacy")} />
          </div>
        </div>
      </div>
    </div>
  );
}
