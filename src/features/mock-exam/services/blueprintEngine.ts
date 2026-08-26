/**
 * Blueprint allocation engine (Sprint 9) - pure functions, zero I/O, fully
 * unit-testable without mocking Supabase (same precedent as
 * computeFinalBatchStatus/discoverCombos/classifyGap/pickLeastUsedUnusedPattern
 * elsewhere in this codebase).
 *
 * Fallback priority, exactly as approved in the Sprint 9 architecture:
 *   1. total question count (always exactly what was requested)
 *   2. Domain allocation
 *   3. Approach balance within Domain
 *   4. Difficulty balance within Domain x Approach
 *   5. interaction-type / answer-type mix (exam-wide, lowest priority, best-effort)
 *
 * Domain x Approach x Difficulty forms the "cell grid" this engine resolves
 * against real inventory counts. interaction-type/answer-type targets are
 * computed separately as exam-WIDE counts (not per-cell) - with only 1
 * hotspot and 4 drag_and_drop questions in the whole bank, per-cell targets
 * for those would be meaningless. The actual question SELECTION functions
 * below (pickQuestionsForDraw/selectQuestionsForDraws) still take plain
 * in-memory arrays, not a Supabase client - examInventoryService.ts is the
 * only place with real DB access this module deliberately
 * does not.
 */

import type { ExamBlueprint, PmpDomain, PmpApproach, PmpDifficulty, PmpInteractionType, PmpAnswerType } from "../config/examBlueprint";

type PrimaryApproach = "Predictive" | "Agile" | "Hybrid";
const PRIMARY_APPROACHES: PrimaryApproach[] = ["Predictive", "Agile", "Hybrid"];
const DOMAINS: PmpDomain[] = ["People", "Process", "Business Environment"];
const DIFFICULTIES: PmpDifficulty[] = ["Easy", "Moderate", "Difficult", "Expert"];
/** Degrade-to order when a difficulty tier is short - Expert folds into Difficult, Difficult into Moderate, Moderate into Easy, Easy has nowhere left to fold (front of the line). */
const DIFFICULTY_FALLBACK_ORDER: Record<PmpDifficulty, PmpDifficulty | null> = {
  Expert: "Difficult",
  Difficult: "Moderate",
  Moderate: "Easy",
  Easy: null,
};

/**
 * Largest-remainder rounding: allocates `total` discrete items across
 * `weights` (percentages, need not sum to exactly 100 - normalized
 * internally) such that every allocation is a non-negative integer and the
 * sum is EXACTLY `total`, never total-1 or total+1 from naive per-item
 * rounding. This is the one primitive every domain/approach/difficulty
 * allocation in this engine is built from.
 */
export function allocateByWeights<K extends string>(total: number, weights: Record<K, number>): Record<K, number> {
  const keys = Object.keys(weights) as K[];
  const weightSum = keys.reduce((sum, k) => sum + weights[k], 0);

  if (total <= 0 || keys.length === 0 || weightSum <= 0) {
    return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  }

  const raw = keys.map((k) => ({ key: k, value: (weights[k] / weightSum) * total }));
  const floors = raw.map((r) => ({ key: r.key, floor: Math.floor(r.value), remainder: r.value - Math.floor(r.value) }));

  let allocated = floors.reduce((sum, f) => sum + f.floor, 0);
  let remaining = total - allocated;

  // Largest remainder first; ties broken by input key order (deterministic, not random).
  const byRemainderDesc = [...floors].sort((a, b) => b.remainder - a.remainder);
  const result = new Map(floors.map((f) => [f.key, f.floor]));
  for (let i = 0; i < byRemainderDesc.length && remaining > 0; i++) {
    result.set(byRemainderDesc[i].key, (result.get(byRemainderDesc[i].key) ?? 0) + 1);
    remaining--;
  }

  return Object.fromEntries(result) as Record<K, number>;
}

