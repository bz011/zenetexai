/**
 * Cheap, deterministic, no-API-cost similarity check. Catches verbatim and
 * near-verbatim copies; does NOT reliably catch paraphrasing (see
 * semanticSimilarity.ts for that layer).
 */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shingles(text: string, size = 3): Set<string> {
  const words = normalize(text).split(" ").filter(Boolean);
  const result = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    result.add(words.slice(i, i + size).join(" "));
  }
  if (result.size === 0 && words.length > 0) result.add(words.join(" "));
  return result;
}

/** Jaccard similarity over word-shingles: |A∩B| / |A∪B|, range [0,1]. */
export function jaccardSimilarity(textA: string, textB: string): number {
  const a = shingles(textA);
  const b = shingles(textB);
  if (a.size === 0 && b.size === 0) return 0;

  let intersection = 0;
  for (const shingle of a) {
    if (b.has(shingle)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
