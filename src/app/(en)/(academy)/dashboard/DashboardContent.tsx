"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { logout as logoutRequest } from "@/features/auth/services/authService";
import type { ContinueLearningInfo, DashboardStats } from "@/features/courses/types/course";
import type { OwnedLearningResource } from "@/features/commerce/services/entitlementService";

interface DashboardProfile {
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
}

interface Props {
  profile: DashboardProfile;
  owned: OwnedLearningResource[];
  resume: ContinueLearningInfo | null;
  stats: DashboardStats;
  /** undefined = no PMP course entitlement (don't show anything certificate-related); null = entitled but not yet issued; string = issued certificate id. */
  certificateId: string | null | undefined;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-[12px] text-slate-500">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function DashboardContent({ profile, owned, resume, stats, certificateId }: Props) {
  const { t, lang } = useLang();
  const d = t.auth.dashboard;
  const c = t.commerce.dashboard;
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
    <div className="relative min-h-screen overflow-hidden px-6 py-24">
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
          <div className="flex items-center justify-between">
            <p className="label">{c.owned_heading}</p>
            <Link href="/courses" className="text-[12px] text-indigo-400 hover:text-indigo-300">
              {c.browse_courses}
            </Link>
          </div>
          {owned.length === 0 ? (
            <p className="mt-3 text-[13px] text-slate-500">{c.empty}</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {owned.map((resource) => {
                const title = lang === "ar" && resource.titleAr ? resource.titleAr : resource.titleEn;
                const hasCourse = resource.capabilities.includes("course:pmp");
                const hasPractice = resource.capabilities.includes("practice:pmp");
                const hasMockExam = resource.capabilities.includes("mock_exam:pmp");
                return (
                  <div key={resource.productId} className="card p-5">
                    <p className="text-[14px] font-medium text-white">{title}</p>
                    {resource.expiresAt && (
                      <p className="mt-1 text-[12px] text-slate-500">
                        {c.expires_label}: {new Date(resource.expiresAt).toLocaleDateString(lang === "ar" ? "ar" : "en-US")}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hasCourse && (
                        <Link href={`/courses/${resource.productSlug}`} className="btn-primary px-4 py-2 text-[12px]">
                          {c.open_course}
                        </Link>
                      )}
                      {hasPractice && (
                        <Link href="/pmp/practice" className="btn-ghost px-4 py-2 text-[12px]">
                          {c.open_practice}
                        </Link>
                      )}
                      {hasMockExam && (
                        <Link href="/pmp/mock-exam" className="btn-ghost px-4 py-2 text-[12px]">
                          {c.open_mock_exam}
                        </Link>
                      )}
                    </div>
                    {hasCourse && certificateId !== undefined && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                        {certificateId ? (
                          <>
                            <Link href="/certificate" className="btn-primary px-4 py-2 text-[12px]">
                              {c.certificate_view}
                            </Link>
                            <a href={`/api/certificates/${certificateId}/pdf`} className="btn-ghost px-4 py-2 text-[12px]">
                              {c.certificate_download}
                            </a>
                          </>
                        ) : (
                          <p className="text-[12px] text-slate-500">{c.certificate_locked}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
