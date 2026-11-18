import { describe, it, expect } from "vitest";
import { formatExamBreaks, formatExamDuration } from "./formatDuration";

describe("formatExamDuration", () => {
  it("keeps the English compact form", () => {
    expect(formatExamDuration(240, "en")).toBe("4h");
    expect(formatExamDuration(230, "en")).toBe("3h 50m");
    expect(formatExamDuration(45, "en")).toBe("45m");
  });

  it("writes Arabic units with correct number agreement", () => {
    expect(formatExamDuration(240, "ar")).toBe("4 ساعات");
    expect(formatExamDuration(230, "ar")).toBe("3 ساعات و50 دقيقة");
    expect(formatExamDuration(60, "ar")).toBe("ساعة واحدة");
    expect(formatExamDuration(120, "ar")).toBe("ساعتان");
    expect(formatExamDuration(130, "ar")).toBe("ساعتان و10 دقائق");
    expect(formatExamDuration(45, "ar")).toBe("45 دقيقة");
  });

  it("never emits Latin unit letters in Arabic", () => {
    for (const m of [10, 60, 230, 240, 245]) expect(formatExamDuration(m, "ar")).not.toMatch(/[a-z]/i);
  });
});

describe("formatExamBreaks", () => {
  it("keeps the English compact form", () => {
    expect(formatExamBreaks(2, 10, "en")).toBe("2 × 10m");
  });

  it("writes Arabic without the × sign, so it cannot reorder in right-to-left text", () => {
    expect(formatExamBreaks(2, 10, "ar")).toBe("استراحتان (10 دقائق لكل استراحة)");
    expect(formatExamBreaks(1, 10, "ar")).toBe("استراحة واحدة (10 دقائق)");
    expect(formatExamBreaks(3, 5, "ar")).toBe("3 استراحات (5 دقائق لكل استراحة)");
    expect(formatExamBreaks(2, 10, "ar")).not.toMatch(/[a-z×]/i);
  });
});
