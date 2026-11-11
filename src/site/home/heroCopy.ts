/**
 * Hero D copy, as supplied for the approved direction. The headline is split
 * into its lead and its teal highlight; `tail` is any text after the highlight
 * on the same line. The English eyebrow is sentence case in the markup and
 * uppercased in CSS, so screen readers read words rather than letters.
 * The eyebrow is three parts so narrow screens can break before the last one.
 * Navigation labels and destinations come from the live header (translations.nav).
 */
const en = {
  eyebrow: ["Real data", "Intelligent systems", "Practical results"],
  title: { lead: "Turn your data into", highlight: "real business results.", tail: "" },
  sub: "We build practical AI solutions that automate workflows, turn data into better decisions, and help businesses operate more efficiently.",
  primary: "Explore Our Services",
  secondary: "Talk to Us",
  menu: "Menu",
  language: { label: "العربية", href: "/ar", lang: "ar" },
};

const ar: typeof en = {
  eyebrow: ["بيانات", "أنظمة ذكية", "نتائج عملية"],
  title: { lead: "حوّل بياناتك إلى", highlight: "نتائج حقيقية", tail: " لأعمالك." },
  sub: "نطوّر حلول ذكاء اصطناعي عملية تساعد الشركات على أتمتة سير العمل، واتخاذ قرارات أفضل بالاعتماد على البيانات، وتحسين كفاءة العمليات.",
  primary: "استكشف خدماتنا",
  secondary: "تواصل معنا",
  menu: "القائمة",
  language: { label: "English", href: "/", lang: "en" },
};

export const heroDCopy = { en, ar };
