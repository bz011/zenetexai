/**
 * Copy for the PMP Exam Simulator product page (slug "pmp-exam-simulator").
 *
 * Every factual claim here maps to implemented behaviour:
 *  - Mock exam structure (questions / time / sections / breaks): read from
 *    the active blueprint at render time (features/mock-exam/config/
 *    examBlueprint.ts), never typed in here - placeholders below are filled
 *    in by SimulatorSalesSections.
 *  - Price and access length: read from the product's price row at render
 *    time. No amounts or durations appear in this file.
 *  - Practice Mode session sizes / timers / filters: PracticeConfigForm.tsx.
 *  - Results review, breakdowns, history, retake-and-compare, Arabic/English:
 *    mock-exam and practice results/history pages.
 * Deliberately NOT stated: any count of numbered mock exams (none exists -
 * each attempt is generated on demand), any question-bank size, any pass
 * rate, PMI approval/affiliation, or guaranteed outcomes.
 *
 * Placeholders: {questions} {hours} {sections} {perSection} {breaks}
 * {breakMins} {months}
 */

import { getActiveBlueprint } from "@/features/mock-exam/config/examBlueprint";

export const SIMULATOR_SLUG = "pmp-exam-simulator";

interface Item { title: string; desc: string }
interface Faq { q: string; a: string }

export interface SimulatorPageCopy {
  hero_eyebrow: string; hero_h1: string; hero_sub: string;
  cta_primary: string; cta_secondary: string;
  facts_questions_label: string; facts_questions_note: string;
  facts_time_label: string; facts_time_value: string; facts_time_note: string;
  facts_exams_label: string; facts_exams_value: string; facts_exams_note: string;
  facts_practice_label: string; facts_practice_value: string; facts_practice_note: string;
  facts_access_label: string; facts_access_note: string; facts_access_note_no_term: string;
  compare_eyebrow: string; compare_h2: string; compare_sub: string;
  mock_tag: string; mock_title: string; mock_intro: string; mock_points: string[];
  practice_tag: string; practice_title: string; practice_intro: string; practice_points: string[];
  features_h2: string;
  features: Item[];
  faq_h2: string;
  faq: Faq[];
  disclaimer: string;
  seo_title: string; seo_description: string;
}

