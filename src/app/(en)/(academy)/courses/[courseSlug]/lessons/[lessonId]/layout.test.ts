import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The lesson and quiz access gates (audit F4 / F5 / F12): hidden lessons,
 * lessons of another course and missing items are real 404s; the course slug
 * in the URL must match the item's own course.
 */
class NotFound extends Error {}
vi.mock("next/navigation", () => ({ notFound: () => { throw new NotFound("NEXT_NOT_FOUND"); } }));

let role: string | null = "student";
const login = vi.fn();
vi.mock("@/lib/auth/requireRole", () => ({
  requireProfile: async (o: { loginRedirectTo: string }) => (login(o.loginRedirectTo), { supabase: {}, user: { id: "u1" }, profile: { role } }),
  requireUser: async (o: { loginRedirectTo: string }) => (login(o.loginRedirectTo), { supabase: {}, user: { id: "u1" } }),
}));

const lessons: Record<string, { id: string; module_id: string; is_published: boolean }> = {};
const assessments: Record<string, { id: string; type: string; module_id: string | null; is_published: boolean }> = {};
const courseOfModule: Record<string, string> = { m2: "pmp", mx: "other" };
vi.mock("@/features/courses/services/courseService", () => ({
  getLessonById: async (_s: unknown, id: string) => lessons[id] ?? null,
  getAssessmentById: async (_s: unknown, id: string) => assessments[id] ?? null,
  getCourseSlugForModule: async (_s: unknown, m: string) => courseOfModule[m] ?? null,
}));

const { default: LessonAccessLayout } = await import("./layout");
const { default: AssessmentAccessLayout } = await import("../../assessments/[assessmentId]/layout");

const lessonGate = (courseSlug: string, lessonId: string) =>
  LessonAccessLayout({ children: "LESSON", params: Promise.resolve({ courseSlug, lessonId }) });
const quizGate = (courseSlug: string, assessmentId: string) =>
  AssessmentAccessLayout({ children: "QUIZ", params: Promise.resolve({ courseSlug, assessmentId }) });

beforeEach(() => {
  role = "student";
  login.mockClear();
  Object.assign(lessons, {
    pub: { id: "pub", module_id: "m2", is_published: true },
    hidden: { id: "hidden", module_id: "m2", is_published: false },
    foreign: { id: "foreign", module_id: "mx", is_published: true },
  });
  Object.assign(assessments, {
    q2: { id: "q2", type: "module_assessment", module_id: "m2", is_published: true },
    draft: { id: "draft", type: "module_assessment", module_id: "m2", is_published: false },
    checkpoint: { id: "checkpoint", type: "lesson_checkpoint", module_id: "m2", is_published: true },
  });
});

describe("lesson access gate", () => {
  it("lets a published lesson of the URL's course through", async () => {
    expect(await lessonGate("pmp", "pub")).toBe("LESSON");
  });

  it("asks requireProfile to send signed-out visitors back to this lesson after login", async () => {
    await lessonGate("pmp", "pub");
    expect(login).toHaveBeenCalledWith("/courses/pmp/lessons/pub");
  });

  it("404s a hidden lesson for a student, even by direct URL", async () => {
    await expect(lessonGate("pmp", "hidden")).rejects.toBeInstanceOf(NotFound);
  });

  it("still lets an admin or instructor preview a hidden lesson", async () => {
    role = "admin";
    expect(await lessonGate("pmp", "hidden")).toBe("LESSON");
    role = "instructor";
    expect(await lessonGate("pmp", "hidden")).toBe("LESSON");
  });

  it("404s a lesson that does not exist", async () => {
    await expect(lessonGate("pmp", "nope")).rejects.toBeInstanceOf(NotFound);
  });

  it("404s a lesson of another course placed under this course's URL", async () => {
    await expect(lessonGate("pmp", "foreign")).rejects.toBeInstanceOf(NotFound);
  });
});

describe("module quiz access gate", () => {
  it("lets a published module quiz of the URL's course through", async () => {
    expect(await quizGate("pmp", "q2")).toBe("QUIZ");
    expect(login).toHaveBeenCalledWith("/courses/pmp/assessments/q2");
  });

  it("404s missing, unpublished, non-module, and other-course quizzes", async () => {
    await expect(quizGate("pmp", "nope")).rejects.toBeInstanceOf(NotFound);
    await expect(quizGate("pmp", "draft")).rejects.toBeInstanceOf(NotFound);
    await expect(quizGate("pmp", "checkpoint")).rejects.toBeInstanceOf(NotFound);
    await expect(quizGate("other", "q2")).rejects.toBeInstanceOf(NotFound);
  });
});
