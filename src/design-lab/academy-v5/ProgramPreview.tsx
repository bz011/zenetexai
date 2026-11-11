import { getLabContent, type Lang } from "@/design-lab/content";
import { hanken, plexArabicA3 } from "@/design-lab/a3/fonts";
import SiteHeader from "@/design-lab/home-v5/SiteHeader";
import Footer from "@/design-lab/home-v5/Footer";
import page from "@/design-lab/home-v5/hero.module.css";
import { academyCopy, type Program } from "./academyCopy";
import academy from "./academy.module.css";
import styles from "./programPreview.module.css";

/**
 * DESIGN-LAB ONLY. Where an Academy program button lands in the local
 * preview. The real destination is the product page (/courses/<slug>), which
 * reads the product from the database; the local environment points at a
 * local Supabase that is not running, so that page answers 404 here. This page
 * says so plainly, shows the exact production destination, and links to the
 * live page and back. It changes nothing about the production pages, and like
 * every lab route it 404s in any production build (labGate).
 */
const LIVE_ORIGIN = "https://zentexai.com";

const copy = {
  en: {
    badge: "Design-lab preview only",
    lead: "This is where the button goes on the live site:",
    why: "That product page loads the program, its price and enrolment from the product database. The database isn't running in this local preview, so the page can't be shown here and would answer 404.",
    open: "Open the live page",
    newTab: "(opens zentexai.com in a new tab)",
    back: "Back to programs",
  },
  ar: {
    badge: "معاينة مختبر التصميم فقط",
    lead: "هذه وجهة الزر في الموقع الفعلي:",
    why: "تعرض صفحة المنتج البرنامج وسعره والتسجيل فيه من قاعدة بيانات المنتجات. قاعدة البيانات هذه لا تعمل في هذه المعاينة المحلية، لذلك لا يمكن عرض الصفحة هنا وستظهر رسالة 404.",
    open: "افتح الصفحة الفعلية",
    newTab: "(تفتح zentexai.com في نافذة جديدة)",
    back: "العودة إلى البرامج",
  },
};

export default function ProgramPreview({ lang, program }: { lang: Lang; program: Program }) {
  const c = getLabContent(lang);
  const k = copy[lang];
  const destination = c.href(program.href);
  const base = lang === "ar" ? "/design-lab/ar" : "/design-lab";
  const other = `${lang === "ar" ? "/design-lab" : "/design-lab/ar"}/academy/program/${program.id}`;
  const title = academyCopy[lang].programs.find((p) => p.id === program.id)?.title ?? program.title;

  return (
    <div className={`${page.page} ${hanken.variable} ${plexArabicA3.variable}`} lang={lang} dir={c.dir}>
      <SiteHeader lang={lang} languageHref={other} current="/academy" logoIntro={false} />
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="pp-title">
          <p className={styles.badge}>{k.badge}</p>
          <h1 id="pp-title" className={styles.title}>{title}</h1>
          <p className={styles.lead}>{k.lead}</p>
          <p className={styles.path}>
            <code dir="ltr">{destination}</code>
          </p>
          <p className={styles.why}>{k.why}</p>
          <p className={styles.actions}>
            <a href={`${LIVE_ORIGIN}${destination}`} target="_blank" rel="noopener noreferrer" className={academy.button}>
              {k.open}
            </a>
            <a href={`${base}/academy#programs`} className={styles.back}>{k.back}</a>
          </p>
          <p className={styles.note}>{k.newTab}</p>
        </section>
      </main>
      <Footer lang={lang} onHome={false} />
    </div>
  );
}
