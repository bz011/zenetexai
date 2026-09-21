/**
 * Labels for the homepage hero's service cards. Titles are the site's own
 * product / service names; the one-line descriptions restate what each
 * destination page already says. No statistics, results, guarantees or
 * customer claims (none of the reference image's numbers are used).
 *
 * `href` is the English route; LocaleLink rewrites it to the Arabic URL where
 * one exists (services pages and the simulator) and leaves it alone otherwise.
 */

export type HeroCardId = "pmp" | "simulator" | "agents" | "data" | "ml";

export interface HeroCard { id: HeroCardId; href: string; title: string; desc: string }

interface HeroCopy {
  cardsLabel: string;
  cards: HeroCard[];
}

const en: HeroCopy = {
  cardsLabel: "Featured programs and services",
  cards: [
    { id: "pmp", href: "/courses/pmp-mastery-program", title: "PMP Mastery Program", desc: "Structured PMP exam preparation" },
    { id: "simulator", href: "/courses/pmp-exam-simulator", title: "PMP Exam Simulator", desc: "Full mock exams and Practice Mode" },
    { id: "agents", href: "/services/ai-agents-automation-uae", title: "AI Agents & Automation", desc: "Automate real workflows" },
    { id: "data", href: "/services/data-analytics-uae", title: "Data Analytics & Power BI", desc: "Turn your data into decisions" },
    { id: "ml", href: "/services/machine-learning-uae", title: "Machine Learning", desc: "Forecasting and prediction from your data" },
  ],
};

const ar: HeroCopy = {
  cardsLabel: "البرامج والخدمات المميزة",
  cards: [
    { id: "pmp", href: "/courses/pmp-mastery-program", title: "برنامج احتراف PMP", desc: "تحضير منظم لاختبار PMP" },
    { id: "simulator", href: "/courses/pmp-exam-simulator", title: "محاكي اختبار PMP", desc: "اختبارات تجريبية كاملة ووضع تدريب" },
    { id: "agents", href: "/services/ai-agents-automation-uae", title: "وكلاء الذكاء الاصطناعي والأتمتة", desc: "أتمتة سير العمل الفعلي" },
    { id: "data", href: "/services/data-analytics-uae", title: "تحليل البيانات وPower BI", desc: "حوّل بياناتك إلى قرارات" },
    { id: "ml", href: "/services/machine-learning-uae", title: "تعلّم الآلة", desc: "التنبؤ والتوقعات من بياناتك" },
  ],
};

export const heroCopy = { en, ar };

/**
 * Card placement on the desktop stage, as percentages of the stage box (the
 * card's centre). Mirrored automatically in RTL via logical inset properties.
 */
export const HERO_CARD_POSITIONS: Record<HeroCardId, { x: number; y: number }> = {
  pmp: { x: 30, y: 9 },
  simulator: { x: 72, y: 12 },
  agents: { x: 17, y: 37 },
  ml: { x: 83, y: 48 },
  data: { x: 27, y: 85 },
};