const en: SimulatorPageCopy = {
  hero_eyebrow: "PMP Exam Simulator",
  hero_h1: "Practice the PMP Exam Under Real Conditions",
  hero_sub:
    "Sit full-length, timed mock exams and targeted practice sessions in Arabic or English, then see exactly where to improve with a full answer review after every attempt.",
  cta_primary: "Get Access",
  cta_secondary: "See How It Works",

  facts_questions_label: "Questions per mock exam",
  facts_questions_note: "Full-length, timed simulation",
  facts_time_label: "Time allowed",
  facts_time_value: "{hours} hours",
  facts_time_note: "{sections} sections of {perSection} questions, with {breaks} scheduled {breakMins}-minute breaks",
  facts_exams_label: "Mock exams",
  facts_exams_value: "New exam on demand",
  facts_exams_note: "Each new attempt builds a fresh set of questions. There is no fixed list of numbered exams.",
  facts_practice_label: "Practice Mode",
  facts_practice_value: "5 to 50 questions",
  facts_practice_note: "Your own filters, timed or untimed",
  facts_access_label: "Access",
  facts_access_note: "One-time payment for {months} months of access",
  facts_access_note_no_term: "One-time payment",

  compare_eyebrow: "Two Ways to Practise",
  compare_h2: "Full Mock Exams vs. Practice Mode",
  compare_sub: "Both are included. Use Practice Mode to strengthen specific areas, then test yourself under exam conditions.",
  mock_tag: "Exam conditions",
  mock_title: "Full Mock Exam",
  mock_intro: "A full-length, timed simulation of the PMP exam.",
  mock_points: [
    "{questions} questions in {sections} sections of {perSection}, with a {hours}-hour time limit",
    "{breaks} scheduled {breakMins}-minute breaks; each section is sealed for review after its break",
    "Questions are allocated across the People, Process and Business Environment domains",
    "Answers autosave, so you can resume where you left off if your connection drops",
    "The exam auto-submits when time runs out",
    "After a finished exam, retake it with the same questions and compare against your earlier attempt",
  ],
  practice_tag: "Targeted practice",
  practice_title: "Practice Mode",
  practice_intro: "Short, focused sessions on exactly what you need to strengthen.",
  practice_points: [
    "Sessions of 5, 10, 20, 30 or 50 questions",
    "Filter by domain, approach, difficulty and question format",
    "Timed (60 or 78 seconds per question, or a custom duration) or untimed",
    "See how many questions match your filters before you start",
    "Get your score and a full question-by-question review when you finish",
  ],

  features_h2: "What You Get",
  features: [
    { title: "Arabic and English", desc: "Switch between Arabic and English question text and answer options, so you can prepare in the language you think in." },
    { title: "Full Answer Review", desc: "After each attempt, go through every question with the correct answer and, where available, an explanation. Filter by incorrect, unanswered or flagged questions." },
    { title: "Performance Breakdown", desc: "See your results by domain, approach and difficulty to find the areas that need the most work." },
    { title: "Attempt History", desc: "Your mock exams and practice sessions are saved, so you can track your progress and reopen past results." },
    { title: "Retake and Compare", desc: "Retake a finished mock exam with the same questions and see how your score and each domain changed." },
    { title: "Varied Question Formats", desc: "Practise single-choice and multiple-response questions, plus graphic-based and other interactive formats." },
  ],

  faq_h2: "Common Questions",
  faq: [
    { q: "How many questions is a mock exam, and how long does it take?", a: "Each full mock exam has {questions} questions in {sections} sections of {perSection}, with a {hours}-hour time limit and {breaks} scheduled {breakMins}-minute breaks." },
    { q: "How many different mock exams are included?", a: "There is no fixed list of numbered exams. Each time you start a new mock exam, the simulator builds a fresh set of {questions} questions from the approved PMP question bank, favouring questions you have not seen before. The bank is finite, so some questions may repeat across exams, and the simulator keeps overlap with your previous exam low where it can." },
    { q: "Can I retake a mock exam?", a: "Yes. After you finish an exam you can retake it with the exact same questions and a fresh timer, then compare your results with the original attempt." },
    { q: "Is Practice Mode included?", a: "Yes. Access to the simulator includes both Practice Mode and full mock exams." },
    { q: "Can I use it in Arabic?", a: "Yes. You can switch between Arabic and English for the questions and answer options." },
    { q: "What does it cost and how long does access last?", a: "It is a one-time payment for a fixed access period. The current price and access length are shown beside the purchase button on this page." },
    { q: "Will this guarantee I pass the PMP exam?", a: "No. The simulator is a practice tool. PMI does not publish a numeric passing score for the real exam, so your percentage is for self-assessment only." },
  ],
  disclaimer: "PMP is a registered mark of Project Management Institute, Inc. ZentexAI is an independent training provider and is not affiliated with or endorsed by PMI.",

  seo_title: "PMP Exam Simulator: Full Mock Exams & Practice Mode | ZentexAI",
  seo_description:
    "Practise for the PMP exam with full-length {questions}-question timed mock exams and a filterable Practice Mode in Arabic or English, with answer review, performance breakdowns and attempt history.",
};

