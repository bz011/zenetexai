import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireRole";
import { updateCourse, createModule } from "@/features/courses/services/courseAdminService";

interface Props {
  params: Promise<{ courseId: string }>;
}

export const metadata: Metadata = { title: "Admin — Edit Course" };
export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

export default async function AdminCourseEditPage({ params }: Props) {
  const { courseId } = await params;
  const { supabase } = await requireAdmin({ loginRedirectTo: `/admin/courses/${courseId}` });

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title_en, is_published, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const updateCourseWithId = updateCourse.bind(null, courseId);
  const createModuleWithId = createModule.bind(null, courseId);

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <Link href="/admin/courses" className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
          ← All courses
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-white">{course.title_en}</h1>

        <form action={updateCourseWithId} className="card mt-6 space-y-4 p-6">
          <h2 className="text-[15px] font-semibold text-white">Course details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="slug" defaultValue={course.slug} required className={inputCls} />
            <input name="title_en" defaultValue={course.title_en} required className={inputCls} />
            <input name="title_ar" defaultValue={course.title_ar ?? ""} className={inputCls} />
            <input
              name="order_index"
              type="number"
              defaultValue={course.order_index}
              className={inputCls}
            />
          </div>
          <textarea
            name="description_en"
            defaultValue={course.description_en ?? ""}
            rows={2}
            className={inputCls}
          />
          <textarea
            name="description_ar"
            defaultValue={course.description_ar ?? ""}
            rows={2}
            className={inputCls}
          />
          <label className="flex items-center gap-2 text-[13px] text-slate-400">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={course.is_published}
              className="accent-indigo-500"
            />
            Published
          </label>
          <button type="submit" className="btn-primary px-5 py-2.5 text-[13px]">
            Save
          </button>
        </form>

        <h2 className="mt-10 text-[15px] font-semibold text-white">Modules</h2>
        <div className="mt-4 space-y-2">
          {(modules ?? []).map((mod) => (
            <Link
              key={mod.id}
              href={`/admin/courses/${courseId}/modules/${mod.id}`}
              className="card card-hover flex items-center justify-between px-5 py-4"
            >
              <p className="text-[14px] font-medium text-white">{mod.title_en}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  mod.is_published
                    ? "bg-emerald-500/[0.12] text-emerald-400"
                    : "bg-white/[0.07] text-slate-400"
                }`}
              >
                {mod.is_published ? "Published" : "Draft"}
              </span>
            </Link>
          ))}
        </div>

        <form action={createModuleWithId} className="card mt-4 space-y-4 p-6">
          <h3 className="text-[14px] font-semibold text-white">New module</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title_en" placeholder="Title (English)" required className={inputCls} />
            <input name="title_ar" placeholder="Title (Arabic)" className={inputCls} />
            <input name="order_index" type="number" defaultValue={0} className={inputCls} />
          </div>
          <textarea name="description_en" placeholder="Description (English)" rows={2} className={inputCls} />
          <label className="flex items-center gap-2 text-[13px] text-slate-400">
            <input type="checkbox" name="is_published" className="accent-indigo-500" />
            Published
          </label>
          <button type="submit" className="btn-ghost px-5 py-2.5 text-[13px]">
            Add module
          </button>
        </form>
      </div>
    </div>
  );
}
