import { describe, it, expect } from "vitest";
import { computeRemainingSeconds, isSessionExpired, resolveDurationSeconds } from "./practiceTimerUtils";

describe("computeRemainingSeconds", () => {
  it("returns the full duration right at session start", () => {
    const now = new Date("2026-07-27T12:00:00.000Z");
    expect(computeRemainingSeconds(now.toISOString(), 600, now)).toBe(600);
  });

  it("counts down as time elapses", () => {
    const startedAt = new Date("2026-07-27T12:00:00.000Z");
    const now = new Date("2026-07-27T12:05:00.000Z"); // 300s later
    expect(computeRemainingSeconds(startedAt.toISOString(), 600, now)).toBe(300);
  });

  it("never goes negative once time has fully elapsed", () => {
    const startedAt = new Date("2026-07-27T12:00:00.000Z");
    const now = new Date("2026-07-27T13:00:00.000Z"); // way past the 600s duration
    expect(computeRemainingSeconds(startedAt.toISOString(), 600, now)).toBe(0);
  });
});

describe("isSessionExpired", () => {
  it("is false while time remains", () => {
    const startedAt = new Date("2026-07-27T12:00:00.000Z");
    const now = new Date("2026-07-27T12:05:00.000Z");
    expect(isSessionExpired(startedAt.toISOString(), 600, now)).toBe(false);
  });

  it("is true exactly at the deadline", () => {
    const startedAt = new Date("2026-07-27T12:00:00.000Z");
    const now = new Date("2026-07-27T12:10:00.000Z");
    expect(isSessionExpired(startedAt.toISOString(), 600, now)).toBe(true);
  });

  it("is true well past the deadline", () => {
    const startedAt = new Date("2026-07-27T12:00:00.000Z");
    const now = new Date("2026-07-27T14:00:00.000Z");
    expect(isSessionExpired(startedAt.toISOString(), 600, now)).toBe(true);
  });
});

describe("resolveDurationSeconds", () => {
  it("is null for an untimed session regardless of other fields", () => {
    expect(resolveDurationSeconds({ isTimed: false, questionCount: 20, secondsPerQuestion: 60 })).toBeNull();
  });

  it("uses 60s/question by default when timed", () => {
    expect(resolveDurationSeconds({ isTimed: true, questionCount: 10, secondsPerQuestion: 60 })).toBe(600);
  });

  it("uses 1.3 minutes/question (78s) when selected", () => {
    expect(resolveDurationSeconds({ isTimed: true, questionCount: 10, secondsPerQuestion: 78 })).toBe(780);
  });

  it("prefers a custom total duration over the per-question rate when both are present", () => {
    expect(resolveDurationSeconds({ isTimed: true, questionCount: 10, secondsPerQuestion: 60, customDurationMinutes: 25 })).toBe(1500);
  });

  it("falls back to the default per-question rate when secondsPerQuestion is omitted", () => {
    expect(resolveDurationSeconds({ isTimed: true, questionCount: 5 })).toBe(300);
  });
});
