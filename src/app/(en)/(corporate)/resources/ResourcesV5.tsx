"use client";

import { useLang } from "@/lib/LanguageContext";
import ResourcesPage from "@/site/resources/ResourcesPage";
import type { Article } from "@/site/resources/resourcesCopy";

/** /resources has no /ar twin: it follows the stored language preference, as before. */
export default function ResourcesV5({ articles }: { articles: Article[] }) {
  const { lang } = useLang();
  return <ResourcesPage lang={lang} articles={articles} />;
}
