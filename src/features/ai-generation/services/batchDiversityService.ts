/**
 * Batch Diversity Report (Sprint 8.3 - pilot pattern-collapse incident).
 *
 * The pilot's 5-question batch reused the exact same source pattern
 * (extracted from the exact same 3 source questions, Q000011/Q000013/
 * Q000022) for every single question, with domain/approach/difficulty/
 * interaction_type identical across the board. Nothing in the system
 * would have surfaced that at a glance - an admin had to open each
 * question individually and notice the resemblance by reading. This
 * report makes that visible for every batch going forward, computed from
 * generation_batch_questions/question_patterns rather than re-deriving
 * anything the pipeline already knows.
 *
 * Pure computation (computeBatchDiversityReport) is kept separate from the
 * Supabase fetch (getBatchDiversityReport) so it's unit-testable without
 * mocking the database - same precedent as every other pure-logic module
 * in this pipeline (computeFinalBatchStatus, discoverCombos, classifyGap,
 * pickLeastUsedUnusedPattern).
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { SIMILARITY_THRESHOLDS } from "@scripts/question-generation/similarity";

export interface BatchDiversityQuestionRow {
  patternId: string;
  /** null only if the pattern row itself is somehow missing - defensive, should not happen in practice. */
  sourceQuestionIds: string[] | null;
  testedDecision: string | null;
  /** Used as a coarse proxy for "scenario archetype" - see scenarioArchetypeDistribution's own comment for why this is a documented simplification, not true NLP clustering. */
  scenarioStructure: string | null;
  domain: string | null;
  approach: string | null;
  difficulty: string | null;
}

export interface BatchDiversityReport {
  totalAttempts: number;
  uniqueSourcePatterns: number;
  /** 0 = every attempt used a different pattern (perfectly diverse); approaches 1 as more attempts converge on the same pattern. */
  patternReuseRate: number;
  uniqueSourceClusters: number;
  domainDistribution: Record<string, number>;
  approachDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  testedDecisionDistribution: Record<string, number>;
  scenarioArchetypeDistribution: Record<string, number>;
  maxIntraBatchSemanticSimilarity: number | null;
  avgIntraBatchSemanticSimilarity: number | null;
  patternCollapseDetected: boolean;
  patternCollapseReasons: string[];
}

