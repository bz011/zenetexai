/**
 * Exam durations as words, in the visitor's language (audit F7). The start
 * panel used to print "4h" and "2 × 10m" in both languages, which reads
 * backwards in right-to-left Arabic and leaves the units untranslated.
 *
 * Arabic counted nouns agree with the number: 1 ساعة, 2 ساعتان, 3-10 ساعات,
 * 11+ ساعة (and the same pattern for دقيقة / استراحة).
 */
type Lang = "en" | "ar";

function arCount(n: number, one: string, two: string, few: string, many: string): string {
  if (n === 1) return `${one} واحدة`;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}

const arHours = (n: number) => arCount(n, "ساعة", "ساعتان", "ساعات", "ساعة");
const arMinutes = (n: number) => (n === 1 ? "دقيقة واحدة" : n === 2 ? "دقيقتان" : n >= 3 && n <= 10 ? `${n} دقائق` : `${n} دقيقة`);

/** 240 -> "4h" / "4 ساعات"; 230 -> "3h 50m" / "3 ساعات و50 دقيقة". */
export function formatExamDuration(totalMinutes: number, lang: Lang): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (lang === "ar") {
    if (h === 0) return arMinutes(m);
    return m === 0 ? arHours(h) : `${arHours(h)} و${arMinutes(m)}`;
  }
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** 2 breaks of 10 minutes -> "2 × 10m" / "استراحتان (10 دقائق لكل استراحة)". */
export function formatExamBreaks(count: number, minutesEach: number, lang: Lang): string {
  if (lang === "ar") {
    if (count === 0) return "لا توجد استراحات";
    const breaks = count === 1 ? "استراحة واحدة" : count === 2 ? "استراحتان" : count <= 10 ? `${count} استراحات` : `${count} استراحة`;
    return count === 1 ? `${breaks} (${arMinutes(minutesEach)})` : `${breaks} (${arMinutes(minutesEach)} لكل استراحة)`;
  }
  return count === 0 ? "None" : `${count} × ${minutesEach}m`;
}
