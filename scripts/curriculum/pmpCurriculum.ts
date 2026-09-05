/**
 * PMP Mastery Program curriculum — SOURCE OF TRUTH.
 *
 * This is the confirmed, owner-approved curriculum structure (6 modules,
 * 62 lesson slots) for the `courses.slug = 'pmp'` course. Database
 * ordering here (module order, lesson order) is authoritative — Bunny's
 * own video ordering/titles are only used as matching references to
 * locate already-uploaded videos, never as a source of student-facing
 * titles or ordering. See seedPmpCurriculum.ts (writes this into
 * courses/modules/lessons) and bunnySync.ts (matches `bunnyReferenceName`
 * against the Bunny Stream library and attaches the resulting GUID).
 *
 * Lesson 11 of Module 5 is a deliberate exception: its real title is not
 * yet known. `isPublished: false` keeps it out of every student-facing
 * read path (courseService.ts already filters `is_published = true`
 * everywhere, and RLS enforces the same restriction independently) until
 * a real title is supplied — never invent one.
 */

export interface CurriculumLessonSeed {
  /** 1-based position within the module — also the source of the generated slug and order_index. */
  n: number;
  titleEn: string;
  titleAr: string;
  /** Exact string used to locate this lesson's video in the Bunny Stream library. Never shown to students. */
  bunnyReferenceName: string;
  isPublished: boolean;
}

export interface CurriculumModuleSeed {
  slug: string;
  titleEn: string;
  titleAr: string;
  orderIndex: number;
  lessons: CurriculumLessonSeed[];
}

function published(n: number, titleEn: string, titleAr: string, bunnyReferenceName: string): CurriculumLessonSeed {
  return { n, titleEn, titleAr, bunnyReferenceName, isPublished: true };
}

export const PMP_COURSE_SLUG = "pmp";