function tally(values: (string | null)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = value ?? "Unspecified";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/** Two patterns count as the same "source cluster" iff they were extracted from the exact same set of source questions - order-independent. */
function clusterKey(sourceQuestionIds: string[] | null): string {
  if (!sourceQuestionIds || sourceQuestionIds.length === 0) return "unknown";
  return [...sourceQuestionIds].sort().join("|");
}

export function computeBatchDiversityReport(rows: BatchDiversityQuestionRow[], intraBatchSemanticScores: number[]): BatchDiversityReport {
  const totalAttempts = rows.length;
  const uniquePatternIds = new Set(rows.map((r) => r.patternId));
  const uniqueSourcePatterns = uniquePatternIds.size;
  const patternReuseRate = totalAttempts > 0 ? Math.round((1 - uniqueSourcePatterns / totalAttempts) * 100) / 100 : 0;

  const uniqueClusters = new Set(rows.map((r) => clusterKey(r.sourceQuestionIds)));

  const maxIntraBatchSemanticSimilarity = intraBatchSemanticScores.length > 0 ? Math.max(...intraBatchSemanticScores) : null;
  const avgIntraBatchSemanticSimilarity =
    intraBatchSemanticScores.length > 0
      ? Math.round((intraBatchSemanticScores.reduce((sum, s) => sum + s, 0) / intraBatchSemanticScores.length) * 1000) / 1000
      : null;

  const patternCollapseReasons: string[] = [];
  if (totalAttempts >= 2 && uniqueSourcePatterns === 1) {
    patternCollapseReasons.push(`All ${totalAttempts} attempts used the exact same source pattern - no diversity at all.`);
  } else if (totalAttempts >= 3 && patternReuseRate >= 0.6) {
    patternCollapseReasons.push(`Pattern reuse rate is ${Math.round(patternReuseRate * 100)}% - most attempts converged on a small number of patterns.`);
  }
  if (maxIntraBatchSemanticSimilarity !== null && maxIntraBatchSemanticSimilarity >= SIMILARITY_THRESHOLDS.semanticElevated) {
    patternCollapseReasons.push(
      `Max intra-batch semantic similarity is ${(maxIntraBatchSemanticSimilarity * 100).toFixed(1)}% - at or above the elevated-similarity bar (${Math.round(
        SIMILARITY_THRESHOLDS.semanticElevated * 100
      )}%).`
    );
  }

  return {
    totalAttempts,
    uniqueSourcePatterns,
    patternReuseRate,
    uniqueSourceClusters: uniqueClusters.size,
    domainDistribution: tally(rows.map((r) => r.domain)),
    approachDistribution: tally(rows.map((r) => r.approach)),
    difficultyDistribution: tally(rows.map((r) => r.difficulty)),
    testedDecisionDistribution: tally(rows.map((r) => r.testedDecision)),
    scenarioArchetypeDistribution: tally(rows.map((r) => r.scenarioStructure)),
    maxIntraBatchSemanticSimilarity,
    avgIntraBatchSemanticSimilarity,
    patternCollapseDetected: patternCollapseReasons.length > 0,
    patternCollapseReasons,
  };
}

interface PatternLookupRow {
  id: string;
  source_question_ids: string[] | null;
  tested_decision: string | null;
  scenario_structure: string | null;
  domain: string | null;
  approach: string | null;
  difficulty: string | null;
}

export async function getBatchDiversityReport(batchId: string): Promise<BatchDiversityReport> {
  const { data: bqData } = await supabaseAdmin
    .from("generation_batch_questions")
    .select("id, question_id, pattern_id")
    .eq("batch_id", batchId)
    .not("pattern_id", "is", null);

  const bqRows = (bqData ?? []) as { id: string; question_id: string | null; pattern_id: string }[];
  const patternIds = [...new Set(bqRows.map((r) => r.pattern_id))];

  const { data: patternData } = patternIds.length
    ? await supabaseAdmin
        .from("question_patterns")
        .select("id, source_question_ids, tested_decision, scenario_structure, domain, approach, difficulty")
        .in("id", patternIds)
    : { data: [] };
  const patternById = new Map(((patternData ?? []) as PatternLookupRow[]).map((p) => [p.id, p]));

  const diversityRows: BatchDiversityQuestionRow[] = bqRows.map((r) => {
    const pattern = patternById.get(r.pattern_id);
    return {
      patternId: r.pattern_id,
      sourceQuestionIds: pattern?.source_question_ids ?? null,
      testedDecision: pattern?.tested_decision ?? null,
      scenarioStructure: pattern?.scenario_structure ?? null,
      domain: pattern?.domain ?? null,
      approach: pattern?.approach ?? null,
      difficulty: pattern?.difficulty ?? null,
    };
  });

  const acceptedQuestionIds = new Set(bqRows.map((r) => r.question_id).filter((id): id is string => id !== null));
  const batchQuestionIds = bqRows.map((r) => r.id);

  const { data: simData } = batchQuestionIds.length
    ? await supabaseAdmin
        .from("generation_similarity_results")
        .select("matched_question_id, similarity_score")
        .eq("comparison_type", "semantic")
        .in("batch_question_id", batchQuestionIds)
    : { data: [] };

  const intraBatchScores = ((simData ?? []) as { matched_question_id: string | null; similarity_score: number }[])
    .filter((s) => s.matched_question_id !== null && acceptedQuestionIds.has(s.matched_question_id))
    .map((s) => s.similarity_score);

  return computeBatchDiversityReport(diversityRows, intraBatchScores);
}
