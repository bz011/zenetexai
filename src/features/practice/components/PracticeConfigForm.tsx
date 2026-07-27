"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkEligibleQuestionCount, createPracticeSession } from "@/features/practice/services/practiceSessionService";
import type { PracticeConfig, PracticeFilters, PracticeQuestionCount } from "@/features/practice/types/practice";

const QUESTION_COUNTS: PracticeQuestionCount[] = [5, 10, 20, 30, 50];

const DOMAINS = ["People", "Process", "Business Environment"] as const;
const APPROACHES = ["Predictive", "Agile", "Hybrid", "Mixed"] as const;
const DIFFICULTIES = ["Easy", "Moderate", "Difficult", "Expert"] as const;
const QUESTION_TYPES: { label: string; interactionType: PracticeFilters["interactionType"]; answerType: PracticeFilters["answerType"] }[] = [
  { label: "All", interactionType: null, answerType: null },
  { label: "Single choice", interactionType: "standard", answerType: "single" },
  { label: "Multiple response", interactionType: "standard", answerType: "multiple_response" },
  { label: "Matching", interactionType: "matching", answerType: null },
  { label: "Drag and drop", interactionType: "drag_and_drop", answerType: null },
  { label: "Hotspot", interactionType: "hotspot", answerType: null },
  { label: "Graphic/scenario", interactionType: "graphic_based", answerType: null },
];

const selectCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white outline-none transition-all focus:border-indigo-500/60";

export default function PracticeConfigForm() {
  const router = useRouter();
  const [filters, setFilters] = useState<PracticeFilters>({
    domain: null,
    approach: null,
    difficulty: null,
    interactionType: null,
    answerType: null,
    language: "en",
  });
  const [questionCount, setQuestionCount] = useState<PracticeQuestionCount>(10);
  const [isTimed, setIsTimed] = useState(false);
  const [timerMode, setTimerMode] = useState<"60" | "78" | "custom">("60");
  const [customMinutes, setCustomMinutes] = useState(20);
  const [questionTypeIndex, setQuestionTypeIndex] = useState(0);

  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [checkingCount, setCheckingCount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setCheckingCount(true);
    checkEligibleQuestionCount(filters).then((count) => {
      if (!cancelled) {
        setEligibleCount(count);
        setCheckingCount(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const notEnoughQuestions = eligibleCount !== null && eligibleCount < questionCount;

  function updateQuestionType(index: number) {
    setQuestionTypeIndex(index);
    const qt = QUESTION_TYPES[index];
    setFilters((prev) => ({ ...prev, interactionType: qt.interactionType, answerType: qt.answerType }));
  }

  function handleStart() {
    setError(null);
    const config: PracticeConfig = {
      ...filters,
      questionCount,
      isTimed,
      secondsPerQuestion: timerMode === "60" ? 60 : timerMode === "78" ? 78 : undefined,
      customDurationMinutes: timerMode === "custom" ? customMinutes : undefined,
    };

    startTransition(async () => {
      const result = await createPracticeSession(config);
      if (!result.success || !result.sessionId) {
        setError(result.error ?? "Failed to start practice session");
        return;
      }
      router.push(`/pmp/practice/${result.sessionId}`);
    });
  }

  return (
    <div className="card mt-8 space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Number of questions</label>
          <select className={selectCls} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value) as PracticeQuestionCount)}>
            {QUESTION_COUNTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Domain</label>
          <select
            className={selectCls}
            value={filters.domain ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, domain: (e.target.value || null) as PracticeFilters["domain"] }))}
          >
            <option value="">All</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Approach</label>
          <select
            className={selectCls}
            value={filters.approach ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, approach: (e.target.value || null) as PracticeFilters["approach"] }))}
          >
            <option value="">All</option>
            {APPROACHES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Difficulty</label>
          <select
            className={selectCls}
            value={filters.difficulty ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, difficulty: (e.target.value || null) as PracticeFilters["difficulty"] }))}
          >
            <option value="">All</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Question type</label>
          <select className={selectCls} value={questionTypeIndex} onChange={(e) => updateQuestionType(Number(e.target.value))}>
            {QUESTION_TYPES.map((qt, i) => (
              <option key={qt.label} value={i}>
                {qt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Language</label>
          <select
            className={selectCls}
            value={filters.language}
            onChange={(e) => setFilters((prev) => ({ ...prev, language: e.target.value as PracticeFilters["language"] }))}
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="bilingual">Bilingual</option>
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-[13px] text-slate-400">
          <input type="checkbox" checked={isTimed} onChange={(e) => setIsTimed(e.target.checked)} className="accent-indigo-500" />
          Timed practice
        </label>

        {isTimed && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select className={selectCls} value={timerMode} onChange={(e) => setTimerMode(e.target.value as "60" | "78" | "custom")}>
              <option value="60">1 minute / question</option>
              <option value="78">1.3 minutes / question</option>
              <option value="custom">Custom total duration</option>
            </select>
            {timerMode === "custom" && (
              <input
                type="number"
                min={1}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value)))}
                className={selectCls}
                placeholder="Minutes"
              />
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px]">
        {checkingCount ? (
          <span className="text-slate-500">Checking eligible questions...</span>
        ) : eligibleCount !== null ? (
          <span className={notEnoughQuestions ? "text-red-400" : "text-slate-400"}>
            {eligibleCount} question{eligibleCount === 1 ? "" : "s"} available with these filters
            {notEnoughQuestions ? ` — need ${questionCount}` : ""}
          </span>
        ) : null}
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-400">{error}</p>
      )}

      <button
        onClick={handleStart}
        disabled={isPending || checkingCount || notEnoughQuestions}
        className="btn-primary w-full py-3 text-[14px] disabled:opacity-40"
      >
        {isPending ? "Starting..." : "Start Practice"}
      </button>
    </div>
  );
}
