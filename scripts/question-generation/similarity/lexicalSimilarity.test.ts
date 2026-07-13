import { describe, it, expect } from "vitest";
import { jaccardSimilarity } from "./lexicalSimilarity";

describe("jaccardSimilarity", () => {
  it("returns 1 for identical text", () => {
    const text = "A project manager should always update the risk register first";
    expect(jaccardSimilarity(text, text)).toBe(1);
  });

  it("returns a low score for completely unrelated text", () => {
    const a = "A project manager should always update the risk register first";
    const b = "The chef added salt and pepper to the boiling soup pot";
    expect(jaccardSimilarity(a, b)).toBeLessThan(0.1);
  });

  it("is case-insensitive and punctuation-insensitive", () => {
    const a = "What should the PM do first?";
    const b = "what should the pm do first";
    expect(jaccardSimilarity(a, b)).toBe(1);
  });

  it("catches a near-verbatim copy with a single word changed", () => {
    const a = "The project manager should update the risk register before escalating the issue";
    const b = "The project manager should update the risk register before escalating the concern";
    expect(jaccardSimilarity(a, b)).toBeGreaterThan(0.7);
  });

  it("returns 0 for two empty strings rather than dividing by zero", () => {
    expect(jaccardSimilarity("", "")).toBe(0);
  });

  it("is symmetric", () => {
    const a = "Risk register updates require stakeholder sign-off";
    const b = "Stakeholder sign-off is required for risk register updates";
    expect(jaccardSimilarity(a, b)).toBe(jaccardSimilarity(b, a));
  });
});