const ar: SimulatorPageCopy = {
  hero_eyebrow: "محاكي اختبار PMP",
  hero_h1: "تدرّب على اختبار PMP في ظروف واقعية",
  hero_sub:
    "خض اختبارات تجريبية كاملة بوقت محدد وجلسات تدريب مركّزة بالعربية أو الإنجليزية، ثم اعرف بدقة أين تحتاج إلى التحسّن عبر مراجعة كاملة للإجابات بعد كل محاولة.",
  cta_primary: "احصل على الوصول",
  cta_secondary: "اعرف كيف يعمل",

  facts_questions_label: "عدد أسئلة الاختبار التجريبي",
  facts_questions_note: "محاكاة كاملة بوقت محدد",
  facts_time_label: "الوقت المتاح",
  facts_time_value: "{hours} ساعات",
  facts_time_note: "{sections} أقسام من {perSection} سؤالاً، مع استراحات مجدولة (عددها {breaks}، ومدة كل منها {breakMins} دقائق)",
  facts_exams_label: "الاختبارات التجريبية",
  facts_exams_value: "اختبار جديد عند الطلب",
  facts_exams_note: "تُبنى في كل محاولة جديدة مجموعة أسئلة جديدة. لا توجد قائمة ثابتة من الاختبارات المرقّمة.",
  facts_practice_label: "وضع التدريب",
  facts_practice_value: "من 5 إلى 50 سؤالاً",
  facts_practice_note: "بمرشحاتك الخاصة، بوقت محدد أو دونه",
  facts_access_label: "الوصول",
  facts_access_note: "دفعة واحدة مقابل وصول لمدة {months} شهراً",
  facts_access_note_no_term: "دفعة واحدة",

  compare_eyebrow: "طريقتان للتدرّب",
  compare_h2: "الاختبارات التجريبية الكاملة مقابل وضع التدريب",
  compare_sub: "كلاهما مشمول. استخدم وضع التدريب لتقوية مجالات محددة، ثم اختبر نفسك في ظروف الاختبار.",
  mock_tag: "ظروف الاختبار",
  mock_title: "اختبار تجريبي كامل",
  mock_intro: "محاكاة كاملة بوقت محدد لاختبار PMP.",
  mock_points: [
    "{questions} سؤالاً في {sections} أقسام من {perSection} سؤالاً، بحد زمني {hours} ساعات",
    "استراحات مجدولة (عددها {breaks}، ومدة كل منها {breakMins} دقائق)؛ ويُغلق كل قسم للمراجعة بعد استراحته",
    "توزَّع الأسئلة على مجالات الأفراد والعمليات والبيئة التجارية",
    "تُحفظ الإجابات تلقائياً، فيمكنك المتابعة من حيث توقفت إذا انقطع اتصالك",
    "يُسلَّم الاختبار تلقائياً عند انتهاء الوقت",
    "بعد إنهاء اختبار، يمكنك إعادته بالأسئلة نفسها ومقارنة نتيجتك بمحاولتك السابقة",
  ],
  practice_tag: "تدريب مركّز",
  practice_title: "وضع التدريب",
  practice_intro: "جلسات قصيرة ومركّزة على ما تحتاج إلى تقويته بالضبط.",
  practice_points: [
    "جلسات من 5 أو 10 أو 20 أو 30 أو 50 سؤالاً",
    "صفِّ حسب المجال والنهج والصعوبة وصيغة السؤال",
    "بوقت محدد (60 أو 78 ثانية لكل سؤال، أو مدة مخصصة) أو دون وقت",
    "اطّلع على عدد الأسئلة المطابقة لمرشحاتك قبل البدء",
    "احصل على نتيجتك ومراجعة كاملة لكل سؤال عند الانتهاء",
  ],

  features_h2: "ما الذي تحصل عليه",
  features: [
    { title: "بالعربية والإنجليزية", desc: "بدّل بين العربية والإنجليزية في نص الأسئلة وخيارات الإجابة، لتستعد باللغة التي تفكر بها." },
    { title: "مراجعة كاملة للإجابات", desc: "بعد كل محاولة، راجع كل سؤال مع الإجابة الصحيحة، ومع شرح حيثما توفر. وصفِّ حسب الأسئلة الخاطئة أو غير المجابة أو المعلَّمة." },
    { title: "تفصيل الأداء", desc: "اطّلع على نتائجك حسب المجال والنهج والصعوبة لتحدد المجالات التي تحتاج إلى أكبر جهد." },
    { title: "سجل المحاولات", desc: "تُحفظ اختباراتك التجريبية وجلسات التدريب، لتتابع تقدمك وتعيد فتح النتائج السابقة." },
    { title: "الإعادة والمقارنة", desc: "أعد اختباراً تجريبياً منتهياً بالأسئلة نفسها، وشاهد كيف تغيّرت درجتك ونتيجتك في كل مجال." },
    { title: "صيغ أسئلة متنوعة", desc: "تدرّب على أسئلة الاختيار الواحد والاختيار المتعدد، إضافة إلى الأسئلة القائمة على الصور وصيغ تفاعلية أخرى." },
  ],

  faq_h2: "أسئلة متكررة",
  faq: [
    { q: "كم سؤالاً في الاختبار التجريبي، وكم يستغرق؟", a: "يضم كل اختبار تجريبي كامل {questions} سؤالاً في {sections} أقسام من {perSection} سؤالاً، بحد زمني {hours} ساعات واستراحات مجدولة (عددها {breaks}، ومدة كل منها {breakMins} دقائق)." },
    { q: "كم اختباراً تجريبياً مختلفاً مشمول؟", a: "لا توجد قائمة ثابتة من الاختبارات المرقّمة. في كل مرة تبدأ فيها اختباراً تجريبياً جديداً، يبني المحاكي مجموعة جديدة من {questions} سؤالاً من بنك أسئلة PMP المعتمد، مع تفضيل الأسئلة التي لم تشاهدها من قبل. البنك محدود، لذا قد تتكرر بعض الأسئلة بين الاختبارات، ويُبقي المحاكي التداخل مع اختبارك السابق منخفضاً قدر الإمكان." },
    { q: "هل يمكنني إعادة اختبار تجريبي؟", a: "نعم. بعد إنهاء اختبار يمكنك إعادته بالأسئلة نفسها ومؤقّت جديد، ثم مقارنة نتائجك بالمحاولة الأصلية." },
    { q: "هل وضع التدريب مشمول؟", a: "نعم. يشمل الوصول إلى المحاكي وضع التدريب والاختبارات التجريبية الكاملة معاً." },
    { q: "هل يمكنني استخدامه بالعربية؟", a: "نعم. يمكنك التبديل بين العربية والإنجليزية في الأسئلة وخيارات الإجابة." },
    { q: "كم التكلفة وكم مدة الوصول؟", a: "هي دفعة واحدة مقابل مدة وصول محددة. يظهر السعر الحالي ومدة الوصول بجانب زر الشراء في هذه الصفحة." },
    { q: "هل يضمن هذا نجاحي في اختبار PMP؟", a: "لا. المحاكي أداة تدريب. لا ينشر معهد إدارة المشاريع (PMI) درجة نجاح رقمية للاختبار الفعلي، لذا فإن نسبتك مخصصة للتقييم الذاتي فقط." },
  ],
  disclaimer: "PMP علامة مسجلة لمعهد إدارة المشاريع (PMI). ZentexAI جهة تدريب مستقلة وليست تابعة لمعهد PMI أو معتمدة منه.",

  seo_title: "محاكي اختبار PMP بالعربي: اختبارات تجريبية كاملة ووضع تدريب | ZentexAI",
  seo_description:
    "تدرّب لاختبار PMP باختبارات تجريبية كاملة من {questions} سؤالاً بوقت محدد ووضع تدريب قابل للتصفية بالعربية أو الإنجليزية، مع مراجعة الإجابات وتفصيل الأداء وسجل المحاولات.",
};

