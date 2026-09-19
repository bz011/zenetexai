"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";

interface RelatedItem {
  href: string;
  en: string;
  /** Arabic label. Items without one (e.g. English-only blog articles) are not shown to Arabic readers. */
  ar?: string;
}

const STYLES = {
  muted: "text-[13px] text-slate-500 transition-colors hover:text-slate-200",
  accent: "text-[13px] font-medium text-indigo-400 transition-colors hover:text-indigo-300",
};

export default function RelatedLinkRow({ items, variant = "muted" }: { items: RelatedItem[]; variant?: keyof typeof STYLES }) {
  const { lang } = useLang();
  const visible = lang === "ar" ? items.filter((i) => i.ar) : items;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
      {visible.map((i) => (
        <Link key={i.href} href={i.href} className={STYLES[variant]}>
          {lang === "ar" ? i.ar : i.en}
        </Link>
      ))}
    </div>
  );
}
