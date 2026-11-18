/**
 * Previous / Next for the lesson page, across the WHOLE published curriculum
 * (audit F1, 2026-11-18). It used to stop at each module's first and last
 * lesson.
 *
 * The learning path is the published curriculum in order, with each module's
 * quiz placed after that module's last lesson, exactly where the course page
 * and the sidebar show it:
 *
 *   M1 lessons ... | M2 lessons ... [M2 quiz] | M3 lessons ... [M3 quiz] | ...
 *
 * - Only what the caller passes in exists here: the lesson page passes the
 *   published modules and lessons it already loaded (unpublished / hidden
 *   lessons are never in that list, so they can never be a destination or a
 *   dead end), and a module's quiz only when it is ready (published, with
 *   questions - courseService.getReadyAssessmentIds).
 * - A quiz is a step in the path even while it is still locked; its own page
 *   shows the locked state, so the learner is never routed around it.
 * - The last step of the course has no Next; the caller shows "end of
 *   course" there.
 *
 * Pure: no database or framework access, so every case is unit-tested.
 */

export interface NavModule {
  id: string;
  lessons: { id: string; titleEn: string; titleAr: string | null }[];
  /** The module's quiz, only when it is ready to take. */
  quiz: { assessmentId: string; titleEn: string; titleAr: string | null } | null;
}

export type NavStep =
  | { kind: "lesson"; id: string; titleEn: string; titleAr: string | null }
  | { kind: "quiz"; id: string; titleEn: string; titleAr: string | null };

export interface LessonNeighbours {
  previous: NavStep | null;
  next: NavStep | null;
  /** True when this lesson is the last step of the whole course. */
  isCourseEnd: boolean;
}

/** The full ordered learning path: every lesson, each module's ready quiz after its lessons. */
export function curriculumSteps(modules: NavModule[]): NavStep[] {
  const steps: NavStep[] = [];
  for (const m of modules) {
    for (const l of m.lessons) steps.push({ kind: "lesson", id: l.id, titleEn: l.titleEn, titleAr: l.titleAr });
    if (m.quiz) steps.push({ kind: "quiz", id: m.quiz.assessmentId, titleEn: m.quiz.titleEn, titleAr: m.quiz.titleAr });
  }
  return steps;
}

/**
 * The steps before and after `lessonId`. A lesson that is not in the
 * published curriculum (hidden, removed) gets no neighbours rather than a
 * guess.
 */
export function lessonNeighbours(modules: NavModule[], lessonId: string): LessonNeighbours {
  const steps = curriculumSteps(modules);
  const i = steps.findIndex((s) => s.kind === "lesson" && s.id === lessonId);
  if (i === -1) return { previous: null, next: null, isCourseEnd: false };
  return {
    previous: i > 0 ? steps[i - 1] : null,
    next: i < steps.length - 1 ? steps[i + 1] : null,
    isCourseEnd: i === steps.length - 1,
  };
}
