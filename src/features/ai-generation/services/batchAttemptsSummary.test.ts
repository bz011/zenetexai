import { describe, it, expect } from "vitest";
import { summarizeAttempts, type BatchQuestionAttempt } from "./batchAttemptsSummary";

function attempt(overrides: Partial<BatchQuestionAttempt>): BatchQuestionAttempt {
  return { accepted: false, failure_stage: null, prompt_tokens: 0, completion_tokens: 0, ...overrides };
}

describe("summarizeAttempts", () => {
  it("reproduces the reported incident: 5 attempts that all fail at pattern_extraction before any LLM call", () => {
    const rows = Array.from({ length: 5 }, () => attempt({ failure_stage: "pattern_extraction", prompt_tokens: 0, completion_tokens: 0 }));
    const summary = summarizeAttempts(rows);
    expect(summary).toEqual({
      attempts: 5,
      llmResponses: 0,
      validDrafts: 0,
      qualityRejected: 0,
      pipelineErrors: 5,
      savedToReviewQueue: 0,
    });
  });

  it("counts a quality_gate rejection as a valid draft but not a pipeline error", () => {
    const rows = [attempt({ failure_stage: "quality_gate", prompt_tokens: 500, completion_tokens: 200 })];
    const summary = summarizeAttempts(rows);
    expect(summary.validDrafts).toBe(1);
    expect(summary.qualityRejected).toBe(1);
    expect(summary.pipelineErrors).toBe(0);
    expect(summary.llmResponses).toBe(1);
  });

  it("counts a database_insertion failure as both a valid draft and a pipeline error", () => {
    const rows = [attempt({ failure_stage: "database_insertion", prompt_tokens: 500, completion_tokens: 200 })];
    const summary = summarizeAttempts(rows);
    expect(summary.validDrafts).toBe(1);
    expect(summary.pipelineErrors).toBe(1);
    expect(summary.qualityRejected).toBe(0);
  });

  it("counts an accepted attempt as a valid draft and saved to review queue", () => {
    const rows = [attempt({ accepted: true, failure_stage: null, prompt_tokens: 500, completion_tokens: 200 })];
    const summary = summarizeAttempts(rows);
    expect(summary.validDrafts).toBe(1);
    expect(summary.savedToReviewQueue).toBe(1);
    expect(summary.pipelineErrors).toBe(0);
  });

  it("treats question_generation/critique_review/similarity_check/unexpected_error as pipeline errors, not valid drafts", () => {
    const stages: BatchQuestionAttempt["failure_stage"][] = ["question_generation", "critique_review", "similarity_check", "unexpected_error"];
    const rows = stages.map((failure_stage) => attempt({ failure_stage }));
    const summary = summarizeAttempts(rows);
    expect(summary.pipelineErrors).toBe(4);
    expect(summary.validDrafts).toBe(0);
  });

  it("counts llmResponses only for attempts with nonzero prompt or completion tokens", () => {
    const rows = [
      attempt({ failure_stage: "pattern_extraction", prompt_tokens: 0, completion_tokens: 0 }),
      attempt({ failure_stage: "question_generation", prompt_tokens: 120, completion_tokens: 0 }),
      attempt({ failure_stage: "critique_review", prompt_tokens: 300, completion_tokens: 80 }),
    ];
    expect(summarizeAttempts(rows).llmResponses).toBe(2);
  });

  it("returns all zeros for an empty batch", () => {
    expect(summarizeAttempts([])).toEqual({
      attempts: 0,
      llmResponses: 0,
      validDrafts: 0,
      qualityRejected: 0,
      pipelineErrors: 0,
      savedToReviewQueue: 0,
    });
  });

  it("treats null prompt_tokens/completion_tokens as zero rather than throwing", () => {
    const rows = [attempt({ prompt_tokens: null, completion_tokens: null })];
    expect(() => summarizeAttempts(rows)).not.toThrow();
    expect(summarizeAttempts(rows).llmResponses).toBe(0);
  });
});
