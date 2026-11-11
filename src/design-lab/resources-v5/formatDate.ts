import type { Lang } from "@/design-lab/content";

/**
 * Deterministic article dates for the Resources page.
 *
 * ResourcesHub is a client component, so its dates render on the server
 * (Node) and again during hydration (browser). Intl's month names come from
 * each engine's own CLDR data and differ: Node 22 (ICU 77 / CLDR 47) gives
 * "Sept" for en-GB, Chrome gives "Sep", which broke hydration. This formats
 * the ISO date string itself with fixed month names: no Date, no Intl, no
 * locale or time-zone input, so every environment produces the same string.
 *
 *   en: "11 Sep 2026"     ar: "11 سبتمبر 2026" (Western digits, as on the live site)
 */
const MONTHS: Record<Lang, readonly string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
};

/** Full English month names for article pages ("11 September 2026"); Arabic names are already full. */
const LONG_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** `iso` is a calendar date, "YYYY-MM-DD" (the article's publication date). */
export function formatArticleDate(iso: string, lang: Lang, style: "short" | "long" = "short"): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, year, month, day] = m;
  const names = style === "long" && lang === "en" ? LONG_EN : MONTHS[lang];
  const name = names[Number(month) - 1];
  return name ? `${Number(day)} ${name} ${year}` : iso;
}