export interface TargetCell {
  domain: PmpDomain;
  approach: PrimaryApproach;
  difficulty: PmpDifficulty;
  targetCount: number;
}

/** Domain -> Approach -> Difficulty allocation, purely from blueprint weights, with NO inventory knowledge yet. */
export function buildTargetCells(totalQuestions: number, blueprint: ExamBlueprint): TargetCell[] {
  const domainCounts = allocateByWeights(totalQuestions, blueprint.domainWeights);

  const cells: TargetCell[] = [];
  for (const domain of DOMAINS) {
    const domainCount = domainCounts[domain] ?? 0;
    const approachCounts = allocateByWeights(domainCount, blueprint.approachWeights);

    for (const approach of PRIMARY_APPROACHES) {
      const cellCount = approachCounts[approach] ?? 0;
      const difficultyCounts = allocateByWeights(cellCount, blueprint.difficultyWeights);

      for (const difficulty of DIFFICULTIES) {
        cells.push({ domain, approach, difficulty, targetCount: difficultyCounts[difficulty] ?? 0 });
      }
    }
  }
  return cells;
}

export interface ResolvedCell extends TargetCell {
  resolvedCount: number;
}

/** domain|approach|difficulty -> available approved question count. "Mixed" IS a valid approach key here (fallback filler), even though it never appears as a TargetCell.approach. */
export type InventoryCounts = Record<string, number>;

export function cellKey(domain: PmpDomain, approach: string, difficulty: PmpDifficulty): string {
  return `${domain}|${approach}|${difficulty}`;
}

/** One successful draw from a source inventory cell to satisfy (all or part of) a target cell's requested count - a mechanical trace the real selection step (which needs concrete question_ids, not just counts) can follow without re-implementing the fallback traversal order itself. */
export interface CellDraw {
  targetKey: string;
  sourceKey: string;
  count: number;
}

export interface ResolveCellsResult {
  resolvedCells: ResolvedCell[];
  draws: CellDraw[];
  fallbackLog: string[];
  /** True if, even after every fallback, the total resolved count is short of what was requested - the caller must decide whether to fail exam creation. */
  totalShortfall: number;
}

/**
 * Resolves target cells against real inventory, applying the approved
 * fallback hierarchy in order: (1) borrow from the "Mixed" approach bucket
 * within the same domain+difficulty (Mixed has no PMI equivalent, so it's
 * fair game as filler without affecting the Predictive/Agile/Hybrid
 * balance we DO care about); (2) fold the shortfall into an adjacent,
 * easier difficulty tier within the same domain+approach (Expert->Difficult
 * ->Moderate->Easy); (3) last resort, borrow from a different approach
 * within the same domain (sacrifices approach balance to preserve domain
 * balance, which is the higher-priority constraint). Every fallback
 * decision is recorded in fallbackLog - this becomes part of
 * blueprint_snapshot for auditability.
 */
