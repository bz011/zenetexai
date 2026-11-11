/**
 * Homepage v5, "Solutions in action": copy as supplied in the brief. These are
 * examples of what ZentexAI can tailor for a client, not case studies; none
 * has a detail page, so the rows are informational (no links).
 */
export type Solution = { title: string; text: string };
export type SolutionsCopy = {
  eyebrow: string;
  title: { lead: string; highlight: string; tail: string };
  sub: string;
  items: Solution[];
};

const en: SolutionsCopy = {
  eyebrow: "Solutions in action",
  title: { lead: "Real solutions for ", highlight: "real challenges.", tail: "" },
  sub: "Practical AI solutions tailored to the way your business works.",
  items: [
    {
      title: "AI Clinic Growth",
      text: "Use AI-powered market insights, content strategies, and marketing automation to reach more potential patients and identify new growth opportunities.",
    },
    {
      title: "AI Clinic Operations",
      text: "Simplify patient inquiries, appointment coordination, and everyday clinic workflows with intelligent automation.",
    },
    {
      title: "AI Content Generation",
      text: "Create consistent, on-brand marketing content across digital channels with AI-assisted workflows and human review.",
    },
    {
      title: "AI Project Intelligence",
      text: "Turn project schedules, progress updates, and operational data into clearer insights for tracking performance, identifying risks, and supporting decisions.",
    },
  ],
};

const ar: SolutionsCopy = {
  eyebrow: "حلولنا العملية",
  // The teal starts mid-word (لـ|تحديات); zero-width joiners keep the letters joined across the colour change.
  title: { lead: "حلول حقيقية ل\u200d", highlight: "\u200dتحديات واقعية", tail: "." },
  sub: "حلول ذكاء اصطناعي عملية نصممها بما يتناسب مع طبيعة أعمالك واحتياجاتك.",
  items: [
    {
      title: "الذكاء الاصطناعي لنمو العيادات",
      text: "استفد من تحليل السوق واستراتيجيات المحتوى وأتمتة التسويق للوصول إلى المزيد من المرضى المحتملين واكتشاف فرص جديدة للنمو.",
    },
    {
      title: "أتمتة عمليات العيادات",
      text: "بسّط استفسارات المرضى وتنسيق المواعيد والمهام التشغيلية اليومية من خلال الأتمتة الذكية.",
    },
    {
      title: "إنشاء المحتوى بالذكاء الاصطناعي",
      text: "أنشئ محتوى تسويقيًا متناسقًا مع هوية علامتك التجارية عبر القنوات الرقمية، بمساعدة الذكاء الاصطناعي والمراجعة البشرية.",
    },
    {
      title: "ذكاء إدارة المشاريع",
      text: "حوّل الجداول الزمنية وتحديثات التقدم والبيانات التشغيلية إلى رؤى أوضح لمتابعة الأداء واكتشاف المخاطر ودعم اتخاذ القرارات.",
    },
  ],
};

export const solutionsCopy = { en, ar };
