/**
 * Legal / trust links shown in the footer and next to purchase actions.
 *
 * DELIBERATELY EMPTY. Privacy Policy, Terms of Service and Refund Policy are
 * legal documents the business owner must supply and approve; the site does not
 * publish placeholder policies or dead links. To go live, add an entry here
 * once its page exists - the footer and the purchase area render the links
 * automatically, and tests/legalLinks.test.ts fails if an entry points at a
 * route that does not exist. Open owner decisions are listed in
 * docs/design-v2/OWNER-DECISIONS.md.
 */
export interface LegalLink {
  id: "privacy" | "terms" | "refund";
  href: string;
  label: { en: string; ar: string };
}

export const LEGAL_LINKS: readonly LegalLink[] = [];