export function resolveCellsAgainstInventory(targetCells: TargetCell[], inventory: InventoryCounts): ResolveCellsResult {
  const fallbackLog: string[] = [];
  const draws: CellDraw[] = [];
  // Mutable "remaining available" pool - every question we resolve as used
  // is subtracted so a later cell can't double-count it.
  const remaining = { ...inventory };
  const take = (targetKey: string, sourceKey: string, want: number): number => {
    const available = remaining[sourceKey] ?? 0;
    const taken = Math.min(want, available);
    remaining[sourceKey] = available - taken;
    if (taken > 0) draws.push({ targetKey, sourceKey, count: taken });
    return taken;
  };

  const resolvedCells: ResolvedCell[] = targetCells.map((cell) => ({ ...cell, resolvedCount: 0 }));

  for (const cell of resolvedCells) {
    let need = cell.targetCount;
    if (need === 0) continue;
    const targetKey = cellKey(cell.domain, cell.approach, cell.difficulty);

    const got = take(targetKey, targetKey, need);
    cell.resolvedCount += got;
    need -= got;
    if (need === 0) continue;

    // Fallback 1: Mixed approach, same domain+difficulty.
    const mixedKey = cellKey(cell.domain, "Mixed", cell.difficulty);
    const gotMixed = take(targetKey, mixedKey, need);
    if (gotMixed > 0) {
      cell.resolvedCount += gotMixed;
      need -= gotMixed;
      fallbackLog.push(`${cell.domain}/${cell.approach}/${cell.difficulty}: borrowed ${gotMixed} from Mixed approach (same domain+difficulty)`);
    }
    if (need === 0) continue;

    // Fallback 2: fold into progressively easier difficulty tiers, same domain+approach.
    let fallbackDifficulty: PmpDifficulty | null = DIFFICULTY_FALLBACK_ORDER[cell.difficulty];
    while (need > 0 && fallbackDifficulty) {
      const key = cellKey(cell.domain, cell.approach, fallbackDifficulty);
      const gotFallback = take(targetKey, key, need);
      if (gotFallback > 0) {
        cell.resolvedCount += gotFallback;
        need -= gotFallback;
        fallbackLog.push(`${cell.domain}/${cell.approach}/${cell.difficulty}: folded ${gotFallback} into ${fallbackDifficulty} difficulty (same domain+approach)`);
      }
      fallbackDifficulty = DIFFICULTY_FALLBACK_ORDER[fallbackDifficulty];
    }
    if (need === 0) continue;

    // Fallback 3: last resort, a different approach within the same domain (any difficulty already tried first via own difficulty, so just try the primary difficulty here).
    for (const otherApproach of PRIMARY_APPROACHES) {
      if (otherApproach === cell.approach || need === 0) continue;
      const key = cellKey(cell.domain, otherApproach, cell.difficulty);
      const gotOther = take(targetKey, key, need);
      if (gotOther > 0) {
        cell.resolvedCount += gotOther;
        need -= gotOther;
        fallbackLog.push(`${cell.domain}/${cell.approach}/${cell.difficulty}: borrowed ${gotOther} from ${otherApproach} approach (same domain, approach balance sacrificed to preserve domain+total)`);
      }
    }
  }

  const totalTarget = targetCells.reduce((sum, c) => sum + c.targetCount, 0);
  const totalResolved = resolvedCells.reduce((sum, c) => sum + c.resolvedCount, 0);

  return { resolvedCells, draws, fallbackLog, totalShortfall: Math.max(0, totalTarget - totalResolved) };
}

/**
 * Exam-wide (not per-cell) interaction-type target counts, capped against
 * real inventory per type - any shortfall is redistributed entirely to
 * "standard", which is both the largest-inventory type and the type every
 * cell already defaults to, so this can never itself cause a shortfall.
 */
export function resolveInteractionTypeCounts(
  totalQuestions: number,
  blueprint: ExamBlueprint,
  availableByType: Record<PmpInteractionType, number>
): { resolved: Record<PmpInteractionType, number>; fallbackLog: string[] } {
  const target = allocateByWeights(totalQuestions, blueprint.interactionTypeWeights);
  const fallbackLog: string[] = [];
  const resolved = { ...target };
  let overflow = 0;

  for (const type of Object.keys(target) as PmpInteractionType[]) {
    if (type === "standard") continue;
    const available = availableByType[type] ?? 0;
    if (target[type] > available) {
      const short = target[type] - available;
      resolved[type] = available;
      overflow += short;
      if (short > 0) {
        fallbackLog.push(`interaction_type ${type}: wanted ${target[type]}, only ${available} available - ${short} redistributed to standard`);
      }
    }
  }
  resolved.standard = (resolved.standard ?? 0) + overflow;

  return { resolved, fallbackLog };
}

