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
 * Desktop stage layout, as percentages of the stage box. `x`/`y` is the card
 * centre; `from` is where its connector leaves the card (its inner edge) and
 * `to` where it meets the brain. Symmetric: one card above the brain and two
 * on each side, all the same size. Mirrored automatically in RTL.
 */
export const HERO_CARD_POSITIONS: Record<HeroCardId, { x: number; y: number }> = {
  pmp: { x: 50, y: 8 },
  agents: { x: 13.5, y: 37 },
  data: { x: 13.5, y: 67 },
  simulator: { x: 86.5, y: 37 },
  ml: { x: 86.5, y: 67 },
};

export const HERO_CARD_LINKS: Record<HeroCardId, { from: { x: number; y: number }; to: { x: number; y: number } }> = {
  pmp: { from: { x: 50, y: 19 }, to: { x: 50, y: 27 } },
  agents: { from: { x: 27, y: 37 }, to: { x: 30, y: 37 } },
  data: { from: { x: 27, y: 67 }, to: { x: 39, y: 49 } },
  simulator: { from: { x: 73, y: 37 }, to: { x: 70, y: 37 } },
  ml: { from: { x: 73, y: 67 }, to: { x: 61, y: 49 } },
};
