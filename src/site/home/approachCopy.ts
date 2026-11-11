/**
 * Homepage v5, "Our approach": copy as supplied in the brief. The heading's
 * highlight is the phrase set in teal.
 */
export type Stage = { title: string; text: string; keywords: string[] };
export type ApproachCopy = {
  eyebrow: string;
  title: { lead: string; highlight: string; tail: string };
  sub: string;
  stages: Stage[];
};

const en: ApproachCopy = {
  eyebrow: "Our approach",
  title: { lead: "From idea to ", highlight: "impact.", tail: "" },
  sub: "A clear, structured approach to turning business challenges into practical solutions.",
  stages: [
    {
      title: "Discover & Plan",
      text: "We understand your business, challenges, and goals, then define the right strategy and roadmap.",
      keywords: ["Discovery", "Requirements", "Feasibility", "Strategy"],
    },
    {
      title: "Design & Develop",
      text: "We design and build the right solution, integrate it with your systems, and test it for security and reliability.",
      keywords: ["Architecture", "Development", "Integration", "Testing"],
    },
    {
      title: "Launch & Optimize",
      text: "We deploy the solution, help your team adopt it, and improve it based on real results.",
      keywords: ["Deployment", "Monitoring", "Performance", "Optimization"],
    },
  ],
};

const ar: ApproachCopy = {
  eyebrow: "منهجية عملنا",
  title: { lead: "من الفكرة إلى ", highlight: "الأثر الحقيقي", tail: "." },
  sub: "نتبع منهجية واضحة ومنظمة لتحويل تحديات الأعمال إلى حلول عملية قابلة للتنفيذ.",
  stages: [
    {
      title: "نفهم ونخطط",
      text: "نفهم طبيعة أعمالك وتحدياتك وأهدافك، ثم نحدد المتطلبات والاستراتيجية وخطة التنفيذ المناسبة.",
      keywords: ["فهم الاحتياجات", "تحديد المتطلبات", "دراسة الجدوى", "التخطيط"],
    },
    {
      title: "نصمم ونطوّر",
      text: "نصمم الحل المناسب ونطوّره، ونربطه بأنظمتك، ونتحقق من جودته وأمانه وموثوقيته.",
      keywords: ["التصميم", "التطوير", "التكامل", "الاختبار"],
    },
    {
      title: "نطلق ونحسّن",
      text: "نجهّز الحل للتشغيل، وندعم فريقك في استخدامه، ونتابع الأداء ونحسّنه بناءً على النتائج الفعلية.",
      keywords: ["الإطلاق", "المراقبة", "قياس الأداء", "التحسين"],
    },
  ],
};

export const approachCopy = { en, ar };