export const PMP_CURRICULUM: CurriculumModuleSeed[] = [
  {
    slug: "course-introduction",
    titleEn: "Course Introduction",
    titleAr: "مقدمة الكورس",
    orderIndex: 0,
    lessons: [
      published(1, "PMP Course Introduction", "مقدمة دورة PMP", "Module 1 Part 1"),
      published(2, "Why PMP Matters", "لماذا تُعد شهادة PMP مهمة؟", "Module 1 Part 2"),
      published(3, "What's New in PMP — July 2026", "ما الجديد في PMP — يوليو 2026", "Module 1 Part 3"),
      published(4, "People Domain Preview", "نظرة عامة على مجال الأشخاص", "Module 1 Part 4"),
      published(5, "Business Environment Domain Preview", "نظرة عامة على مجال بيئة الأعمال", "Module 1 Part 5"),
    ],
  },
  {
    slug: "project-management-foundations",
    titleEn: "Project Management Foundations",
    titleAr: "أسس إدارة المشاريع",
    orderIndex: 1,
    lessons: [
      published(1, "Project Management Foundations", "أسس إدارة المشاريع", "module2-part1.mp4"),
      published(2, "What Is a Project?", "ما هو المشروع؟", "module2-part2.mp4"),
      published(3, "Project, Program & Portfolio", "المشروع والبرنامج والمحفظة", "module2-part3.mp4"),
      published(4, "Outputs, Outcomes & Benefits", "المخرجات والنتائج والفوائد", "module2-part4.mp4"),
      published(5, "Value Delivery System", "نظام تقديم القيمة", "module2-part5.mp4"),
      published(6, "Organizational Governance", "الحوكمة المؤسسية", "module2-part6.mp4"),
      published(7, "Project Governance", "حوكمة المشروع", "module2-part7.mp4"),
      published(8, "Organizational Structures", "الهياكل التنظيمية", "module2-part8.mp4"),
      published(9, "Project Life Cycle", "دورة حياة المشروع", "module2-part9.mp4"),
      published(10, "Stakeholders and Complexity", "أصحاب المصلحة والتعقيد", "module2-part10.mp4"),
      published(11, "Tailoring", "التكييف", "module2-part11.mp4"),
    ],
  },
  {
    slug: "agile-and-hybrid-mastery",
    titleEn: "Agile and Hybrid Mastery",
    titleAr: "إتقان المنهجيات الرشيقة والهجينة",
    orderIndex: 2,
    lessons: [
      published(1, "Agile and Hybrid Mastery", "إتقان المنهجيات الرشيقة والهجينة", "module3-part1.mp4"),
      published(2, "Agile Mindset and Manifesto", "العقلية الرشيقة وبيان أجايل", "module3-part2.mp4"),
      published(3, "The 12 Agile Principles", "مبادئ أجايل الاثنا عشر", "module3-part3.mp4"),
      published(4, "Scrum Framework", "إطار عمل سكرم", "module3-part4.mp4"),
      published(5, "Kanban & Flow", "كانبان وتدفق العمل", "module3-part5.mp4"),
      published(6, "Lean & XP Overview", "نظرة عامة على Lean وXP", "module3-part6.mp4"),
      published(7, "Hybrid Approaches", "الأساليب الهجينة", "module3-part7.mp4"),
      published(8, "Agile Planning and Estimation", "التخطيط والتقدير في أجايل", "module3-part8.mp4"),
      published(9, "Agile Team Leadership", "قيادة فرق أجايل", "module3-part9.mp4"),
      published(10, "Agile Metrics and Performance", "مقاييس وأداء أجايل", "module3-part10.mp4"),
      published(11, "Agile Stakeholder Engagement", "إشراك أصحاب المصلحة في أجايل", "module3-part11.mp4"),
      published(12, "Agile Risk and Quality", "المخاطر والجودة في أجايل", "module3-part12.mp4"),
    ],
  },
  {
    slug: "people-domain",
    titleEn: "People Domain",
    titleAr: "مجال الأشخاص",
    orderIndex: 3,
    lessons: [
      published(1, "People Domain Introduction", "مقدمة إلى مجال الأشخاص", "module4-video1.mp4"),
      published(2, "Common Vision and Shared Understanding", "الرؤية المشتركة والفهم المشترك", "module4-video2.mp4"),
      published(3, "Leadership Styles and Situational Leadership", "أنماط القيادة والقيادة الموقفية", "module4-video3.mp4"),
      published(4, "Emotional Intelligence (EI)", "الذكاء العاطفي (EI)", "module4-video4.mp4"),
      published(5, "Motivation Theories", "نظريات التحفيز", "module4-video5.mp4"),
      published(6, "Team Development — Tuckman Model", "تطوير الفريق — نموذج تاكمان", "module4-video6.mp4"),
      published(7, "Conflict Management", "إدارة النزاعات", "module4-video7.mp4"),
      published(8, "Negotiation and Influencing", "التفاوض والتأثير", "module4-video8.mp4"),
      published(9, "Stakeholder Engagement and Expectation Management", "إشراك أصحاب المصلحة وإدارة التوقعات", "module4-video9.mp4"),
      published(10, "Communication and Collaboration", "التواصل والتعاون", "module4-video10.mp4"),
      published(11, "Diversity, Equity and Inclusion", "التنوع والإنصاف والشمول", "module4-video11.mp4"),
      published(12, "Virtual and Distributed Teams", "الفرق الافتراضية والموزعة", "module4-video12.mp4"),
      published(13, "Training, Mentoring and Coaching", "التدريب والإرشاد والتوجيه", "module4-video13.mp4"),
      published(14, "Knowledge Transfer, Reporting and Governance", "نقل المعرفة وإعداد التقارير والحوكمة", "module4-video14.mp4"),
    ],
  },
  {
    slug: "process-domain",
    titleEn: "Process Domain",
    titleAr: "مجال العمليات",
    orderIndex: 4,
    lessons: [
      published(1, "Process Domain Introduction", "مقدمة إلى مجال العمليات", "module 5 introduction compressed"),
      published(2, "Integrated Project Planning and Delivery Strategy", "التخطيط المتكامل للمشروع واستراتيجية التسليم", "module 5 vid 1 compressed"),
      published(3, "Scope and Requirements Management", "إدارة النطاق والمتطلبات", "module 5 vid 2 compressed"),
      published(4, "Value-Based Delivery and Benefits", "التسليم القائم على القيمة والفوائد", "module 5 vid 3 compressed"),
      published(5, "Procurement, Contracts and Vendor Management", "إدارة المشتريات والعقود والموردين", "module 5 vid 4 compressed"),
      published(6, "Financial Planning and Management", "التخطيط والإدارة المالية", "module 5 vid 5 compressed"),
      published(7, "Quality Planning and Management", "تخطيط الجودة وإدارتها", "module 5 vid 6 compressed"),
      published(8, "Schedule Planning and Management", "تخطيط الجدول الزمني وإدارته", "module 5 vid 7 compressed"),
      published(9, "Project Metrics, Status and Performance", "مقاييس المشروع وحالته وأداؤه", "module 5 vid 8 compressed"),
      published(10, "Project Closure and Transition", "إغلاق المشروع والانتقال", "module 5 vid 9 compressed"),
      {
        n: 11,
        // CRITICAL: real title unknown - do not invent one. This exact
        // placeholder text was supplied by the course owner specifically
        // to mark this slot as pending, not as real student-facing copy.
        titleEn: "TITLE PENDING — DO NOT INVENT",
        titleAr: "العنوان قيد التحديد — لا تخمّنه",
        bunnyReferenceName: "module 5 vid 10 compressed",
        isPublished: false,
      },
    ],
  },
  {
    slug: "business-environment-domain",
    titleEn: "Business Environment Domain",
    titleAr: "مجال بيئة الأعمال",
    orderIndex: 5,
    lessons: [
      published(1, "Business Environment Introduction", "مقدمة إلى مجال بيئة الأعمال", "introduction video"),
      published(2, "Project Governance", "حوكمة المشروع", "module 6 video 1"),
      published(3, "Compliance, Security & Sustainability", "الامتثال والأمن والاستدامة", "module 6 video 2"),
      published(4, "Change Control & Change Management", "ضبط التغييرات وإدارة التغيير", "module 6 video 3"),
      published(5, "Impediments, Blockers & Issue Management", "إدارة العوائق والعقبات والمشكلات", "module 6 video 4"),
      published(6, "Project Risk Management", "إدارة مخاطر المشروع", "module 6 video 5"),
      published(7, "Continuous Improvement & Organizational Learning", "التحسين المستمر والتعلم المؤسسي", "module 6 video 6"),
      published(8, "Organizational Change", "التغيير المؤسسي", "module 6 video 7"),
      published(9, "External Business Environment", "بيئة الأعمال الخارجية", "module 6 video 8"),
    ],
  },
];

export function lessonSlug(moduleSlug: string, n: number): string {
  return `${moduleSlug}-lesson-${n}`;
}

export const TOTAL_CURRICULUM_LESSONS = PMP_CURRICULUM.reduce((sum, m) => sum + m.lessons.length, 0);