/** Same pattern as interaction-type, for answer_type (single vs multiple_response). Shortfall redistributes to "single". */
export function resolveAnswerTypeCounts(
  totalQuestions: number,
  blueprint: ExamBlueprint,
  availableByType: Record<PmpAnswerType, number>
): { resolved: Record<PmpAnswerType, number>; fallbackLog: string[] } {
  const target = allocateByWeights(totalQuestions, blueprint.answerTypeWeights);
  const fallbackLog: string[] = [];
  const resolved = { ...target };

  const available = availableByType.multiple_response ?? 0;
  if (target.multiple_response > available) {
    const short = target.multiple_response - available;
    resolved.multiple_response = available;
    resolved.single = (resolved.single ?? 0) + short;
    fallbackLog.push(`answer_type multiple_response: wanted ${target.multiple_response}, only ${available} available - ${short} redistributed to single`);
  }

  return { resolved, fallbackLog };
}

/** Which section (1-indexed) a given 0-indexed sequence position falls into, per the blueprint's section boundaries. */
export function sectionForSequenceIndex(sequenceIndex: number, blueprint: ExamBlueprint): number {
  let cumulative = 0;
  for (const section of blueprint.sections) {
    cumulative += section.questionCount;
    if (sequenceIndex < cumulative) return section.sectionNumber;
  }
  return blueprint.sections[blueprint.sections.length - 1]?.sectionNumber ?? 1;
}

// ============================================================================
// Concrete question selection - still pure (plain in-memory arrays, no
// Supabase client), so item 17's reuse-avoidance and item 5's interaction-
// type best-effort mix are both unit-testable directly.
// ============================================================================

export interface InventoryQuestionRow {
  questionId: string;
  domain: PmpDomain;
  approach: PmpApproach;
  difficulty: PmpDifficulty;
  interactionType: PmpInteractionType;
  answerType: PmpAnswerType;
}

export function groupQuestionsByCell(rows: InventoryQuestionRow[]): Map<string, InventoryQuestionRow[]> {
  const map = new Map<string, InventoryQuestionRow[]>();
  for (const row of rows) {
    const key = cellKey(row.domain, row.approach, row.difficulty);
    const existing = map.get(key);
    if (existing) existing.push(row);
    else map.set(key, [row]);
  }
  return map;
}

function shuffleArray<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Picks `count` questions from `candidates` for one draw, preferring (in
 * priority order - Sprint 9.1 item 7):
 *   1. never seen by this student before, across ANY past attempt
 *      (including retakes - a retake genuinely re-exposes the student to
 *      those questions).
 *   2. seen before, but NOT part of the student's immediately previous
 *      INDEPENDENTLY-GENERATED attempt, least-seen-first (ties among
 *      equally-seen candidates broken by shuffle).
 *   3. part of the immediately previous independently-generated attempt -
 *      last resort only, since capping this overlap at <=40 across the
 *      whole exam is a product requirement (see examAttemptService.ts,
 *      which computes the actual resulting overlap count for reporting -
 *      this function does not need to know the numeric cap itself, since
 *      naturally exhausting tiers 1-2 first before ever touching tier 3
 *      already minimizes overlap as much as each draw's own candidate pool
 *      allows).
 * Within each tier, questions whose interaction_type still has remaining
 * exam-wide budget are preferred (item 5's "best-effort" interaction-type
 * mix), spent one unit at a time as items are actually selected (never
 * precomputed against a static snapshot - that would let a single draw
 * claim more of a budget-limited type than remains).
 */
