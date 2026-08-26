import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireRole";
import { updateLesson } from "@/features/courses/services/courseAdminService";

interface Props {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}

export const metadata: Metadata = { title: "Admin — Edit Lesson" };
export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

export default async function AdminLessonEditPage({ params }: Props) {
  const { courseId, moduleId, lessonId } = await params;
  const { supabase } = await requireAdmin({
    loginRedirectTo: `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
  });

  const { data: lesson } = await supabase.from("lessons").select("*").eq("id", lessonId).single();
  if (!lesson) notFound();

  const updateLessonWithId = updateLesson.bind(null, courseId, moduleId, lessonId);

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <Link
          href={`/admin/courses/${courseId}/modules/${moduleId}`}
          className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Back to module
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-white">{lesson.title_en}</h1>

        <form action={updateLessonWithId} className="card mt-6 space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title_en" defaultValue={lesson.title_en} required className={inputCls} />
            <input name="title_ar" defaultValue={lesson.title_ar ?? ""} className={inputCls} />
            <select name="video_provider" defaultValue={lesson.video_provider} className={inputCls}>
              <option value="none">No video</option>
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
            </select>
            <input name="video_url" defaultValue={lesson.video_url ?? ""} className={inputCls} />
            <input
              name="duration_minutes"
              type="number"
              defaultValue={lesson.duration_minutes ?? ""}
              className={inputCls}
            />
            <input name="order_index" type="number" defaultValue={lesson.order_index} className={inputCls} />
          </div>
          <textarea
            name="content_en"
            defaultValue={lesson.content_en ?? ""}
            rows={8}
            placeholder="Content (English, markdown)"
            className={inputCls}
          />
          <textarea
            name="content_ar"
            defaultValue={lesson.content_ar ?? ""}
            rows={8}
            placeholder="Content (Arabic, markdown)"
            className={inputCls}
          />
          <label className="flex items-center gap-2 text-[13px] text-slate-400">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={lesson.is_published}
              className="accent-indigo-500"
            />
            Published
          </label>
          <button type="submit" className="btn-primary px-5 py-2.5 text-[13px]">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
