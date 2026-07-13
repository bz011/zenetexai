/**
 * Course/module/lesson read queries.
 *
 * All functions take a Supabase client as a parameter rather than creating
 * their own — callers pass the RLS-respecting server client
 * (createSupabaseServer()), so a student only ever sees published content
 * and admins/instructors see everything, exactly per the RLS policies in
 * migration 006. Nothing here needs the service-role client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Course,
  CourseModule,
  Lesson,
  LearningAssessment,
  CourseWithProgress,
} from "@/features/courses/types/course";

export async function getPublishedCourses(supabase: SupabaseClient): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title_en, title_ar, description_en, description_ar, cover_image_url, order_index, is_published")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[courseService] getPublishedCourses error:", error.message);
    return [];
  }
  return data as Course[];
}

export async function getCourseBySlug(supabase: SupabaseClient, slug: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title_en, title_ar, description_en, description_ar, cover_image_url, order_index, is_published")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as Course;
}

/**
 * Full course tree (published modules -> published lessons) plus the
 * current user's lesson_progress, annotated per lesson, with totals
 * computed on read rather than stored.
 */
export async function getCourseWithProgress(
  supabase: SupabaseClient,
  course: Course,
  userId: string
): Promise<CourseWithProgress> {
  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id, title_en, title_ar, description_en, description_ar, order_index, is_published")
    .eq("course_id", course.id)
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const moduleList = (modules ?? []) as CourseModule[];
  const moduleIds = moduleList.map((m) => m.id);

  const { data: lessons } = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id, module_id, title_en, title_ar, content_en, content_ar, video_provider, video_url, duration_minutes, order_index, is_published")
        .in("module_id", moduleIds)
        .eq("is_published", true)
        .order("order_index", { ascending: true })
    : { data: [] as Lesson[] };

  const lessonList = (lessons ?? []) as Lesson[];
  const lessonIds = lessonList.map((l) => l.id);

  const { data: progressRows } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds)
    : { data: [] as { lesson_id: string }[] };

  const completedLessonIds = new Set((progressRows ?? []).map((r) => r.lesson_id));

  const { data: moduleAssessments } = moduleIds.length
    ? await supabase
        .from("learning_assessments")
        .select("id, type, lesson_id, module_id, title_en, title_ar, passing_score, order_index, is_published")
        .in("module_id", moduleIds)
        .eq("type", "module_assessment")
        .eq("is_published", true)
    : { data: [] as LearningAssessment[] };

  const assessmentByModule = new Map<string, LearningAssessment>();
  for (const a of (moduleAssessments ?? []) as LearningAssessment[]) {
    if (a.module_id) assessmentByModule.set(a.module_id, a);
  }

  const modulesWithLessons = moduleList.map((m) => ({
    ...m,
    lessons: lessonList
      .filter((l) => l.module_id === m.id)
      .map((l) => ({ ...l, completed: completedLessonIds.has(l.id) })),
    moduleAssessment: assessmentByModule.get(m.id) ?? null,
  }));

  return {
    ...course,
    modules: modulesWithLessons,
    totalLessons: lessonList.length,
    completedLessons: completedLessonIds.size,
  };
}

export async function isLessonCompleted(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("lesson_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  return !!data;
}

/**
 * Previous/next lesson within the SAME module, by order_index — Sprint 6
 * lesson navigation deliberately doesn't cross module boundaries, since
 * "next" after a module's last lesson is naturally its module assessment
 * (already linked from the course page), not an arbitrary next module.
 */
export async function getPreviousNextLesson(
  supabase: SupabaseClient,
  moduleId: string,
  currentOrderIndex: number
): Promise<{ previous: Pick<Lesson, "id" | "title_en" | "title_ar"> | null; next: Pick<Lesson, "id" | "title_en" | "title_ar"> | null }> {
  const [{ data: previous }, { data: next }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title_en, title_ar")
      .eq("module_id", moduleId)
      .eq("is_published", true)
      .lt("order_index", currentOrderIndex)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("lessons")
      .select("id, title_en, title_ar")
      .eq("module_id", moduleId)
      .eq("is_published", true)
      .gt("order_index", currentOrderIndex)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return { previous: previous ?? null, next: next ?? null };
}

export async function getLessonResources(
  supabase: SupabaseClient,
  lessonId: string
): Promise<{ id: string; fileName: string; fileUrl: string }[]> {
  const { data } = await supabase
    .from("lesson_resources")
    .select("id, file_name, file_url")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  return ((data ?? []) as { id: string; file_name: string; file_url: string }[]).map((r) => ({
    id: r.id,
    fileName: r.file_name,
    fileUrl: r.file_url,
  }));
}

export async function getLessonById(supabase: SupabaseClient, lessonId: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, module_id, title_en, title_ar, content_en, content_ar, video_provider, video_url, duration_minutes, order_index, is_published")
    .eq("id", lessonId)
    .single();

  if (error) return null;
  return data as Lesson;
}

export async function getLessonCheckpoint(
  supabase: SupabaseClient,
  lessonId: string
): Promise<LearningAssessment | null> {
  const { data, error } = await supabase
    .from("learning_assessments")
    .select("id, type, lesson_id, module_id, title_en, title_ar, passing_score, order_index, is_published")
    .eq("lesson_id", lessonId)
    .eq("type", "checkpoint")
    .eq("is_published", true)
    .maybeSingle();

  if (error) return null;
  return data as LearningAssessment | null;
}

export async function getAssessmentById(
  supabase: SupabaseClient,
  assessmentId: string
): Promise<LearningAssessment | null> {
  const { data, error } = await supabase
    .from("learning_assessments")
    .select("id, type, lesson_id, module_id, title_en, title_ar, passing_score, order_index, is_published")
    .eq("id", assessmentId)
    .single();

  if (error) return null;
  return data as LearningAssessment;
}

// getAssessmentQuestionsForStudent was removed in Sprint 6 — superseded by
// quizService.getQuizQuestions(), which reads BOTH legacy
// learning_assessment_questions and bank-linked questions (migration 007)
// through one unified shape. See quizService.ts.
