/**
 * Homepage v5, final call to action: copy as supplied in the brief. The button
 * goes to the contact page through the page's own href() (localizeHref), so
 * English is /contact and Arabic is the Arabic home's contact form (/ar#contact).
 */
export type CtaCopy = { eyebrow?: string; lead: string; highlight?: string; text?: string; button: string };

const en: CtaCopy = {
  eyebrow: "Let's connect",
  lead: "Have a challenge in mind?",
  highlight: "Let's find the right solution.",
  text: "Tell us what you're looking to improve. We'll explore how technology can help your business move forward.",
  button: "Start a Conversation",
};

const ar: CtaCopy = {
  eyebrow: "لنتواصل",
  lead: "عندك تحدٍّ في أعمالك؟",
  highlight: "خلّينا نلاقي الحل المناسب.",
  text: "احكيلنا شو حابب تطوّر في أعمالك، وخلّينا نستكشف معك كيف ممكن تساعدك التقنية على تحقيق أهدافك.",
  button: "ابدأ المحادثة",
};

export const ctaCopy = { en, ar };
