import translations from "@/lib/translations";
import { homeCopy } from "@/lib/homeCopy";
import { visualCopy } from "@/lib/visualCopy";
import { academyShowcaseCopy, LESSON_PLAYER } from "@/lib/academyCopy";
import { localizeHref, type SiteLang } from "@/lib/i18nRoutes";

export type Lang = SiteLang;

/**
 * Real published articles, as listed on zentexai.com/blog on 2026-10-29.
 * The English articles cover AI automation; the Arabic ones cover PMP.
 * Prototypes only: the live homepage reads posts from the database.
 */
export const ARTICLES = [
  { slug: "ai-agents-for-business-uae", lang: "en", title: "AI Agents for Business in the UAE", date: "2026-09-11" },
  { slug: "is-your-business-ready-for-ai-automation", lang: "en", title: "How to Assess Whether a Business Is Ready for AI Automation", date: "2026-09-11" },
  { slug: "ai-automation-clinics-service-businesses", lang: "en", title: "AI Automation for Clinics and Service Businesses", date: "2026-09-11" },
  { slug: "whatsapp-automation-uae-businesses", lang: "en", title: "WhatsApp Automation for UAE Businesses", date: "2026-09-11" },
  { slug: "pmp-exam-simulator-how-to-use", lang: "ar", title: "محاكي اختبار PMP: كيف تستخدم المحاكاة للتحضير للامتحان؟", date: "2026-09-11" },
  { slug: "pmp-exam-questions-thinking-approach", lang: "ar", title: "أسئلة PMP مع شرح طريقة التفكير", date: "2026-09-11" },
  { slug: "critical-path-project-management-pmp", lang: "ar", title: "شرح المسار الحرج في إدارة المشاريع", date: "2026-09-11" },
  { slug: "lead-and-lag-project-scheduling-pmp", lang: "ar", title: "الفرق بين Lead وLag في إدارة المشاريع", date: "2026-09-11" },
] as const;

/** Public WhatsApp number already published on the live site. */
export const WHATSAPP_URL = "https://wa.me/971566227824";

export function formatDate(iso: string, lang: Lang): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Everything a prototype needs, taken from the copy the live site already publishes. */
export function getLabContent(lang: Lang) {
  const t = translations[lang];
  const home = homeCopy[lang];
  const visual = visualCopy[lang];
  return {
    lang,
    dir: lang === "ar" ? ("rtl" as const) : ("ltr" as const),
    href: (path: string) => localizeHref(path, lang),
    nav: t.nav,
    home,
    featured: {
      title: t.home.featured_h2_line1,
      p1: t.home.featured_p1,
      p2: t.home.featured_p2,
      features: t.home.featured_features,
      enroll: t.home.featured_btn1,
      view: t.home.featured_btn2,
    },
    founder: { title: t.home.founder_h2, summary: t.home.founder_summary, more: t.home.founder_btn },
    articlesTitle: t.home.articles_h2,
    articlesSub: t.home.articles_sub,
    articlesAll: t.home.articles_view_all,
    cta: t.cta,
    chain: { title: t.aiAgentsAutomation.how_h2, sub: t.aiAgentsAutomation.how_sub, steps: t.aiAgentsAutomation.how_steps },
    agent: visual.agent,
    simulatorSteps: visual.simulatorLoop.steps,
    lesson: { ...academyShowcaseCopy[lang], image: LESSON_PLAYER },
  };
}

export type LabContent = ReturnType<typeof getLabContent>;
