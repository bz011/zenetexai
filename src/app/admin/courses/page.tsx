import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireRole";
import CreateCourseForm from "./CreateCourseForm";

export const metadata: Metadata = { title: "Admin — Courses" };
export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin({ loginRedirectTo: "/admin/courses" });

  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title_en, is_published, order_index")
    .order("order_index", { ascending: true });

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="label">Admin</span>
            <h1 className="mt-3 text-2xl font-bold text-white">Courses</h1>
          </div>
          <Link href="/admin/ai-course-builder" className="btn-secondary px-4 py-2 text-[13px]">
            ✦ AI Course Builder
          </Link>
        </div>

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

        <CreateCourseForm />
      </div>
    </div>
  );
}
