import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireRole";
import { createCourse } from "@/features/courses/services/courseAdminService";

export const metadata: Metadata = { title: "Admin — Courses" };
export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin({ loginRedirectTo: "/admin/courses" });

  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title_en, is_published, order_index")
    .order("order_index", { ascending: true });

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <span className="label">Admin</span>
        <h1 className="mt-3 text-2xl font-bold text-white">Courses</h1>

        <div className="mt-8 space-y-2">
          {(courses ?? []).map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="card card-hover flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="text-[14px] font-medium text-white">{course.title_en}</p>
                <p className="text-[12px] text-slate-500">/{course.slug}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  course.is_published
                    ? "bg-emerald-500/[0.12] text-emerald-400"
                    : "bg-white/[0.07] text-slate-400"
                }`}
              >
                {course.is_published ? "Published" : "Draft"}
              </span>
            </Link>
          ))}
        </div>

        <form action={createCourse} className="card mt-8 space-y-4 p-6">
          <h2 className="text-[15px] font-semibold text-white">New course</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="slug" placeholder="slug (e.g. pmp)" required className={inputCls} />
            <input name="title_en" placeholder="Title (English)" required className={inputCls} />
            <input name="title_ar" placeholder="Title (Arabic)" className={inputCls} />
            <input name="order_index" type="number" defaultValue={0} className={inputCls} />
          </div>
          <textarea
            name="description_en"
            placeholder="Description (English)"
            rows={2}
            className={inputCls}
          />
          <textarea
            name="description_ar"
            placeholder="Description (Arabic)"
            rows={2}
            className={inputCls}
          />
          <label className="flex items-center gap-2 text-[13px] text-slate-400">
            <input type="checkbox" name="is_published" className="accent-indigo-500" />
            Published
          </label>
          <button type="submit" className="btn-primary px-5 py-2.5 text-[13px]">
            Create course
          </button>
        </form>
      </div>
    </div>
  );
}
