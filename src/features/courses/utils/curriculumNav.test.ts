import { describe, it, expect } from "vitest";
import { curriculumSteps, lessonNeighbours, type NavModule } from "./curriculumNav";

const L = (id: string) => ({ id, titleEn: `Lesson ${id}`, titleAr: null });
const Q = (id: string) => ({ assessmentId: id, titleEn: `Quiz ${id}`, titleAr: null });

// Shaped like the real PMP course: Module 1 has no quiz, later modules do.
const course: NavModule[] = [
  { id: "m1", lessons: [L("1a"), L("1b")], quiz: null },
  { id: "m2", lessons: [L("2a"), L("2b")], quiz: Q("q2") },
  { id: "m3", lessons: [L("3a")], quiz: Q("q3") },
];

describe("curriculumSteps", () => {
  it("lists lessons in order with each ready quiz after its module's lessons", () => {
    expect(curriculumSteps(course).map((s) => `${s.kind}:${s.id}`)).toEqual([
      "lesson:1a", "lesson:1b", "lesson:2a", "lesson:2b", "quiz:q2", "lesson:3a", "quiz:q3",
    ]);
  });
});

describe("lessonNeighbours", () => {
  it("moves within a module as before", () => {
    const n = lessonNeighbours(course, "1a");
    expect(n.previous).toBeNull();
    expect(n.next).toMatchObject({ kind: "lesson", id: "1b" });
    expect(n.isCourseEnd).toBe(false);
  });

  it("crosses into the next module when the module has no quiz", () => {
    expect(lessonNeighbours(course, "1b").next).toMatchObject({ kind: "lesson", id: "2a" });
    expect(lessonNeighbours(course, "2a").previous).toMatchObject({ kind: "lesson", id: "1b" });
  });

  it("sends the last lesson of a module to that module's quiz, not past it", () => {
    expect(lessonNeighbours(course, "2b").next).toMatchObject({ kind: "quiz", id: "q2" });
  });

  it("goes back from a module's first lesson to the previous module's quiz", () => {
    expect(lessonNeighbours(course, "3a").previous).toMatchObject({ kind: "quiz", id: "q2" });
  });

  it("ends the course after the final module's quiz", () => {
    const n = lessonNeighbours(course, "3a");
    expect(n.next).toMatchObject({ kind: "quiz", id: "q3" });
    expect(n.isCourseEnd).toBe(false);
  });

  it("marks the end of the course when the final step is a lesson", () => {
    const noFinalQuiz: NavModule[] = [...course.slice(0, 2), { id: "m3", lessons: [L("3a"), L("3b")], quiz: null }];
    const n = lessonNeighbours(noFinalQuiz, "3b");
    expect(n.next).toBeNull();
    expect(n.isCourseEnd).toBe(true);
    expect(n.previous).toMatchObject({ kind: "lesson", id: "3a" });
  });

  it("skips a module's quiz that is not ready (absent), never a dead end", () => {
    const notReady: NavModule[] = [{ ...course[0] }, { ...course[1], quiz: null }, course[2]];
    expect(lessonNeighbours(notReady, "2b").next).toMatchObject({ kind: "lesson", id: "3a" });
  });

  it("hidden lessons are simply absent: neighbours close the gap", () => {
    // 2b hidden (unpublished): the lesson page only receives published lessons.
    const hidden: NavModule[] = [course[0], { ...course[1], lessons: [L("2a")] }, course[2]];
    expect(lessonNeighbours(hidden, "2a").next).toMatchObject({ kind: "quiz", id: "q2" });
    expect(curriculumSteps(hidden).some((s) => s.id === "2b")).toBe(false);
  });

  it("skips a module whose lessons are all hidden", () => {
    const emptyModule: NavModule[] = [course[0], { id: "m2", lessons: [], quiz: null }, course[2]];
    expect(lessonNeighbours(emptyModule, "1b").next).toMatchObject({ kind: "lesson", id: "3a" });
  });

  it("gives a lesson that is not in the published curriculum no neighbours", () => {
    expect(lessonNeighbours(course, "hidden-lesson")).toEqual({ previous: null, next: null, isCourseEnd: false });
  });

  it("keeps order stable when a hidden lesson is restored", () => {
    const restored: NavModule[] = [course[0], { ...course[1], lessons: [L("2a"), L("2x"), L("2b")] }, course[2]];
    expect(curriculumSteps(restored).map((s) => s.id)).toEqual(["1a", "1b", "2a", "2x", "2b", "q2", "3a", "q3"]);
  });
});
