import type { Lang } from "@/site/content";

/**
 * Contact page (v5) copy.
 *
 * Verified facts only:
 *  - WhatsApp (+971 56 622 7824) is the one public contact channel the live
 *    site shows (translations.ts contact.details, design-lab WHATSAPP_URL).
 *    info@zentexai.com is not a live mailbox (branding.ts) and no personal
 *    address is shown on the Contact page, so no email is listed.
 *  - No address, phone line, business hours or response-time promise is
 *    stated (the live page's "Within 24 hours" is deliberately not repeated).
 *  - The four topics keep the live form's exact values (contactSchema:
 *    business | consultation | training | general); only their labels and
 *    hints are clearer. The services named in the hints are the site's own
 *    (Services page, Terms of Service: AI solutions, AI consulting, project
 *    management consulting; Academy: PMP Mastery Program, PMP Exam
 *    Simulator).
 *  - The privacy line restates the Privacy Policy (details are collected "so
 *    we can respond to you").
 */

export type InquiryValue = "business" | "consultation" | "training" | "general";

export type ContactCopy = {
  eyebrow: string;
  title: { lead: string; highlight: string };
  sub: string;
  direct: { heading: string; label: string; value: string; note: string };
  include: { heading: string; items: string[] };
  form: {
    heading: string;
    name: string;
    email: string;
    company: string;
    optional: string;
    topic: string;
    topics: { value: InquiryValue; label: string; hint: string }[];
    message: string;
    messagePlaceholder: string;
    privacy: { before: string; link: string; after: string };
    submit: string;
    sending: string;
    previewBadge: string;
  };
  errors: {
    nameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    messageRequired: string;
    tooLong: string;
    summary: string;
  };
  result: {
    previewTitle: string;
    previewText: string;
    successTitle: string;
    successText: string;
    sendAnother: string;
    failed: string;
    rateLimited: string;
  };
};

const en: ContactCopy = {
  eyebrow: "Contact ZentexAI",
  title: { lead: "Let's build", highlight: "something useful." },
  sub: "Tell us what you're working on or where your business needs support. We'll help you explore the right next step.",
  direct: {
    heading: "Prefer to talk directly?",
    label: "WhatsApp",
    value: "+971 56 622 7824",
    note: "Message us on WhatsApp",
  },
  include: {
    heading: "Helpful to include",
    items: ["What you're trying to achieve", "The tools, systems or data involved", "Your timeline, if you have one"],
  },
  form: {
    heading: "Send an inquiry",
    name: "Full name",
    email: "Work email",
    company: "Company or organization",
    optional: "Optional",
    topic: "What can we help you with?",
    topics: [
      { value: "business", label: "A business project", hint: "AI agents, automation, data and analytics" },
      { value: "consultation", label: "Consultation", hint: "AI strategy or project management advice" },
      { value: "training", label: "Training and Academy", hint: "PMP Mastery Program, PMP Exam Simulator" },
      { value: "general", label: "Something else", hint: "Any other question" },
    ],
    message: "Project details",
    messagePlaceholder: "What are you working on, and where could we help?",
    privacy: { before: "We'll use these details only to respond to your inquiry. See our ", link: "Privacy Policy", after: "." },
    submit: "Send inquiry",
    sending: "Sending…",
    previewBadge: "Design preview: messages from this page are not sent.",
  },
  errors: {
    nameRequired: "Please enter your name.",
    emailRequired: "Please enter your email address.",
    emailInvalid: "Please enter a valid email address, like name@company.com.",
    messageRequired: "Please tell us a little about what you need.",
    tooLong: "This is longer than we can accept. Please shorten it.",
    summary: "Please check the highlighted fields.",
  },
  result: {
    previewTitle: "Preview only: nothing was sent",
    previewText: "Your inquiry passed every check, but this design preview does not deliver messages. On the live site, this form sends your inquiry to the ZentexAI team.",
    successTitle: "Thank you, your inquiry was sent",
    successText: "We'll read it and get back to you by email.",
    sendAnother: "Send another inquiry",
    failed: "Your inquiry could not be sent. Please try again, or message us on WhatsApp.",
    rateLimited: "Too many messages were sent from this connection. Please wait a few minutes and try again.",
  },
};

