/**
 * Copy for shared page chrome (skip link, navigation labels, language and menu
 * controls). Kept out of translations.ts so the chrome can be reasoned about
 * and tested on its own; read with `chromeCopy[lang]`.
 */
export const chromeCopy = {
  en: {
    skipToContent: "Skip to main content",
    switchLanguage: "Switch language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mainNavigation: "Main navigation",
    mobileNavigation: "Mobile navigation",
    footerNavigation: "Footer navigation",
    legalNavigation: "Legal",
    homeLabel: "ZentexAI home",
  },
  ar: {
    skipToContent: "تخطَّ إلى المحتوى الرئيسي",
    switchLanguage: "تبديل اللغة",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    mainNavigation: "التنقل الرئيسي",
    mobileNavigation: "التنقل على الجوال",
    footerNavigation: "التنقل في التذييل",
    legalNavigation: "السياسات",
    homeLabel: "ZentexAI - الرئيسية",
  },
} as const;

export type ChromeCopy = (typeof chromeCopy)["en"];

/** Footer link groups. Labels are short names of pages that already exist; no new claims. */
export const footerCopy = {
  en: {
    servicesHeading: "Services",
    academyHeading: "Academy",
    companyHeading: "Company",
    services: {
      agents: "AI Agents & Automation",
      whatsapp: "WhatsApp Automation",
      ml: "Machine Learning",
      analytics: "Data Analytics",
      powerbi: "Power BI Consulting",
    },
    academy: { mastery: "PMP Mastery Program", simulator: "PMP Exam Simulator", overview: "Academy overview" },
  },
  ar: {
    servicesHeading: "الخدمات",
    academyHeading: "الأكاديمية",
    companyHeading: "الشركة",
    services: {
      agents: "وكلاء الذكاء الاصطناعي والأتمتة",
      whatsapp: "أتمتة واتساب",
      ml: "تعلّم الآلة",
      analytics: "تحليل البيانات",
      powerbi: "استشارات Power BI",
    },
    academy: { mastery: "برنامج احتراف PMP", simulator: "محاكي اختبار PMP", overview: "نظرة عامة على الأكاديمية" },
  },
} as const;

export const formCopy = {
  en: { error: "Something went wrong. Please try again.", requiredHint: "required" },
  ar: { error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.", requiredHint: "مطلوب" },
} as const;
