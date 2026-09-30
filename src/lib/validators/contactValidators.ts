import { z } from "zod";

/**
 * Server-side contact-form validation. Mirrors the four inquiry types the
 * form's own <select> offers (see contact.inquiry_types in translations.ts) -
 * an unlisted value is rejected rather than forwarded as-is. Length caps are
 * generous for a real inquiry but bound the size of what gets forwarded to
 * the Google Apps Script destination and, eventually, into the business's
 * spreadsheet.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(160).optional().default(""),
  inquiryType: z.enum(["business", "consultation", "training", "general"]),
  message: z.string().trim().min(1).max(5000),
});

export type ContactValues = z.infer<typeof contactSchema>;
