import type { CtaCopy } from "@/design-lab/home-v5/ctaCopy";
import type { Topic } from "@/design-lab/resources-v5/resourcesCopy";

/**
 * Blog and article-page interface copy. Each blog lists only articles in its
 * own language; titles, descriptions and bodies are never translated (they
 * come from blogData).
 */
export const blogCopy = {
  en: {
    eyebrow: "ZentexAI Journal",
    title: { lead: "Perspectives on ", highlight: "AI and business." },
    intro: "Articles from the ZentexAI team on putting AI and automation to work in real business operations.",
    archiveNote: (n: number) => `${n} articles`,
    latest: "Latest",
    archive: "All articles",
    topics: { ai: "AI & Automation", data: "Data & Analytics", pm: "Project Management" } as Record<Topic, string>,
    minutes: (n: number) => `${n} min read`,
    read: "Read article",
    back: "Back to Blog",
    published: "Published",
    related: "More from the journal",
    cta: {
      lead: "Want to talk through your situation?",
      text: "Tell us what you're working on, and we'll help you find the right next step.",
      button: "Contact Us",
    } satisfies CtaCopy,
  },
  ar: {
    eyebrow: "مجلة ZentexAI",
    title: { lead: "رؤى في ", highlight: "إدارة المشاريع والتطوير المهني." },
    intro: "مقالات من فريق ZentexAI حول إدارة المشاريع والاستعداد لاختبار PMP بثقة.",
    archiveNote: (n: number) => (n === 1 ? "مقال واحد" : n === 2 ? "مقالان" : n <= 10 ? `${n} مقالات` : `${n} مقالاً`),
    latest: "الأحدث",
    archive: "جميع المقالات",
    topics: { ai: "الذكاء الاصطناعي والأتمتة", data: "البيانات والتحليلات", pm: "إدارة المشاريع" } as Record<Topic, string>,
    minutes: (n: number) => (n <= 10 ? `${n} دقائق قراءة` : `${n} دقيقة قراءة`),
    read: "اقرأ المقال",
    back: "العودة إلى المدونة",
    published: "نُشر في",
    related: "مقالات أخرى من المجلة",
    cta: {
      lead: "هل تودّ مناقشة وضعك معنا؟",
      text: "أخبرنا بما تعمل عليه، وسنساعدك على تحديد الخطوة التالية المناسبة.",
      button: "تواصل معنا",
    } satisfies CtaCopy,
  },
};
