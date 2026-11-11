import type { CtaCopy } from "@/design-lab/home-v5/ctaCopy";

/**
 * Academy overview (v5), following design-references/ZentexAI Academy
 * Learning Programs.png. Features checked against the product (2026-11-03):
 *  - PMP Mastery Program: 6 modules and module assessments (live product page:
 *    "6 modules · 61 video lessons"); a Certificate of Completion
 *    (features/courses/services/certificateService.ts).
 *  - PMP Exam Simulator: the reference's "~800 questions" and "3 mock exams"
 *    appear nowhere in the product, and simulatorPageCopy.ts rules them out on
 *    purpose (no question-bank size; no numbered mock exams, each attempt is
 *    generated). The verified facts are used instead: 180-question mock exams
 *    (mock-exam/config/examBlueprint.ts), practice sessions of 5 to 50
 *    questions, and a full results review.
 *  - "Free": the approved launch pricing. Production still sells both at
 *    AED 350 (12 months) through the products/prices tables.
 */
export type FeatureIcon = "modules" | "quiz" | "certificate" | "exam" | "practice" | "results";
export type Program = {
  id: "mastery" | "simulator";
  title: string;
  desc: string;
  features: { icon: FeatureIcon; label: string }[];
  price: string;
  cta: string;
  href: string;
};
export type AcademyCopy = {
  eyebrow: string;
  title: { lead: string; highlight: string };
  sub: string;
  heroCta: string;
  programsTitle: string;
  programsSub: string;
  programs: Program[];
  cta: CtaCopy;
};

const en: AcademyCopy = {
  eyebrow: "ZentexAI Academy",
  title: { lead: "Build real skills for", highlight: "real career growth." },
  sub: "Practical, focused learning programs in project management and AI, designed for professionals and teams.",
  heroCta: "Explore Programs",
  programsTitle: "Our Learning Programs",
  programsSub: "Practical programs to build in-demand skills and achieve your professional goals.",
  programs: [
    {
      id: "mastery",
      title: "PMP Mastery Program",
      desc: "A structured learning program designed to help you prepare for the PMP® certification exam.",
      features: [
        { icon: "modules", label: "6 Modules" },
        { icon: "quiz", label: "Module Quizzes" },
        { icon: "certificate", label: "Completion Certificate" },
      ],
      price: "Free",
      cta: "Start Learning",
      href: "/courses/pmp-mastery-program",
    },
    {
      id: "simulator",
      title: "PMP Exam Simulator",
      desc: "Practice with PMP-style questions, mock exams, and performance insights to prepare with confidence.",
      features: [
        { icon: "exam", label: "180-Question Exams" },
        { icon: "practice", label: "Practice Sessions" },
        { icon: "results", label: "Results & Review" },
      ],
      price: "Free",
      cta: "Start Practicing",
      href: "/courses/pmp-exam-simulator",
    },
  ],
  cta: {
    eyebrow: "Ready to get started?",
    lead: "Explore our programs and take your next step.",
    button: "Explore Programs",
  },
};

const ar: AcademyCopy = {
  eyebrow: "أكاديمية ZentexAI",
  title: { lead: "طوّر مهاراتك", highlight: "وارتقِ بمسيرتك المهنية." },
  sub: "برامج تعليمية عملية ومركّزة في إدارة المشاريع والذكاء الاصطناعي، مصممة للمهنيين وفرق العمل.",
  heroCta: "استكشف البرامج",
  programsTitle: "برامجنا التعليمية",
  programsSub: "برامج عملية تبني مهارات مطلوبة وتساعدك على تحقيق أهدافك المهنية.",
  programs: [
    {
      id: "mastery",
      title: "برنامج إتقان إدارة المشاريع PMP",
      desc: "برنامج تدريبي منظّم يساعدك على الاستعداد لاختبار شهادة PMP®.",
      features: [
        { icon: "modules", label: "6 وحدات تعليمية" },
        { icon: "quiz", label: "اختبارات لكل وحدة" },
        { icon: "certificate", label: "شهادة إتمام" },
      ],
      price: "مجاني",
      cta: "ابدأ التعلّم",
      href: "/courses/pmp-mastery-program",
    },
    {
      id: "simulator",
      title: "محاكي اختبار PMP",
      desc: "تدرّب على أسئلة بأسلوب اختبار PMP واختبارات تجريبية وتحليلات للأداء تساعدك على الاستعداد بثقة.",
      features: [
        { icon: "exam", label: "اختبارات تجريبية من 180 سؤالاً" },
        { icon: "practice", label: "جلسات تدريب" },
        { icon: "results", label: "النتائج والمراجعة" },
      ],
      price: "مجاني",
      cta: "ابدأ التدريب",
      href: "/courses/pmp-exam-simulator",
    },
  ],
  cta: {
    eyebrow: "جاهز تبدأ؟",
    lead: "استكشف برامجنا وابدأ خطوتك القادمة.",
    button: "استكشف البرامج",
  },
};

export const academyCopy = { en, ar };
