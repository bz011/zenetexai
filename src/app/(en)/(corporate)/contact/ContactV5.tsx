"use client";

import { useLang } from "@/lib/LanguageContext";
import ContactPage from "@/site/contact/ContactPage";

/**
 * /contact has no /ar twin: like the page it replaces, it follows the
 * visitor's stored language preference (LanguageContext). The form posts to
 * the existing /api/contact route with the unchanged production contract.
 */
export default function ContactV5() {
  const { lang } = useLang();
  return <ContactPage lang={lang} />;
}
