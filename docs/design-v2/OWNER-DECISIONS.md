# Owner decisions and inputs needed

Items the redesign deliberately did **not** decide or invent. Each one needs the owner.

## 1. Legal pages (blocking for a paid launch)

Privacy Policy, Terms of Service and Refund Policy do not exist and were not written.
The footer has a slot for them ([src/lib/legalLinks.ts](../../src/lib/legalLinks.ts), `LEGAL_LINKS = []`).
While the list is empty, no link is rendered, so there are no dead links.
A test fails if an entry points at a route that does not exist.

Action: provide reviewed text (or approve a template reviewed by counsel). Then add the entries and pages.

## 2. Contact form is probably blocked by the CSP (needs a decision)

[src/components/ContactForm.tsx](../../src/components/ContactForm.tsx) posts to a Google Apps Script URL (`script.google.com`).
[next.config.mjs](../../next.config.mjs) sets `connect-src 'self'` plus Supabase, so a browser enforcing the production CSP should block that request.
This predates the redesign and is unchanged. It was not verified against a live deployment (no production access by design).

Options: (a) add the script origin to `connect-src` (widens the CSP by one origin),
(b) move submission to a same-origin API route that forwards server-side (preferred: no CSP change, adds rate limiting and validation),
(c) confirm it already works in production and record why.

## 3. Authentic Simulator / Mock Exam screenshots

The Academy hero uses one real lesson-player capture. No real Simulator or Mock Exam screenshot exists in the repo,
so the Simulator page has no product imagery (it uses the text/step diagram only). Nothing was mocked up.

Action: capture real screens from a test account (no student data, no real names or emails), then add them via the same `CropImage` approach.

## 4. PMP Mastery and Simulator product pages

These are data-driven. They received the shared tokens, header, footer, accessibility and SEO work only, with no speculative visual redesign.

Action: a data-backed audit of the two pages is needed (real curriculum, pricing and purchase-flow states) before redesigning them.

## 5. Claims to verify before they stay on the site

- "We'll respond within 24 hours" (contact form, contact page, services CTA). Confirm you can honour it.
- Timeline wording on service pages (for example "8 weeks" style phrases where present). Confirm or soften.
- No customer counts, ratings, testimonials, results or affiliations were added. Adding any needs evidence.

## 6. Arabic navigation

About, Blog and Resources remain single hybrid pages: Arabic is carried by a persisted language preference, not by `/ar/...` URLs.
Arabic-language pages for them would improve Arabic SEO and are a content and translation task.

## 7. Homepage 3D layer

Built and measured, but **disabled by default** (`FLOW_3D_DEFAULT=false` in [src/lib/featureFlags.ts](../../src/lib/featureFlags.ts)). Preview with `?flow3d=1`.
See [3D-EVALUATION.md](3D-EVALUATION.md). Enabling it is a product call: it adds a lazy chunk and a visible depth effect on desktop only.

## 8. Brand

Corporate is dark and Academy is light, using the logo blue and cyan as accents only. The logo tagline colours were lightened on dark for AA contrast.
If the brand guide fixes different tagline colours, tell us and the contrast test will show what is possible.
