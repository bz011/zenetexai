import type { CtaCopy } from "@/site/home/ctaCopy";
import type { IconName } from "@/site/home/copy";

/**
 * Services overview (v5), as approved: a short hero, six service rows and the
 * CTA. English copy is the brief's; Arabic is written to the same meaning.
 * Rows link to the existing service detail pages (production paths, localized
 * by the page's href()). AI Consulting and Project Management Consulting have
 * no detail page, so they go to Contact. The full service descriptions remain
 * on the detail pages and in src/lib/translations.ts; only this overview is
 * shorter.
 */
export type ServiceRow = { icon: IconName; name: string; line: string; href: string };
export type ServicesCopy = {
  eyebrow: string;
  title: { lead: string; highlight: string };
  sub: string;
  heroCta: string;
  listTitle: string;
  listSub: string;
  services: ServiceRow[];
  cta: CtaCopy;
};

const en: ServicesCopy = {
  eyebrow: "Services",
  title: { lead: "AI services ", highlight: "built around your business." },
  sub: "Practical AI, data, and project management services designed to solve real business challenges.",
  heroCta: "Discuss your project",
  listTitle: "Our Services",
  listSub: "Explore our core services and find the right fit for your business.",
  services: [
    { icon: "agents", name: "AI Agents & Automation", line: "Automate repetitive work and everyday business operations.", href: "/services/ai-agents-automation-uae" },
    { icon: "whatsapp", name: "WhatsApp Automation", line: "Turn customer conversations into enquiries, bookings, and business actions.", href: "/services/whatsapp-automation-uae" },
    { icon: "data", name: "Data Analytics & Business Intelligence", line: "Turn your data into clear insights and better decisions.", href: "/services/data-analytics-uae" },
    { icon: "ml", name: "Machine Learning", line: "Forecast trends, classify information, and identify meaningful patterns.", href: "/services/machine-learning-uae" },
    { icon: "advice", name: "AI Consulting", line: "Find practical opportunities to adopt AI responsibly.", href: "/contact" },
    { icon: "pm", name: "Project Management Consulting", line: "Bring structure, planning, and delivery discipline to your projects.", href: "/contact" },
  ],
  cta: {
    lead: "Have a project in mind?",
    highlight: "Let's talk.",
    text: "Share the challenge you're facing, and let's explore the right solution.",
    button: "Contact Us",
  },
};

const ar: ServicesCopy = {
  eyebrow: "الخدمات",
  title: { lead: "خدمات ذكاء اصطناعي ", highlight: "مصممة لتناسب أعمالك." },
  sub: "حلول عملية في الذكاء الاصطناعي وتحليل البيانات وإدارة المشاريع، لمساعدتك على مواجهة تحديات أعمالك.",
  heroCta: "ناقش مشروعك معنا",
  listTitle: "خدماتنا",
  listSub: "تعرّف على خدماتنا الأساسية، واختر ما يناسب أعمالك.",
  services: [
    { icon: "agents", name: "وكلاء الذكاء الاصطناعي والأتمتة", line: "أتمتة المهام المتكررة والعمليات اليومية في أعمالك.", href: "/services/ai-agents-automation-uae" },
    { icon: "whatsapp", name: "أتمتة واتساب", line: "حوّل محادثات العملاء إلى استفسارات وحجوزات وإجراءات عمل.", href: "/services/whatsapp-automation-uae" },
    { icon: "data", name: "تحليل البيانات وذكاء الأعمال", line: "حوّل بياناتك إلى رؤى واضحة وقرارات أفضل.", href: "/services/data-analytics-uae" },
    { icon: "ml", name: "تعلّم الآلة", line: "توقّع الاتجاهات، وصنّف المعلومات، واكتشف الأنماط المهمة.", href: "/services/machine-learning-uae" },
    { icon: "advice", name: "استشارات الذكاء الاصطناعي", line: "اكتشف فرصاً عملية لتبنّي الذكاء الاصطناعي بمسؤولية.", href: "/contact" },
    { icon: "pm", name: "استشارات المشاريع وإدارتها", line: "أضفِ التنظيم والتخطيط والانضباط في التنفيذ إلى مشاريعك.", href: "/contact" },
  ],
  cta: {
    lead: "هل لديك مشروع في ذهنك؟",
    highlight: "لنتحدث.",
    text: "شاركنا التحدي الذي تواجهه، ولنستكشف معاً الحل المناسب.",
    button: "تواصل معنا",
  },
};

export const servicesCopy = { en, ar };
