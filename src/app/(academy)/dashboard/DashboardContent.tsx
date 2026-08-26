"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { logout as logoutRequest } from "@/features/auth/services/authService";
import type { Course, ContinueLearningInfo, DashboardStats } from "@/features/courses/types/course";

interface DashboardProfile {
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
}

interface Props {
  profile: DashboardProfile;
  courses: Course[];
  resume: ContinueLearningInfo | null;
  stats: DashboardStats;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-[12px] text-slate-500">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function DashboardContent({ profile, courses, resume, stats }: Props) {
  const { t, lang } = useLang();
  const d = t.auth.dashboard;
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email;

  async function handleLogout() {
    setLoggingOut(true);
    await logoutRequest();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[100px]" />

      <div className="container-page relative max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label">{d.role_label}: {profile.role}</p>
            <h1 className="mt-2 text-2xl font-bold text-white">
              {d.welcome}, {displayName}
            </h1>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} className="btn-ghost px-5 py-2.5 text-[13px]">
            {d.logout}
          </button>
        </div>

        {resume && (
          <div className="card mt-6 p-6">
            <p className="label">{d.continue_learning}</p>
            <p className="mt-2 text-[15px] font-semibold text-white">
              {lang === "ar" && resume.courseTitleAr ? resume.courseTitleAr : resume.courseTitleEn}
            </p>
            <p className="mt-1 text-[13px] text-slate-400">
              {lang === "ar" && resume.lessonTitleAr ? resume.lessonTitleAr : resume.lessonTitleEn}
            </p>
            <Link href={`/courses/${resume.courseSlug}/lessons/${resume.lessonId}`} className="btn-primary mt-4 inline-flex px-5 py-2.5 text-[13px]">
              {d.continue_cta}
            </Link>
          </div>
        )}

        <div className="card mt-6 p-6">
          <p className="label">PMP Practice Mode</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
            Practice with questions from the full PMP question bank — filter by domain, approach, difficulty, and question type, timed or untimed.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/pmp/practice" className="btn-primary px-5 py-2.5 text-[13px]">
              Start Practicing
            </Link>
            <Link href="/pmp/practice/history" className="btn-ghost px-5 py-2.5 text-[13px]">
              Practice History
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <p className="label">{d.study_statistics}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label={d.study_streak} value={`${stats.studyStreakDays} ${d.days}`} />
            <StatCard label={d.total_study_time} value={`${stats.totalStudyMinutes} ${d.minutes}`} />
            <StatCard label={d.learning_progress} value={`${stats.overallProgressPct}%`} />
          </div>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label={d.completed_lessons} value={`${stats.completedLessons}/${stats.totalLessons}`} />
            <StatCard label={d.completed_modules} value={`${stats.completedModules}/${stats.totalModules}`} />
            <StatCard label={d.quiz_progress} value={`${stats.quizzesPassed}/${stats.quizzesAttempted}`} />
          </div>
        </div>

        <div className="mt-8">
          <p className="label">{d.my_courses}</p>
          {courses.length === 0 ? (
            <p className="mt-3 text-[13px] text-slate-500">{d.no_courses}</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`} className="card p-5 transition-colors hover:bg-white/[0.04]">
                  <p className="text-[14px] font-medium text-white">
                    {lang === "ar" && course.title_ar ? course.title_ar : course.title_en}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
