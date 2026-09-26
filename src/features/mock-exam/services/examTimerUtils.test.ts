import { describe, it, expect } from "vitest";
import { computeExamRemainingSeconds, isExamExpired, computeBreakRemainingSeconds, getEligibleBreak, sectionJustCompleted } from "./examTimerUtils";
import { PMP_EXAM_BLUEPRINT_2026 } from "../config/examBlueprint";

const START = new Date("2026-07-27T09:00:00.000Z");

describe("computeExamRemainingSeconds", () => {
  it("returns the full duration right at start with no breaks taken", () => {
    expect(computeExamRemainingSeconds(START.toISOString(), 14400, [], false, null, PMP_EXAM_BLUEPRINT_2026, START)).toBe(14400);
  });

  it("counts down as wall-clock time elapses while not on break", () => {
    const now = new Date(START.getTime() + 300 * 1000);
    expect(computeExamRemainingSeconds(START.toISOString(), 14400, [], false, null, PMP_EXAM_BLUEPRINT_2026, now)).toBe(14400 - 300);
  });

  it("excludes a fully-completed break's duration from elapsed time (break 1 is 600s)", () => {
    // 1000s of real wall-clock time passed, but 600s of that was break 1 -
    // only 400s should count against the exam clock.
    const now = new Date(START.getTime() + 1000 * 1000);
    const remaining = computeExamRemainingSeconds(START.toISOString(), 14400, [1], false, null, PMP_EXAM_BLUEPRINT_2026, now);
    expect(remaining).toBe(14400 - 400);
  });

  it("excludes only the elapsed portion of a currently-active break, not the full allotment", () => {
    // Break 1 started 100s ago and is still active - only those 100s should
    // be excluded, not the full 600s.
    const breakStartedAt = new Date(START.getTime() + 5000 * 1000);
    const now = new Date(breakStartedAt.getTime() + 100 * 1000);
    const remaining = computeExamRemainingSeconds(START.toISOString(), 14400, [1], true, breakStartedAt.toISOString(), PMP_EXAM_BLUEPRINT_2026, now);
    const totalElapsedWallClock = (now.getTime() - START.getTime()) / 1000;
    expect(remaining).toBe(14400 - (totalElapsedWallClock - 100));
  });

  it("caps an overstayed active break's exclusion at the break's fixed duration - lingering does not extend the exam clock", () => {
    const breakStartedAt = new Date(START.getTime() + 1000 * 1000);
    const now = new Date(breakStartedAt.getTime() + 5000 * 1000); // stayed on break far longer than the 600s allotted
    const remaining = computeExamRemainingSeconds(START.toISOString(), 14400, [1], true, breakStartedAt.toISOString(), PMP_EXAM_BLUEPRINT_2026, now);
    const totalElapsedWallClock = (now.getTime() - START.getTime()) / 1000;
    // Only 600s (the break's cap) is excluded, not the full 5000s spent on break.
    expect(remaining).toBe(14400 - (totalElapsedWallClock - 600));
  });

  it("returns the unused portion of a break to the exam clock when it ends early", () => {
    // Break 1 (600s allotted) ends after only 200s - completedBreaksSeconds
    // still counts it as a full 600s consumed once it's no longer active,
    // per the documented "full-fixed-duration-per-completed-break"
    // accounting policy (no break_ended_at column exists).
    const now = new Date(START.getTime() + 10000 * 1000);
    const remaining = computeExamRemainingSeconds(START.toISOString(), 14400, [1], false, null, PMP_EXAM_BLUEPRINT_2026, now);
    const totalElapsedWallClock = (now.getTime() - START.getTime()) / 1000;
    expect(remaining).toBe(14400 - (totalElapsedWallClock - 600));
  });

  it("never goes negative once time has fully elapsed", () => {
    const now = new Date(START.getTime() + 100000 * 1000);
    expect(computeExamRemainingSeconds(START.toISOString(), 14400, [], false, null, PMP_EXAM_BLUEPRINT_2026, now)).toBe(0);
  });
});

describe("isExamExpired", () => {
  it("is false while time remains", () => {
    const now = new Date(START.getTime() + 100 * 1000);
    expect(isExamExpired(START.toISOString(), 14400, [], false, null, PMP_EXAM_BLUEPRINT_2026, now)).toBe(false);
  });

  it("is true once the full duration has elapsed", () => {
    const now = new Date(START.getTime() + 14400 * 1000);
    expect(isExamExpired(START.toISOString(), 14400, [], false, null, PMP_EXAM_BLUEPRINT_2026, now)).toBe(true);
  });
});

describe("computeBreakRemainingSeconds", () => {
  it("returns the full break duration right when a break starts", () => {
    expect(computeBreakRemainingSeconds(START.toISOString(), 1, PMP_EXAM_BLUEPRINT_2026, START)).toBe(600);
  });

  it("counts down as break time elapses", () => {
    const now = new Date(START.getTime() + 100 * 1000);
    expect(computeBreakRemainingSeconds(START.toISOString(), 1, PMP_EXAM_BLUEPRINT_2026, now)).toBe(500);
  });

  it("never goes negative once the break's allotted duration has passed", () => {
    const now = new Date(START.getTime() + 10000 * 1000);
    expect(computeBreakRemainingSeconds(START.toISOString(), 1, PMP_EXAM_BLUEPRINT_2026, now)).toBe(0);
  });
});

describe("getEligibleBreak", () => {
  it("is not eligible before reaching the first break's question boundary", () => {
    const result = getEligibleBreak(59, [], PMP_EXAM_BLUEPRINT_2026);
    expect(result.eligible).toBe(false);
  });

  it("becomes eligible for break 1 exactly at question 60 completed", () => {
    const result = getEligibleBreak(60, [], PMP_EXAM_BLUEPRINT_2026);
    expect(result.eligible).toBe(true);
    expect(result.breakNumber).toBe(1);
  });

  it("skips break 1 once already taken and offers break 2 at its boundary", () => {
    const result = getEligibleBreak(120, [1], PMP_EXAM_BLUEPRINT_2026);
    expect(result.eligible).toBe(true);
    expect(result.breakNumber).toBe(2);
  });

  it("is not eligible for break 2 before its boundary even if break 1 was already taken", () => {
    const result = getEligibleBreak(90, [1], PMP_EXAM_BLUEPRINT_2026);
    expect(result.eligible).toBe(false);
  });

  it("reports no eligible break once every break has been taken", () => {
    const result = getEligibleBreak(150, [1, 2], PMP_EXAM_BLUEPRINT_2026);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("already taken");
  });
});

describe("sectionJustCompleted", () => {
  it("identifies section 1 as just completed exactly at question 60", () => {
    expect(sectionJustCompleted(60, PMP_EXAM_BLUEPRINT_2026)).toBe(1);
  });

  it("identifies section 2 as just completed exactly at question 120", () => {
    expect(sectionJustCompleted(120, PMP_EXAM_BLUEPRINT_2026)).toBe(2);
  });

  it("returns null mid-section", () => {
    expect(sectionJustCompleted(45, PMP_EXAM_BLUEPRINT_2026)).toBeNull();
  });
});
