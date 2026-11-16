import { heroDCopy } from "@/site/home/heroCopy";

/**
 * Homepage v5 copy (a refinement of v4).
 *
 * Hero: Hero D's design with the owner-approved positioning headline
 * (audit P2-18, 2026-11-16): "Practical AI Agents, Automation & Analytics for
 * Businesses", no country named (the market is international). The supporting
 * line names only existing services (see `en.above` / `en.below` below and
 * /services) and avoids repeating the headline's words.
 * The language switch points at this preview.
 *
 * Services: descriptions are the production site's own wording (the /services
 * category descriptions, the homepage WhatsApp line, the Academy page), edited
 * only for length and, in Arabic, for natural phrasing. Nothing is added.
 * Destinations are existing pages, or existing sections of /services.
 */
export type Offering = { icon: IconName; name: string; line: string; href: string };
export type IconName = "agents" | "ml" | "whatsapp" | "data" | "advice" | "pm" | "academy";

const hero = {
  en: {
    ...heroDCopy.en,
    // "Practical AI Agents, / Automation & Analytics for Businesses", the audience in teal.
    title: { lead: "Practical AI Agents,", pre: "Automation & Analytics ", highlight: "for Businesses", tail: "" },
    sub: "We design and build systems that take repetitive work off your team and turn your data into clearer decisions, from WhatsApp workflows and dashboards to machine learning, backed by AI consulting and project management expertise.",
    language: { ...heroDCopy.en.language, href: "/ar" },
  },
  ar: {
    ...heroDCopy.ar,
    // "وكلاء ذكاء اصطناعي / وأتمتة وتحليلات عملية للشركات", the closing words in teal.
    title: { lead: "وكلاء ذكاء اصطناعي", pre: "وأتمتة وتحليلات ", highlight: "عملية للشركات", tail: "" },
    sub: "نصمّم ونبني أنظمة تخفّف عن فريقك الأعمال المتكررة وتحوّل بياناتك إلى قرارات أوضح، من سير عمل واتساب ولوحات المعلومات إلى تعلّم الآلة، مدعومةً بخبرة في استشارات الذكاء الاصطناعي وإدارة المشاريع.",
    language: { ...heroDCopy.ar.language, href: "/" },
  },
};

const en = {
  label: "Our services",
  above: [
    { icon: "agents", name: "AI Agents & Automation", line: "Practical AI systems built to do real work inside your organization.", href: "/services/ai-agents-automation-uae" },
    { icon: "whatsapp", name: "WhatsApp Automation", line: "Customer conversations connected to lead qualification, booking and CRM workflows.", href: "/services/whatsapp-automation-uae" },
    { icon: "ml", name: "Machine Learning", line: "Practical machine learning for forecasting, classification and anomaly detection.", href: "/services/machine-learning-uae" },
  ] as Offering[],
  below: [
    { icon: "data", name: "Data Analytics & Business Intelligence", line: "KPI frameworks, clean data models and dashboards built around your real decisions.", href: "/services/data-analytics-uae" },
    { icon: "advice", name: "AI Consulting", line: "Clear guidance on where AI fits your organization, and how to adopt it responsibly.", href: "/services#ai-consulting" },
    { icon: "pm", name: "Project Management Consulting", line: "Hands-on delivery expertise, from setting up a PMO to recovering a troubled project.", href: "/services#pm-consulting" },
    { icon: "academy", name: "ZentexAI Academy", line: "The PMP Mastery Program and the PMP Exam Simulator, on a platform you can use in Arabic or English.", href: "/academy" },
  ] as Offering[],
};

const ar: typeof en = {
  label: "خدماتنا",
  above: [
    { icon: "agents", name: "وكلاء الذكاء الاصطناعي والأتمتة", line: "أنظمة ذكاء اصطناعي عملية تؤدي عملاً حقيقياً داخل مؤسستك.", href: "/services/ai-agents-automation-uae" },
    { icon: "whatsapp", name: "أتمتة واتساب", line: "نربط محادثات العملاء بتأهيل العملاء المحتملين والحجوزات وأنظمة إدارة علاقات العملاء.", href: "/services/whatsapp-automation-uae" },
    { icon: "ml", name: "تعلّم الآلة", line: "تعلّم آلة عملي للتنبؤ والتصنيف واكتشاف الحالات الشاذة في بياناتك.", href: "/services/machine-learning-uae" },
  ],
  below: [
    { icon: "data", name: "تحليل البيانات وذكاء الأعمال", line: "مؤشرات أداء واضحة، ونماذج بيانات نظيفة، ولوحات معلومات مبنية حول قراراتك الفعلية.", href: "/services/data-analytics-uae" },
    { icon: "advice", name: "استشارات الذكاء الاصطناعي", line: "إرشاد واضح لمواضع الاستفادة من الذكاء الاصطناعي في مؤسستك، وتبنّيه بمسؤولية.", href: "/services#ai-consulting" },
    { icon: "pm", name: "استشارات المشاريع وإدارتها", line: "خبرة عملية في تنفيذ المشاريع، من تأسيس مكتب لإدارة المشاريع إلى إنقاذ المشاريع المتعثرة.", href: "/services#pm-consulting" },
    { icon: "academy", name: "أكاديمية ZentexAI", line: "برنامج احتراف PMP ومحاكي اختبار PMP، على منصة يمكنك استخدامها بالعربية أو الإنجليزية.", href: "/academy" },
  ],
};

export const homeV5Copy = { hero, services: { en, ar } };
