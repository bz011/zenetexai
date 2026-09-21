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
  pauseLabel: string;
  playLabel: string;
  cards: HeroCard[];
}

const en: HeroCopy = {
  cardsLabel: "Featured programs and services",
  pauseLabel: "Pause background animation",
  playLabel: "Play background animation",
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
  pauseLabel: "إيقاف الحركة الخلفية مؤقتاً",
  playLabel: "تشغيل الحركة الخلفية",
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
 * Desktop stage layout, as percentages of the stage box (aspect 10:9; the
 * cinematic video fills its lower ~93 %, the brain sits at x 25-75 %, y 14-63 %).
 * `x`/`y` is the card centre. One card above the brain, two on each side, all
 * the same size, clear of the brain. Mirrored automatically in RTL.
 */
export const HERO_CARD_POSITIONS: Record<HeroCardId, { x: number; y: number }> = {
  pmp: { x: 50, y: 5.5 },
  agents: { x: 11, y: 30 },
  data: { x: 11, y: 55 },
  simulator: { x: 89, y: 30 },
  ml: { x: 89, y: 55 },
};
