import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireRole";
import { updateModule, createLesson } from "@/features/courses/services/courseAdminService";

interface Props {
  params: Promise<{ courseId: string; moduleId: string }>;
}

export const metadata: Metadata = { title: "Admin — Edit Module" };
export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

export default async function AdminModuleEditPage({ params }: Props) {
  const { courseId, moduleId } = await params;
  const { supabase } = await requireAdmin({
    loginRedirectTo: `/admin/courses/${courseId}/modules/${moduleId}`,
  });

  const { data: mod } = await supabase.from("modules").select("*").eq("id", moduleId).single();
  if (!mod) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title_en, is_published, order_index")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: true });

  const updateModuleWithId = updateModule.bind(null, courseId, moduleId);
  const createLessonWithId = createLesson.bind(null, courseId, moduleId);

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <Link
          href={`/admin/courses/${courseId}`}
          className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Back to course
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-white">{mod.title_en}</h1>

        <form action={updateModuleWithId} className="card mt-6 space-y-4 p-6">
          <h2 className="text-[15px] font-semibold text-white">Module details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title_en" defaultValue={mod.title_en} required className={inputCls} />
            <input name="title_ar" defaultValue={mod.title_ar ?? ""} className={inputCls} />
            <input name="order_index" type="number" defaultValue={mod.order_index} className={inputCls} />
          </div>
          <textarea
            name="description_en"
            defaultValue={mod.description_en ?? ""}
            rows={2}
            className={inputCls}
          />
          <textarea
            name="description_ar"
            defaultValue={mod.description_ar ?? ""}
            rows={2}
            className={inputCls}
          />
          <label className="flex items-center gap-2 text-[13px] text-slate-400">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={mod.is_published}
              className="accent-indigo-500"
            />
            Published
          </label>
          <button type="submit" className="btn-primary px-5 py-2.5 text-[13px]">
            Save
          </button>
        </form>

        <h2 className="mt-10 text-[15px] font-semibold text-white">Lessons</h2>
        <div className="mt-4 space-y-2">
          {(lessons ?? []).map((lesson) => (
            <Link
              key={lesson.id}
              href={`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
              className="card card-hover flex items-center justify-between px-5 py-4"
            >
              <p className="text-[14px] font-medium text-white">{lesson.title_en}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  lesson.is_published
                    ? "bg-emerald-500/[0.12] text-emerald-400"
                    : "bg-white/[0.07] text-slate-400"
                }`}
              >
                {lesson.is_published ? "Published" : "Draft"}
              </span>
            </Link>
          ))}
        </div>

        <form action={createLessonWithId} className="card mt-4 space-y-4 p-6">
          <h3 className="text-[14px] font-semibold text-white">New lesson</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title_en" placeholder="Title (English)" required className={inputCls} />
            <input name="title_ar" placeholder="Title (Arabic)" className={inputCls} />
            <select name="video_provider" defaultValue="none" className={inputCls}>
              <option value="none">No video</option>
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="bunny">Bunny Stream</option>
            </select>
            <input name="video_url" placeholder="Video embed URL (or Bunny video GUID)" className={inputCls} />
            <input name="duration_minutes" type="number" placeholder="Duration (min)" className={inputCls} />
            <input name="order_index" type="number" defaultValue={0} className={inputCls} />
          </div>
          <p className="text-[11px] text-slate-500">
            Bunny Stream: paste either the full embed URL from Bunny&apos;s dashboard, or just the video GUID
            (requires <code>NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID</code> to be configured).
          </p>
          <textarea name="content_en" placeholder="Content (English, markdown)" rows={3} className={inputCls} />
          <label className="flex items-center gap-2 text-[13px] text-slate-400">
            <input type="checkbox" name="is_published" className="accent-indigo-500" />
            Published
          </label>
          <button type="submit" className="btn-ghost px-5 py-2.5 text-[13px]">
            Add lesson
          </button>
        </form>
      </div>
    </div>
  );
}
