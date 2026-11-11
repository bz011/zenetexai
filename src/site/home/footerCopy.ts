/**
 * Homepage v5 footer copy. Destinations are existing routes only (localized
 * through the page's href(), like the header): Services, Academy, About, Blog,
 * Contact, Privacy and Terms are real pages; Solutions has no page, so it
 * points at the homepage's Solutions section. The "Connect" column is left
 * out: the project has no verified LinkedIn or Instagram URL, and the company
 * address in src/lib/branding.ts is marked as not yet live.
 */
export type FooterLink = { label: string; href: string };
export type FooterCopy = {
  home: string;
  statement: string;
  navLabel: string;
  columns: { title: string; links: FooterLink[] }[];
  rights: string;
  legal: FooterLink[];
  legalLabel: string;
};

const en: FooterCopy = {
  home: "ZentexAI home",
  statement: "Practical AI. Real Business Impact.",
  navLabel: "Footer",
  columns: [
    {
      title: "Explore",
      links: [
        { label: "Services", href: "/services" },
        { label: "Solutions", href: "#solutions" },
        { label: "Academy", href: "/academy" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ],
  rights: "All rights reserved.",
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
  legalLabel: "Legal",
};

const ar: FooterCopy = {
  home: "الصفحة الرئيسية لـ ZentexAI",
  statement: "ذكاء اصطناعي عملي. أثر حقيقي في أعمالك.",
  navLabel: "روابط التذييل",
  columns: [
    {
      title: "استكشف",
      links: [
        { label: "الخدمات", href: "/services" },
        { label: "الحلول", href: "#solutions" },
        { label: "الأكاديمية", href: "/academy" },
      ],
    },
    {
      title: "الشركة",
      links: [
        { label: "من نحن", href: "/about" },
        { label: "المدونة", href: "/blog" },
        { label: "تواصل معنا", href: "/contact" },
      ],
    },
  ],
  rights: "جميع الحقوق محفوظة.",
  legal: [
    { label: "سياسة الخصوصية", href: "/privacy" },
    { label: "شروط الاستخدام", href: "/terms" },
  ],
  legalLabel: "روابط قانونية",
};

export const footerCopy = { en, ar };
