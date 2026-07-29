import { describe, it, expect } from "vitest";
import { jaccardSimilarity, optionSetSimilarity, tagSetSimilarity, lengthSimilarity } from "./lexicalSimilarity";

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

describe("optionSetSimilarity", () => {
  it("returns 1 when both questions have the exact same option set, regardless of order", () => {
    const a = ["Escalate immediately", "Update the risk register", "Ignore it", "Consult the sponsor"];
    const b = ["Update the risk register", "Consult the sponsor", "Ignore it", "Escalate immediately"];
    expect(optionSetSimilarity(a, b)).toBe(1);
  });

  it("returns 0 when option sets share nothing in common", () => {
    const a = ["Escalate immediately", "Update the risk register"];
    const b = ["Add more salt", "Turn off the oven"];
    expect(optionSetSimilarity(a, b)).toBe(0);
  });

  it("is case/punctuation-insensitive per option, same as jaccardSimilarity's normalization", () => {
    const a = ["Update the Risk Register!"];
    const b = ["update the risk register"];
    expect(optionSetSimilarity(a, b)).toBe(1);
  });

  it("returns a partial score when only some options overlap", () => {
    const a = ["Escalate immediately", "Update the risk register", "Ignore it", "Consult the sponsor"];
    const b = ["Escalate immediately", "Update the risk register", "Do nothing", "Ask the team"];
    const score = optionSetSimilarity(a, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});

describe("tagSetSimilarity", () => {
  it("returns 1 for identical tag sets regardless of order or case", () => {
    expect(tagSetSimilarity(["Risk", "process"], ["Process", "risk"])).toBe(1);
  });

  it("returns 0 for disjoint tag sets", () => {
    expect(tagSetSimilarity(["risk", "process"], ["agile", "leadership"])).toBe(0);
  });

  it("returns 0 when either tag list is empty", () => {
    expect(tagSetSimilarity([], ["risk"])).toBe(0);
    expect(tagSetSimilarity(["risk"], [])).toBe(0);
  });
});

describe("lengthSimilarity", () => {
  it("returns 1 for identical-length text", () => {
    expect(lengthSimilarity("abc def", "xyz uvw")).toBe(1);
  });

  it("decreases as the length gap grows", () => {
    const short = "A short question.";
    const long = "A short question that has been padded out with quite a lot of additional words to make it much longer.";
    expect(lengthSimilarity(short, long)).toBeLessThan(1);
    expect(lengthSimilarity(short, long)).toBeGreaterThanOrEqual(0);
  });

  it("returns 1 for two empty strings rather than dividing by zero", () => {
    expect(lengthSimilarity("", "")).toBe(1);
  });
});
