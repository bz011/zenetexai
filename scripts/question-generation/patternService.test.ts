import { describe, it, expect } from "vitest";
import { pickLeastUsedUnusedPattern, pickDiverseSourceQuestions, type SourceQuestionCandidate } from "./patternService";

describe("pickLeastUsedUnusedPattern", () => {
  it("reproduces the pilot incident directly: with only ONE pattern available, it is returned once, then excluded", () => {
    const candidates = [{ id: "pattern-1", times_used: 12 }];
    const used = new Set<string>();

    const first = pickLeastUsedUnusedPattern(candidates, used);
    expect(first?.id).toBe("pattern-1");

    used.add("pattern-1");
    const second = pickLeastUsedUnusedPattern(candidates, used);
    expect(second).toBeNull(); // caller must now try extracting a new pattern, not silently reuse this one
  });

  it("does not repeatedly select the same pattern when multiple eligible patterns exist (5-question batch simulation)", () => {
    const candidates = [
      { id: "pattern-a", times_used: 0 },
      { id: "pattern-b", times_used: 0 },
      { id: "pattern-c", times_used: 0 },
    ];
    const used = new Set<string>();
    const selections: string[] = [];

    for (let i = 0; i < 3; i++) {
      const pick = pickLeastUsedUnusedPattern(candidates, used);
      expect(pick).not.toBeNull();
      selections.push(pick!.id);
      used.add(pick!.id);
    }

    expect(new Set(selections).size).toBe(3); // all three distinct, never repeated
  });

  it("prefers the least-used-overall pattern among those not yet used this batch (coverage-aware)", () => {
    const candidates = [
      { id: "heavily-used", times_used: 50 },
      { id: "lightly-used", times_used: 2 },
    ];
    const pick = pickLeastUsedUnusedPattern(candidates, new Set());
    expect(pick?.id).toBe("lightly-used");
  });

  it("returns null when every candidate has already been used this batch, rather than silently picking one", () => {
    const candidates = [
      { id: "a", times_used: 0 },
      { id: "b", times_used: 0 },
    ];
    const used = new Set(["a", "b"]);
    expect(pickLeastUsedUnusedPattern(candidates, used)).toBeNull();
  });

  it("returns null for an empty candidate list", () => {
    expect(pickLeastUsedUnusedPattern([], new Set())).toBeNull();
  });
});

describe("pickDiverseSourceQuestions", () => {
  function candidate(id: string, topic: string | null = null): SourceQuestionCandidate {
    return { question_id: id, question_text_en: `Text for ${id}`, eco_version: "Jul-26", topic };
  }

  // A fixed rng (not Math.random) so every test run shuffles identically -
  // still a real permutation, just a reproducible one, so assertions never flake.
  const fixedRng = () => 0;

  it("excludes source questions already used elsewhere in this batch", () => {
    const candidates = [candidate("Q1"), candidate("Q2"), candidate("Q3")];
    const excluded = new Set(["Q1", "Q2"]);
    const picked = pickDiverseSourceQuestions(candidates, excluded, 3, fixedRng);
    expect(picked.map((p) => p.question_id)).toEqual(["Q3"]);
  });

  it("never repeats the deterministic first-N-in-DB-order selection the pilot incident traced back to - varies with a different rng seed", () => {
    const candidates = Array.from({ length: 10 }, (_, i) => candidate(`Q${i}`));
    const firstPick = pickDiverseSourceQuestions(candidates, new Set(), 3, () => 0.1);
    const secondPick = pickDiverseSourceQuestions(candidates, new Set(), 3, () => 0.9);
    expect(firstPick.map((p) => p.question_id)).not.toEqual(secondPick.map((p) => p.question_id));
  });

  it("prefers topic diversity among the picks when enough distinct topics are available", () => {
    const candidates = [
      candidate("Q1", "Risk Management"),
      candidate("Q2", "Risk Management"),
      candidate("Q3", "Procurement"),
      candidate("Q4", "Stakeholder Engagement"),
    ];
    const picked = pickDiverseSourceQuestions(candidates, new Set(), 3, fixedRng);
    const topics = new Set(picked.map((p) => p.topic));
    expect(topics.size).toBe(3); // all 3 picks have distinct topics, not 2x Risk Management + 1
  });

  it("falls back to filling remaining slots even if it means repeating a topic, when distinct topics run out", () => {
    const candidates = [candidate("Q1", "Risk Management"), candidate("Q2", "Risk Management")];
    const picked = pickDiverseSourceQuestions(candidates, new Set(), 3, fixedRng);
    expect(picked).toHaveLength(2); // only 2 candidates exist, can't reach 3
  });

  it("returns an empty array when every candidate is excluded", () => {
    const candidates = [candidate("Q1"), candidate("Q2")];
    const excluded = new Set(["Q1", "Q2"]);
    expect(pickDiverseSourceQuestions(candidates, excluded, 3, fixedRng)).toEqual([]);
  });
});