const ar: ContactCopy = {
  eyebrow: "تواصل مع ZentexAI",
  title: { lead: "لنحوّل فكرتك", highlight: "إلى حلٍّ عملي." },
  sub: "أخبرنا عن مشروعك أو التحدي الذي تواجهه مؤسستك، ولنناقش معاً كيف يمكننا مساعدتك.",
  direct: {
    heading: "تفضّل التواصل المباشر؟",
    label: "واتساب",
    value: "+971 56 622 7824",
    note: "راسلنا عبر واتساب",
  },
  include: {
    heading: "يفيدنا أن تذكر",
    items: ["ما الذي تسعى إلى تحقيقه", "الأدوات أو الأنظمة أو البيانات المعنية", "الإطار الزمني، إن وُجد"],
  },
  form: {
    heading: "أرسل استفسارك",
    name: "الاسم الكامل",
    email: "بريد العمل الإلكتروني",
    company: "الشركة أو المؤسسة",
    optional: "اختياري",
    topic: "كيف يمكننا مساعدتك؟",
    topics: [
      { value: "business", label: "مشروع لمؤسستك", hint: "وكلاء ذكاء اصطناعي، أتمتة، بيانات وتحليلات" },
      { value: "consultation", label: "استشارة", hint: "استراتيجية الذكاء الاصطناعي أو إدارة المشاريع" },
      { value: "training", label: "التدريب والأكاديمية", hint: "⁦PMP Mastery Program⁩ ومحاكي اختبار ⁦PMP⁩" },
      { value: "general", label: "استفسار آخر", hint: "أي سؤال آخر" },
    ],
    message: "تفاصيل المشروع",
    messagePlaceholder: "على ماذا تعمل، وأين يمكننا المساعدة؟",
    privacy: { before: "نستخدم هذه البيانات فقط للرد على استفسارك. اطّلع على ", link: "سياسة الخصوصية", after: "." },
    submit: "أرسل الاستفسار",
    sending: "جارٍ الإرسال…",
    previewBadge: "نسخة تصميم تجريبية: لا تُرسَل الرسائل من هذه الصفحة.",
  },
  errors: {
    nameRequired: "يرجى إدخال اسمك.",
    emailRequired: "يرجى إدخال بريدك الإلكتروني.",
    emailInvalid: "يرجى إدخال بريد إلكتروني صحيح، مثل name@company.com.",
    messageRequired: "يرجى كتابة نبذة عمّا تحتاجه.",
    tooLong: "النص أطول من المسموح. يرجى اختصاره.",
    summary: "يرجى مراجعة الحقول المحدّدة.",
  },
  result: {
    previewTitle: "نسخة تجريبية: لم يُرسَل شيء",
    previewText: "اجتاز استفسارك جميع عمليات التحقق، لكن هذه النسخة التجريبية من التصميم لا ترسل الرسائل. على الموقع الفعلي، يُرسل هذا النموذج استفسارك إلى فريق ZentexAI.",
    successTitle: "شكراً لك، تم إرسال استفسارك",
    successText: "سنقرؤه ونعاود التواصل معك عبر البريد الإلكتروني.",
    sendAnother: "إرسال استفسار آخر",
    failed: "تعذّر إرسال استفسارك. يرجى المحاولة مرة أخرى، أو مراسلتنا عبر واتساب.",
    rateLimited: "أُرسل عدد كبير من الرسائل من هذا الاتصال. يرجى الانتظار بضع دقائق ثم المحاولة مرة أخرى.",
  },
};

export const contactCopy: Record<Lang, ContactCopy> = { en, ar };
