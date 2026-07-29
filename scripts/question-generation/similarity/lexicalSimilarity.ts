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

function setJaccard(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Sprint 8 (Phase 6) addition: two questions with an entirely different
 * stem but a near-identical SET of answer options are still a duplicate in
 * every way that matters to a student - the lexical/semantic checks above
 * only ever compare the stem text, so this closes that gap. Order-
 * independent (a shuffled option set still matches).
 */
export function optionSetSimilarity(optionsA: string[], optionsB: string[]): number {
  const setA = new Set(optionsA.map(normalize).filter(Boolean));
  const setB = new Set(optionsB.map(normalize).filter(Boolean));
  return setJaccard(setA, setB);
}

/** Same idea as optionSetSimilarity, applied to each question's tag list. */
export function tagSetSimilarity(tagsA: string[], tagsB: string[]): number {
  const setA = new Set(tagsA.map((t) => t.trim().toLowerCase()).filter(Boolean));
  const setB = new Set(tagsB.map((t) => t.trim().toLowerCase()).filter(Boolean));
  return setJaccard(setA, setB);
}

/**
 * Not a similarity signal on its own (two questions can be totally
 * unrelated and the same length) - a corroborating signal alongside the
 * others: a near-identical length is expected for a true near-duplicate,
 * so a big length gap coexisting with a high lexical/option-set score is
 * worth a second look rather than an automatic assumption either way.
 * Range [0,1], 1 = identical length.
 */
export function lengthSimilarity(textA: string, textB: string): number {
  const lenA = normalize(textA).length;
  const lenB = normalize(textB).length;
  const maxLen = Math.max(lenA, lenB);
  if (maxLen === 0) return 1;
  return 1 - Math.abs(lenA - lenB) / maxLen;
}
