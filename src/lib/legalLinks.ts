/**
 * Legal / trust links shown in the footer and next to purchase actions.
 *
 * WAVE 0 UPDATE (Master Audit, 2026-09-30, final pass): Privacy/Terms/Refund
 * pages exist (src/app/(en)/(corporate)/{privacy,terms,refund}/page.tsx,
 * content in src/lib/legalCopy.ts) and are wired below. Content is finalized
 * against explicit owner decisions (business identity, refund policy, age,
 * contact address) - no "[OWNER DECISION REQUIRED]" markers remain in any of
 * the three documents. A few narrow clauses that genuinely depend on
 * jurisdiction (data-protection rights, liability, governing law) are
 * written in deliberately conservative, non-committal language rather than
 * asserting a specific legal conclusion - see legalCopy.ts's own header for
 * exactly which. tests/legalLinks.test.ts confirms each href resolves to a
 * real, public route.
 */
export interface LegalLink {
  id: "privacy" | "terms" | "refund";
  href: string;
  label: { en: string; ar: string };
}

export const LEGAL_LINKS: readonly LegalLink[] = [
  { id: "privacy", href: "/privacy", label: { en: "Privacy Policy", ar: "سياسة الخصوصية" } },
  { id: "terms", href: "/terms", label: { en: "Terms of Service", ar: "شروط الخدمة" } },
  { id: "refund", href: "/refund", label: { en: "Refund Policy", ar: "سياسة الاسترداد" } },
];