export function pickQuestionsForDraw(
  candidates: InventoryQuestionRow[],
  count: number,
  seenCounts: ReadonlyMap<string, number>,
  interactionTypeBudget: Record<PmpInteractionType, number>,
  previousAttemptQuestionIds: ReadonlySet<string>,
  rng: () => number = Math.random
): { picked: InventoryQuestionRow[]; remainingBudget: Record<PmpInteractionType, number> } {
  const budget = { ...interactionTypeBudget };
  const shuffled = shuffleArray(candidates, rng);

  const neverSeen = shuffled.filter((q) => (seenCounts.get(q.questionId) ?? 0) === 0);
  const seenNotPrevious = shuffled
    .filter((q) => (seenCounts.get(q.questionId) ?? 0) > 0 && !previousAttemptQuestionIds.has(q.questionId))
    .sort((a, b) => (seenCounts.get(a.questionId) ?? 0) - (seenCounts.get(b.questionId) ?? 0));
  const seenInPreviousAttempt = shuffled.filter((q) => previousAttemptQuestionIds.has(q.questionId));

  const picked: InventoryQuestionRow[] = [];

  // Three passes, tier priority as documented above. Within each pass:
  // greedily spend interaction-type budget one unit at a time as items are
  // actually selected, then fill remaining slots from standard-type
  // candidates before ever falling back to a type whose budget is already
  // exhausted, so scarce rare-type inventory isn't spent as plain filler
  // when an ordinary question would do just as well.
  function fillFrom(group: InventoryQuestionRow[]): void {
    const exhaustedRareType: InventoryQuestionRow[] = [];
    const standardType: InventoryQuestionRow[] = [];
    for (const q of group) {
      if (picked.length >= count) return;
      if (q.interactionType !== "standard" && (budget[q.interactionType] ?? 0) > 0) {
        budget[q.interactionType] -= 1;
        picked.push(q);
      } else if (q.interactionType === "standard") {
        standardType.push(q);
      } else {
        exhaustedRareType.push(q);
      }
    }
    for (const q of standardType) {
      if (picked.length >= count) return;
      picked.push(q);
    }
    for (const q of exhaustedRareType) {
      if (picked.length >= count) return;
      picked.push(q);
    }
  }

  fillFrom(neverSeen);
  fillFrom(seenNotPrevious);
  fillFrom(seenInPreviousAttempt);

  return { picked, remainingBudget: budget };
}

export interface SelectedExamQuestion {
  questionId: string;
  interactionType: PmpInteractionType;
  answerType: PmpAnswerType;
  /** The question's REAL stored domain/approach/difficulty (from the source cell it was actually drawn from) - not the blueprint's original target, which may differ after a fallback. Results breakdowns must reflect reality, never the intention. */
  domain: PmpDomain;
  approach: PmpApproach;
  difficulty: PmpDifficulty;
}

/**
 * Orchestrates pickQuestionsForDraw across every draw resolveCellsAgainstInventory
 * produced, maintaining one shared "already consumed" set (so the same
 * question can never be drawn twice across different draws) and one shared
 * interaction-type budget (exam-wide, not per-draw).
 */
export function selectQuestionsForDraws(
  rows: InventoryQuestionRow[],
  draws: CellDraw[],
  interactionTypeBudget: Record<PmpInteractionType, number>,
  seenCounts: ReadonlyMap<string, number>,
  previousAttemptQuestionIds: ReadonlySet<string>,
  rng: () => number = Math.random
): SelectedExamQuestion[] {
  const byCell = groupQuestionsByCell(rows);
  const consumed = new Set<string>();
  let budget = { ...interactionTypeBudget };
  const selected: SelectedExamQuestion[] = [];

  for (const draw of draws) {
    const pool = (byCell.get(draw.sourceKey) ?? []).filter((q) => !consumed.has(q.questionId));
    const { picked, remainingBudget } = pickQuestionsForDraw(pool, draw.count, seenCounts, budget, previousAttemptQuestionIds, rng);
    budget = remainingBudget;
    for (const q of picked) {
      consumed.add(q.questionId);
      selected.push({
        questionId: q.questionId,
        interactionType: q.interactionType,
        answerType: q.answerType,
        domain: q.domain,
        approach: q.approach,
        difficulty: q.difficulty,
      });
    }
  }

  return selected;
}
