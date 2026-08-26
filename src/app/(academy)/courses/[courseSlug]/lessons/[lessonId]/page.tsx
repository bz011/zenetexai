import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import {
  getLessonById,
  getLessonCheckpoint,
  getPreviousNextLesson,
  getLessonResources,
  isLessonCompleted,
} from "@/features/courses/services/courseService";
import { getQuizQuestions } from "@/features/courses/services/quizService";
import { getLessonNote } from "@/features/courses/services/noteService";
import { recordLessonView } from "@/features/courses/services/progressService";
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

  const [checkpoint, completed, navLessons, resources, note] = await Promise.all([
    getLessonCheckpoint(supabase, lessonId),
    isLessonCompleted(supabase, user.id, lessonId),
    getPreviousNextLesson(supabase, lesson.module_id, lesson.order_index),
    getLessonResources(supabase, lessonId),
    getLessonNote(lessonId),
    recordLessonView(lessonId),
  ]);

  const checkpointQuestions = checkpoint ? await getQuizQuestions(supabase, checkpoint.id) : [];

  return (
    <LessonDetailContent
      courseSlug={courseSlug}
      lesson={lesson}
      completed={completed}
      checkpoint={checkpoint}
      checkpointQuestions={checkpointQuestions}
      previousLesson={navLessons.previous}
      nextLesson={navLessons.next}
      resources={resources}
      initialNoteText={note?.noteText ?? ""}
    />
  );
}
