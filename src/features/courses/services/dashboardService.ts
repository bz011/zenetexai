/**
 * Dashboard read aggregates: Resume Learning pointer + overall student stats.
 * Plain read functions (not Server Actions) taking an RLS-respecting
 * supabase client, called from the dashboard Server Component — same
 * pattern as courseService.ts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStudyStreak, isModuleComplete } from "@/features/courses/services/progressUtils";
import type { ContinueLearningInfo, DashboardStats } from "@/features/courses/types/course";

export async function getResumePointer(supabase: SupabaseClient, userId: string): Promise<ContinueLearningInfo | null> {
  const { data } = await supabase
    .from("learning_progress_pointer")
    .select("last_lesson_id, last_visited_at, courses(slug, title_en, title_ar), lessons(title_en, title_ar)")
    .eq("user_id", userId)
    .not("last_lesson_id", "is", null)
    .order("last_visited_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as unknown as {
    last_lesson_id: string;
    last_visited_at: string;
    courses: { slug: string; title_en: string; title_ar: string | null } | null;
    lessons: { title_en: string; title_ar: string | null } | null;
  };

  if (!row.courses || !row.lessons) return null;

  return {
    courseSlug: row.courses.slug,
    courseTitleEn: row.courses.title_en,
    courseTitleAr: row.courses.title_ar,
    lessonId: row.last_lesson_id,
    lessonTitleEn: row.lessons.title_en,
    lessonTitleAr: row.lessons.title_ar,
    lastVisitedAt: row.last_visited_at,
  };
}

export async function getDashboardStats(supabase: SupabaseClient, userId: string): Promise<DashboardStats> {
  const { data: courses } = await supabase.from("courses").select("id").eq("is_published", true);
  const courseIds = ((courses ?? []) as { id: string }[]).map((c) => c.id);

  const { data: modules } = courseIds.length
    ? await supabase.from("modules").select("id, course_id").in("course_id", courseIds).eq("is_published", true)
    : { data: [] as { id: string; course_id: string }[] };
  const moduleList = (modules ?? []) as { id: string; course_id: string }[];
  const moduleIds = moduleList.map((m) => m.id);

  const [{ data: lessons }, { data: moduleAssessments }, { data: attempts }, { data: studyTimeRows }] = await Promise.all([
    moduleIds.length
      ? supabase.from("lessons").select("id, module_id").in("module_id", moduleIds).eq("is_published", true)
      : Promise.resolve({ data: [] as { id: string; module_id: string }[] }),
    moduleIds.length
      ? supabase.from("learning_assessments").select("id, module_id").in("module_id", moduleIds).eq("type", "module_assessment").eq("is_published", true)
      : Promise.resolve({ data: [] as { id: string; module_id: string }[] }),
    supabase.from("learning_assessment_attempts").select("assessment_id, passed, completed_at").eq("user_id", userId),
    // Real measured active time (see migration 010 / useActiveStudyTracker.ts) - NOT a sum of lessons' nominal duration_minutes.
    supabase.from("student_study_time").select("study_date, active_seconds").eq("user_id", userId),
  ]);

  const lessonList = (lessons ?? []) as { id: string; module_id: string }[];
  const lessonIds = lessonList.map((l) => l.id);
  const assessmentByModule = new Map(((moduleAssessments ?? []) as { id: string; module_id: string }[]).map((a) => [a.module_id, a.id]));
  const attemptList = (attempts ?? []) as { assessment_id: string; passed: boolean; completed_at: string }[];
  const passedAssessmentIds = new Set(attemptList.filter((a) => a.passed).map((a) => a.assessment_id));

  const { data: progressRows } = lessonIds.length
    ? await supabase.from("lesson_progress").select("lesson_id, completed_at").eq("user_id", userId).in("lesson_id", lessonIds)
    : { data: [] as { lesson_id: string; completed_at: string }[] };
  const progressList = (progressRows ?? []) as { lesson_id: string; completed_at: string }[];
  const completedLessonIds = new Set(progressList.map((p) => p.lesson_id));

  function moduleComplete(moduleId: string): boolean {
    return isModuleComplete({
      lessonIds: lessonList.filter((l) => l.module_id === moduleId).map((l) => l.id),
      completedLessonIds,
      assessmentId: assessmentByModule.get(moduleId) ?? null,
      passedAssessmentIds,
    });
  }

  const completedModules = moduleList.filter((m) => moduleComplete(m.id)).length;

  const completedCourses = courseIds.filter((courseId) => {
    const courseModules = moduleList.filter((m) => m.course_id === courseId);
    return courseModules.length > 0 && courseModules.every((m) => moduleComplete(m.id));
  }).length;

  const studyTimeList = (studyTimeRows ?? []) as { study_date: string; active_seconds: number }[];
  const totalStudyMinutes = Math.round(studyTimeList.reduce((sum, r) => sum + r.active_seconds, 0) / 60);

  const studyStreakDays = computeStudyStreak([
    ...progressList.map((p) => p.completed_at),
    ...attemptList.map((a) => a.completed_at),
    ...studyTimeList.map((r) => r.study_date),
  ]);

  const totalLessons = lessonList.length;
  const completedLessons = completedLessonIds.size;

  return {
    totalLessons,
    completedLessons,
    totalModules: moduleList.length,
    completedModules,
    totalCourses: courseIds.length,
    completedCourses,
    overallProgressPct: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    quizzesAttempted: attemptList.length,
    quizzesPassed: attemptList.filter((a) => a.passed).length,
    studyStreakDays,
    totalStudyMinutes,
  };
}
