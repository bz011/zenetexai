/**
 * Pure computation helpers backing the AI Generation admin dashboard
 * (Sprint 8, Phase 9). Kept separate from the page's data-fetching so the
 * actual math (averaging, tag tallying, reviewer-activity grouping) is
 * unit-testable without mocking Supabase - same split used elsewhere in this
 * pipeline (computeFinalBatchStatus, discoverCombos, classifyGap).
 */

export function computeAverageQuality(scores: (number | null)[]): number | null {
  const values = scores.filter((s): s is number => s !== null);
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

export interface TagCount {
  tag: string;
  count: number;
}

export function computeTopTags(tagLists: (string[] | null)[], limit = 5): TagCount[] {
  const counts = new Map<string, number>();
  for (const tags of tagLists) {
    for (const tag of tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

export interface ReviewerActivityRow {
  actor: string;
  action: string;
}

export interface ReviewerActivitySummary {
  actor: string;
  count: number;
}

export function summarizeReviewerActivity(rows: ReviewerActivityRow[], limit = 5): ReviewerActivitySummary[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.actor, (counts.get(row.actor) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([actor, count]) => ({ actor, count }))
    .sort((a, b) => b.count - a.count || a.actor.localeCompare(b.actor))
    .slice(0, limit);
}
