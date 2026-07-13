import { describe, it, expect, vi } from "vitest";

vi.mock("../question-bank/supabaseAdminClient", () => ({ supabaseAdmin: {} }));
vi.mock("./llm", () => ({ getLLMProvider: vi.fn() }));
vi.mock("./generatePipeline", () => ({ generateOneQuestion: vi.fn() }));
vi.mock("./costEstimator", () => ({ estimateCostUsd: vi.fn(() => 0) }));

const { computeFinalBatchStatus } = await import("./generateBatch");

describe("computeFinalBatchStatus", () => {
  it("is completed when every question passed with no failures", () => {
    expect(computeFinalBatchStatus({ isDryRun: false, isCancelled: false, hadFailure: false, passedCount: 10 })).toBe("completed");
  });

  it("is partially_completed when some questions failed but at least one passed", () => {
    expect(computeFinalBatchStatus({ isDryRun: false, isCancelled: false, hadFailure: true, passedCount: 3 })).toBe("partially_completed");
  });

  it("is failed when every question failed and none passed", () => {
    expect(computeFinalBatchStatus({ isDryRun: false, isCancelled: false, hadFailure: true, passedCount: 0 })).toBe("failed");
  });

  it("is cancelled when the operator cancelled mid-run, even if some questions already passed", () => {
    expect(computeFinalBatchStatus({ isDryRun: false, isCancelled: true, hadFailure: false, passedCount: 5 })).toBe("cancelled");
  });

  it("cancellation takes priority over a prior failure", () => {
    expect(computeFinalBatchStatus({ isDryRun: false, isCancelled: true, hadFailure: true, passedCount: 0 })).toBe("cancelled");
  });

  it("is always completed for a dry run regardless of hadFailure/passedCount", () => {
    expect(computeFinalBatchStatus({ isDryRun: true, isCancelled: false, hadFailure: true, passedCount: 0 })).toBe("completed");
  });
});
