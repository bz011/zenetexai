import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import {
  getLessonById,
  getLessonCheckpoint,
  getPreviousNextLesson,
  getLessonResources,
  isLessonCompleted,
  getCourseBySlug,
  getCourseWithProgress,
  getReadyAssessmentIds,
  getAssessmentAttemptStatus,
} from "@/features/courses/services/courseService";
import { getQuizQuestions } from "@/features/courses/services/quizService";
import { getLessonNote } from "@/features/courses/services/noteService";
import { recordLessonView } from "@/features/courses/services/progressService";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import LessonDetailContent from "./LessonDetailContent";

interface Props {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}

export const metadata: Metadata = { title: "Lesson — ZENTEXAI Academy" };
export const dynamic = "force-dynamic";

export default async function LessonDetailPage({ params }: Props) {
  const { courseSlug, lessonId } = await params;
  const { supabase, user } = await requireUser({
    loginRedirectTo: `/courses/${courseSlug}/lessons/${lessonId}`,
  });

  const lesson = await getLessonById(supabase, lessonId);
  if (!lesson) notFound();

  // Entitlement gate: the caller is authenticated, but that alone no longer
  // implies course access (Sprint 10) - a valid, unexpired "course:<slug>"
  // entitlement is required. Only the lesson's title reaches the locked
  // branch below; content_en/content_ar/video/checkpoint are never fetched
  // further and never reach the client.
  const entitled = await hasCapability(supabase, user.id, `course:${courseSlug}`);
  if (!entitled) {
    return <LockedAccess variant="course" ctaHref="/courses/pmp-mastery-program" />;
  }

  const course = await getCourseBySlug(supabase, courseSlug);

  const [checkpoint, completed, navLessons, resources, note, , courseWithProgress] = await Promise.all([
    getLessonCheckpoint(supabase, lessonId),
    isLessonCompleted(supabase, user.id, lessonId),
    getPreviousNextLesson(supabase, lesson.module_id, lesson.order_index),
    getLessonResources(supabase, lessonId),
    getLessonNote(lessonId),
    recordLessonView(lessonId),
    course ? getCourseWithProgress(supabase, course, user.id) : Promise.resolve(null),
  ]);

  const checkpointQuestions = checkpoint ? await getQuizQuestions(supabase, checkpoint.id) : [];

  // Module quizzes: courseService already attaches each module's
  // module_assessment row (moduleAssessment), but a row existing and being
  // published is not enough on its own for a quiz to be shown as usable -
  // getReadyAssessmentIds additionally requires at least one real question,
  // so a quiz entry point never appears for content that hasn't been
  // authored/imported yet (Module 1 also naturally has none: no row at all).
  const moduleAssessmentIds = (courseWithProgress?.modules ?? [])
    .map((m) => m.moduleAssessment?.id)
    .filter((id): id is string => !!id);
  const [readyAssessmentIds, attemptStatus] = await Promise.all([
    getReadyAssessmentIds(supabase, moduleAssessmentIds),
    getAssessmentAttemptStatus(supabase, user.id, moduleAssessmentIds),
  ]);

  // Sidebar only ever needs id/title/duration/completed - never a lesson's
  // video_url or content_en/ar, so those are stripped here rather than
  // shipping every other lesson's video reference into this page's payload.
  const curriculum = (courseWithProgress?.modules ?? []).map((m) => {
    const assessment = m.moduleAssessment;
    // Locked until every published lesson in THIS module is completed
    // (Sprint 11) - computed from the same per-lesson `completed` flags
    // already fetched above, so no extra query is needed here. A passed
    // quiz can never be locked again by this check (retaking an already-
    // passed quiz remains available even if, hypothetically, a lesson were
    // later unpublished - m.lessons only ever lists currently-published
    // lessons, so this only reflects the current requirement).
    const locked = m.lessons.length > 0 && m.lessons.some((l) => !l.completed);
    const quiz =
      assessment && readyAssessmentIds.has(assessment.id)
        ? {
            assessmentId: assessment.id,
            titleEn: assessment.title_en,
            titleAr: assessment.title_ar,
            passed: attemptStatus.passed.has(assessment.id),
            attempted: attemptStatus.attempted.has(assessment.id),
            locked: locked && !attemptStatus.passed.has(assessment.id),
          }
        : null;

    return {
      id: m.id,
      titleEn: m.title_en,
      titleAr: m.title_ar,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        titleEn: l.title_en,
        titleAr: l.title_ar,
        durationMinutes: l.duration_minutes,
        completed: l.completed,
      })),
      quiz,
    };
  });

  return (
    <LessonDetailContent
      courseSlug={courseSlug}
      courseTitleEn={course?.title_en ?? courseSlug}
      courseTitleAr={course?.title_ar ?? null}
      lesson={lesson}
      completed={completed}
      checkpoint={checkpoint}
      checkpointQuestions={checkpointQuestions}
      previousLesson={navLessons.previous}
      nextLesson={navLessons.next}
      resources={resources}
      initialNoteText={note?.noteText ?? ""}
      curriculum={curriculum}
      totalLessons={courseWithProgress?.totalLessons ?? 0}
      completedLessons={courseWithProgress?.completedLessons ?? 0}
    />
  );
}
