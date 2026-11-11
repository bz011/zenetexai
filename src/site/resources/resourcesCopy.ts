import type { Lang } from "@/site/content";
import type { CtaCopy } from "@/site/home/ctaCopy";

/**
 * Resources / Knowledge Hub (v5).
 *
 * Articles: the eight real published posts (design-lab/content.ts ARTICLES,
 * checked against zentexai.com/blog on 2026-11-05: same slugs, titles and
 * dates). Production reads them from website_posts, which has no category
 * field, so topics here are DERIVED from each article's real slug by the
 * explicit keyword rules below; an article no rule matches gets no topic and
 * appears only under "All topics". No article currently matches Data &
 * Analytics, so that filter shows an honest empty state.
 *
 * Titles are never translated: an article keeps its own language and is
 * marked when it differs from the page's.
 */
export type Topic = "ai" | "data" | "pm";
/** One article as the Resources hub lists it (built from website_posts rows, see blog/blogData). */
export type Article = { slug: string; lang: Lang; title: string; date: string; topic: Topic | null };

const RULES: [Topic, RegExp][] = [
  ["pm", /(^|-)(pmp|project-management|project-scheduling)(-|$)/],
  ["data", /(^|-)(data|analytics|power-bi|dashboard|kpi)(-|$)/],
  ["ai", /(^|-)(ai|automation|agents?)(-|$)/],
];

export function topicOf(slug: string): Topic | null {
  for (const [topic, re] of RULES) if (re.test(slug)) return topic;
  return null;
}

/** Newest first, as on the live blog (all eight share one date; the source order is kept). */

export const FEATURED_SLUG = "is-your-business-ready-for-ai-automation";

export const resourcesCopy = {
  en: {
    eyebrow: "Insights & knowledge",
    title: { lead: "Ideas worth ", highlight: "exploring." },
    sub: "Practical perspectives on AI, automation, data, and project management.",
    filtersLabel: "Filter by topic",
    all: "All Topics",
    topics: { ai: "AI & Automation", data: "Data & Analytics", pm: "Project Management" } as Record<Topic, string>,
    featuredLabel: "Featured insight",
    // The article's own published description (its meta description).
    featuredExcerpt: "A practical, no-hype framework for assessing whether your business is actually ready for AI automation, and what to fix first if it isn't.",
    read: "Read article",
    latest: "Latest insights",
    viewAll: "View all articles",
    otherLang: "In Arabic",
    count: (n: number) => (n === 0 ? "No articles" : `${n} ${n === 1 ? "article" : "articles"}`),
    empty: "No articles on this topic yet.",
    emptyLink: "Explore our data analytics service",
    emptyHref: "/services/data-analytics-uae",
    cta: {
      lead: "Want to talk through your situation?",
      text: "Tell us what you're working on, and we'll help you find the right next step.",
      button: "Contact Us",
    } satisfies CtaCopy,
  },
  ar: {
    eyebrow: "رؤى ومعرفة",
    title: { lead: "أفكار تستحق ", highlight: "الاستكشاف." },
    sub: "رؤى عملية في الذكاء الاصطناعي والأتمتة والبيانات وإدارة المشاريع.",
    filtersLabel: "تصفية حسب الموضوع",
    all: "كل المواضيع",
    topics: { ai: "الذكاء الاصطناعي والأتمتة", data: "البيانات والتحليلات", pm: "إدارة المشاريع" } as Record<Topic, string>,
    featuredLabel: "مقال مميز",
    // Arabic summary of the article's published description (the article itself is in English).
    featuredExcerpt: "إطار عملي وواقعي لتقييم مدى جاهزية عملك فعلاً لأتمتة الذكاء الاصطناعي، وما الذي ينبغي إصلاحه أولاً إن لم يكن جاهزاً.",
    read: "اقرأ المقال",
    latest: "أحدث المقالات",
    viewAll: "عرض جميع المقالات",
    otherLang: "بالإنجليزية",
    count: (n: number) => (n === 0 ? "لا توجد مقالات" : n === 1 ? "مقال واحد" : n === 2 ? "مقالان" : n <= 10 ? `${n} مقالات` : `${n} مقالاً`),
    empty: "لا توجد مقالات في هذا الموضوع بعد.",
    emptyLink: "تعرّف على خدمة تحليل البيانات",
    emptyHref: "/services/data-analytics-uae",
    cta: {
      lead: "هل تودّ مناقشة وضعك معنا؟",
      text: "أخبرنا بما تعمل عليه، وسنساعدك على تحديد الخطوة التالية المناسبة.",
      button: "تواصل معنا",
    } satisfies CtaCopy,
  },
};