export const simulatorPageCopy = { en, ar };

export interface SimulatorFacts {
  questions: number;
  hours: number;
  sections: number;
  perSection: number;
  breaks: number;
  breakMins: number;
}

/** Fills {placeholders}; unknown placeholders are left untouched so a typo is visible, never silently dropped. */
export function fillCopy(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Simulator structure derived from an ExamBlueprint-shaped object (never typed in here). */
export function simulatorFactsFromBlueprint(bp: {
  totalQuestions: number;
  durationSeconds: number;
  sections: { questionCount: number }[];
  breaks: { durationSeconds: number }[];
}): SimulatorFacts {
  return {
    questions: bp.totalQuestions,
    hours: Math.round((bp.durationSeconds / 3600) * 10) / 10,
    sections: bp.sections.length,
    perSection: bp.sections[0]?.questionCount ?? 0,
    breaks: bp.breaks.length,
    breakMins: Math.round((bp.breaks[0]?.durationSeconds ?? 0) / 60),
  };
}

/** Localised <title>/<meta description> for the simulator page, with the exam structure filled in from the active blueprint. */
export function simulatorMetadataText(lang: "en" | "ar"): { title: string; description: string } {
  const facts = simulatorFactsFromBlueprint(getActiveBlueprint());
  const copy = simulatorPageCopy[lang];
  return { title: copy.seo_title, description: fillCopy(copy.seo_description, facts as never) };
}
