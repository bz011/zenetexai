import { describe, it, expect } from "vitest";
import { computeStudyStreak, isModuleComplete } from "./progressUtils";

function daysAgo(n: number, from: Date = new Date("2026-07-08T12:00:00.000Z")): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

const now = new Date("2026-07-08T12:00:00.000Z");

describe("computeStudyStreak", () => {
  it("is 0 with no activity at all", () => {
    expect(computeStudyStreak([], now)).toBe(0);
  });

  it("is 1 when the student studied only today", () => {
    expect(computeStudyStreak([daysAgo(0, now)], now)).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    expect(computeStudyStreak([daysAgo(0, now), daysAgo(1, now), daysAgo(2, now)], now)).toBe(3);
  });

  it("stays alive if yesterday was studied but today has no activity yet", () => {
    expect(computeStudyStreak([daysAgo(1, now), daysAgo(2, now)], now)).toBe(2);
  });

  it("breaks the streak when a full day was missed", () => {
    // studied 2 and 3 days ago, but not yesterday or today - streak is broken
    expect(computeStudyStreak([daysAgo(2, now), daysAgo(3, now)], now)).toBe(0);
  });

  it("dedupes multiple activity timestamps on the same calendar day", () => {
    const today = daysAgo(0, now);
    expect(computeStudyStreak([today, today, today], now)).toBe(1);
  });
});

describe("isModuleComplete", () => {
  it("is false when the module has no lessons at all", () => {
    expect(
      isModuleComplete({ lessonIds: [], completedLessonIds: new Set(), assessmentId: null, passedAssessmentIds: new Set() })
    ).toBe(false);
  });

  it("is true when all lessons are done and there is no module assessment", () => {
    expect(
      isModuleComplete({
        lessonIds: ["L1", "L2"],
        completedLessonIds: new Set(["L1", "L2"]),
        assessmentId: null,
        passedAssessmentIds: new Set(),
      })
    ).toBe(true);
  });

  it("is false when a lesson is still incomplete", () => {
    expect(
      isModuleComplete({
        lessonIds: ["L1", "L2"],
        completedLessonIds: new Set(["L1"]),
        assessmentId: null,
        passedAssessmentIds: new Set(),
      })
    ).toBe(false);
  });

  it("is false when all lessons are done but the module assessment hasn't been passed", () => {
    expect(
      isModuleComplete({
        lessonIds: ["L1"],
        completedLessonIds: new Set(["L1"]),
        assessmentId: "A1",
        passedAssessmentIds: new Set(),
      })
    ).toBe(false);
  });

  it("is true when all lessons are done and the module assessment was passed", () => {
    expect(
      isModuleComplete({
        lessonIds: ["L1"],
        completedLessonIds: new Set(["L1"]),
        assessmentId: "A1",
        passedAssessmentIds: new Set(["A1"]),
      })
    ).toBe(true);
  });
});
