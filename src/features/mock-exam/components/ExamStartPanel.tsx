"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { createMockExamAttempt } from "@/features/mock-exam/services/examAttemptService";
import { getActiveBlueprint } from "@/features/mock-exam/config/examBlueprint";

interface Props {
  activeAttemptId: string | null;
}

export default function ExamStartPanel({ activeAttemptId }: Props) {
  const router = useRouter();
  const { t } = useLang();
  const k = t.examStart;
  const blueprint = getActiveBlueprint();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hours = Math.floor(blueprint.durationSeconds / 3600);
  const minutes = Math.round((blueprint.durationSeconds % 3600) / 60);
  const breakMinutes = blueprint.breaks.map((b) => Math.round(b.durationSeconds / 60));

  function handleBegin() {
    setError(null);
    startTransition(async () => {
      const result = await createMockExamAttempt();
      if (!result.success || !result.attemptId) {
        setError(result.error ?? k.failedToStart);
        return;
      }
      router.push(`/pmp/mock-exam/${result.attemptId}`);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{k.questions}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{blueprint.totalQuestions}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{k.timeAllowed}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {hours}h {minutes > 0 ? `${minutes}m` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{k.scheduledBreaks}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {breakMinutes.length} × {breakMinutes[0] ?? 0}m
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-[13px] leading-relaxed text-slate-600">
        <p>{k.description1.replace("{sections}", String(blueprint.sections.length)).replace("{count}", String(blueprint.sections[0]?.questionCount ?? 0))}</p>
        <p>{k.description2}</p>
        <p>{k.description3}</p>
      </div>

      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}

      <div className="mt-6">
        {activeAttemptId ? (
          <button
            onClick={() => router.push(`/pmp/mock-exam/${activeAttemptId}`)}
            className="btn-primary w-full py-3 text-[14px]"
          >
            {k.resumeInProgress}
          </button>
        ) : (
          <button
            onClick={handleBegin}
            disabled={isPending}
            className="btn-primary w-full py-3 text-[14px]"
          >
            {isPending ? k.preparingExam : k.beginExam}
          </button>
        )}
      </div>
    </div>
  );
}
