/**
 * Coverage Intelligence (Sprint 8, Phase 10).
 *
 * Analyzes the APPROVED question bank's real distribution across domain,
 * approach, difficulty, and interaction type, and compares it against target
 * distributions to surface gaps as human-readable recommendations. This
 * module never generates or queues generation of any question - it only
 * reports. A human decides what, if anything, to do about a gap.
 *
 * Target sourcing, documented so it can be audited/tuned (same transparency
 * precedent as qualityGate.ts's WEIGHTS and similarity/index.ts's
 * SIMILARITY_THRESHOLDS):
 *   - DOMAIN_TARGETS come from PMI's published PMP Exam Content Outline
 *     (People 42% / Process 50% / Business Environment 8%) - this is the one
 *     dimension with an official, numeric PMI target.
 *   - APPROACH_TARGETS reflect PMI's commonly-stated guidance that roughly
 *     half the exam represents predictive approaches and half represents
 *     agile/hybrid approaches - PMI does not publish an exact per-approach
 *     percentage, so this is an approximation, not an official figure.
 *   - DIFFICULTY_TARGETS and interaction-type minimums are platform-defined
 *     authoring guidelines (skew toward moderate/difficult, ensure every
 *     interaction type has real coverage) - PMI publishes no target here at
 *     all.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface DimensionBreakdown {
  value: string;
  count: number;
  actualPct: number;
  targetPct: number | null;
  gap: "under" | "over" | "ok";
}

export interface CoverageReport {
  certificationCode: string;
  totalApproved: number;
  domain: DimensionBreakdown[];
  approach: DimensionBreakdown[];
  difficulty: DimensionBreakdown[];
  interactionType: DimensionBreakdown[];
  recommendations: string[];
}

const TOLERANCE_PCT = 5;
export const INTERACTION_TYPE_MIN_SHARE_PCT = 5;

/** Official PMI ECO domain weighting. */
const DOMAIN_TARGETS: Record<string, number> = {
  People: 42,
  Process: 50,
  "Business Environment": 8,
};

/** Approximate - see header comment. */
const APPROACH_TARGETS: Record<string, number> = {
  Predictive: 50,
  Agile: 25,
  Hybrid: 25,
};

/** Platform-defined authoring guideline - not PMI-official. */
const DIFFICULTY_TARGETS: Record<string, number> = {
  Easy: 10,
  Moderate: 40,
  Difficult: 35,
  Expert: 15,
};

const ALL_INTERACTION_TYPES = ["standard", "graphic_based", "drag_and_drop", "hotspot", "matching"];

interface ApprovedRow {
  domain: string | null;
  approach: string | null;
  difficulty: string | null;
  interaction_type: string;
}

export function classifyGap(actualPct: number, targetPct: number | null): "under" | "over" | "ok" {
  if (targetPct === null) return "ok";
  if (actualPct < targetPct - TOLERANCE_PCT) return "under";
  if (actualPct > targetPct + TOLERANCE_PCT) return "over";
  return "ok";
}

export function buildBreakdown(
  rows: ApprovedRow[],
  field: keyof ApprovedRow,
  targets: Record<string, number>,
  total: number,
  includeAllKnownValues: string[] = []
): DimensionBreakdown[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = (row[field] as string | null) ?? "Unspecified";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  for (const known of includeAllKnownValues) {
    if (!counts.has(known)) counts.set(known, 0);
  }

  return [...counts.entries()]
    .map(([value, count]) => {
      const actualPct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
      const targetPct = targets[value] ?? null;
      return { value, count, actualPct, targetPct, gap: classifyGap(actualPct, targetPct) };
    })
    .sort((a, b) => b.count - a.count);
}

export function domainRecommendations(breakdown: DimensionBreakdown[]): string[] {
  return breakdown
    .filter((b) => b.gap !== "ok")
    .map((b) =>
      b.gap === "under"
        ? `${b.value} domain is under-represented: ${b.actualPct}% of approved questions vs a ${b.targetPct}% PMI ECO target. Consider prioritizing pattern extraction and generation for this domain.`
        : `${b.value} domain is over-represented: ${b.actualPct}% of approved questions vs a ${b.targetPct}% PMI ECO target. Consider deprioritizing further generation here until other domains catch up.`
    );
}

function approachRecommendations(breakdown: DimensionBreakdown[]): string[] {
  return breakdown
    .filter((b) => b.gap !== "ok")
    .map((b) =>
      b.gap === "under"
        ? `${b.value} approach is under-represented: ${b.actualPct}% of approved questions vs an approximate ${b.targetPct}% target. Consider more ${b.value.toLowerCase()} scenarios.`
        : `${b.value} approach is over-represented: ${b.actualPct}% of approved questions vs an approximate ${b.targetPct}% target.`
    );
}

function difficultyRecommendations(breakdown: DimensionBreakdown[]): string[] {
  return breakdown
    .filter((b) => b.gap !== "ok")
    .map((b) =>
      b.gap === "under"
        ? `${b.value} difficulty is under-represented: ${b.actualPct}% of approved questions vs an internal target of ${b.targetPct}%. Consider requesting repairs/regenerations that push toward this difficulty.`
        : `${b.value} difficulty is over-represented: ${b.actualPct}% of approved questions vs an internal target of ${b.targetPct}%.`
    );
}

export function interactionTypeRecommendations(breakdown: DimensionBreakdown[]): string[] {
  return breakdown
    .filter((b) => b.actualPct < INTERACTION_TYPE_MIN_SHARE_PCT)
    .map((b) =>
      b.count === 0
        ? `${b.value} interaction type has ZERO approved questions. There is no exam-realistic coverage for this format at all.`
        : `${b.value} interaction type is thin: only ${b.count} approved question(s), ${b.actualPct}% of the bank. Consider building patterns and generating more of this format.`
    );
}

export async function getCoverageReport(certificationCode: string): Promise<CoverageReport> {
  const { data: cert } = await supabaseAdmin.from("certifications").select("id").eq("code", certificationCode.toUpperCase()).single();
  const certificationId = (cert as { id: string } | null)?.id;

  const { data } = certificationId
    ? await supabaseAdmin
        .from("questions")
        .select("domain, approach, difficulty, interaction_type")
        .eq("certification_id", certificationId)
        .eq("status", "approved")
    : { data: [] };

  const rows = (data ?? []) as ApprovedRow[];
  const total = rows.length;

  const domain = buildBreakdown(rows, "domain", DOMAIN_TARGETS, total, Object.keys(DOMAIN_TARGETS));
  const approach = buildBreakdown(rows, "approach", APPROACH_TARGETS, total, Object.keys(APPROACH_TARGETS));
  const difficulty = buildBreakdown(rows, "difficulty", DIFFICULTY_TARGETS, total, Object.keys(DIFFICULTY_TARGETS));
  const interactionType = buildBreakdown(rows, "interaction_type", {}, total, ALL_INTERACTION_TYPES);

  const recommendations = [
    ...domainRecommendations(domain),
    ...approachRecommendations(approach),
    ...difficultyRecommendations(difficulty),
    ...interactionTypeRecommendations(interactionType),
  ];

  return {
    certificationCode: certificationCode.toUpperCase(),
    totalApproved: total,
    domain,
    approach,
    difficulty,
    interactionType,
    recommendations,
  };
}
