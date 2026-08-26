"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLang } from "@/lib/LanguageContext";
import { getMyEnrollment, enrollInCourse } from "@/features/courses/services/enrollmentService";
import type { EnrollmentStatus } from "@/features/courses/types/course";

const COURSE_SLUG = "pmp";

export default function EnrollContent() {
  const { t } = useLang();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const program = t.academy.programs.find((p) => p.id === "pmp-mastery")!;

  const [enrollment, setEnrollment] = useState<EnrollmentStatus | null>(null);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setCheckingEnrollment(false);
      return;
    }
    let mounted = true;
    getMyEnrollment(COURSE_SLUG).then((result) => {
      if (mounted) {
        setEnrollment(result);
        setCheckingEnrollment(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [authLoading, isAuthenticated]);

  function handleEnroll() {
    setError(null);
    startTransition(async () => {
      const result = await enrollInCourse(COURSE_SLUG);
      if (result.success) {
        setEnrollment({ status: "active", enrolled_at: new Date().toISOString() });
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  const isLoading = authLoading || checkingEnrollment;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-xl">
        <span className="label">{program.tag}</span>
        <h1 className="mt-3 text-3xl font-bold text-white">{program.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{program.desc}</p>

        <div className="card mt-8 p-6">
          {isLoading ? (
            <div className="h-11 animate-pulse rounded-lg bg-white/[0.06]" />
          ) : !isAuthenticated ? (
            <div>
              <p className="text-[14px] text-slate-400">Log in or create an account to enroll in this course.</p>
              <div className="mt-4 flex gap-3">
                <Link href="/login?redirectTo=/enroll" className="btn-primary">Log In</Link>
                <Link href="/signup" className="btn-secondary">Create Account</Link>
              </div>
            </div>
          ) : enrollment?.status === "active" ? (
            <div>
              <p className="text-[14px] font-medium text-emerald-400">You&apos;re enrolled in this course.</p>
              <div className="mt-4">
                <Link href={`/courses/${COURSE_SLUG}`} className="btn-primary">Go to Course</Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[14px] text-slate-400">You&apos;re logged in — enroll now to get full access to this course.</p>
              {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}
              <div className="mt-4">
                <button onClick={handleEnroll} disabled={isPending} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
                  {isPending ? "Enrolling…" : "Enroll Now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
