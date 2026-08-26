"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { tf } from "@/lib/translations";
import AssessmentLangToggle from "@/components/assessment/AssessmentLangToggle";
import StandardQuestion from "@/features/courses/components/quiz/StandardQuestion";
import MatchingQuestion from "@/features/courses/components/quiz/MatchingQuestion";
import DragDropQuestion from "@/features/courses/components/quiz/DragDropQuestion";
import HotspotQuestion from "@/features/courses/components/quiz/HotspotQuestion";
import PracticeNavigator from "@/features/practice/components/PracticeNavigator";
import {
  saveAnswer,
  saveCurrentIndex,
  toggleFlag,
  recordTimeSpent,
  submitSession,
} from "@/features/practice/services/practiceSessionService";
import type { QuizQuestion, QuizSubmitAnswer } from "@/features/courses/types/course";
import type { PracticeRunnerData } from "@/features/practice/types/practice";

interface Props {
  sessionId: string;
  initialData: PracticeRunnerData;
}

function isQuestionAnswered(question: QuizQuestion, answer: QuizSubmitAnswer | undefined): boolean {
  if (!answer) return false;
  switch (question.interactionType) {
    case "standard":
    case "graphic_based":
      return !!answer.selectedOptionIds?.length;
    case "matching":
      return question.matchingLeft.length > 0 && (answer.matchingPairs?.length ?? 0) === question.matchingLeft.length;
    case "drag_and_drop":
      return question.dragDropItems.length > 0 && (answer.dragDropOrder?.length ?? 0) === question.dragDropItems.length;
    case "hotspot":
      return !!answer.hotspotClick;
    default:
      return false;
  }
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PracticeRunner({ sessionId, initialData }: Props) {
  const router = useRouter();
  const { t, lang } = useLang();
  const rn = t.assessment.runner;

  const { session, questions, questionStates } = initialData;

  const [currentIndex, setCurrentIndex] = useState(session.currentQuestionIndex);
  const [answers, setAnswers] = useState<Record<string, QuizSubmitAnswer>>(() => {
    const initial: Record<string, QuizSubmitAnswer> = {};
    questionStates.forEach((s) => {
      if (s.questionId && s.response) initial[s.questionId] = s.response;
    });
    return initial;
  });
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    questionStates.forEach((s) => {
      if (s.questionId) initial[s.questionId] = s.isFlagged;
    });
    return initial;
  });

  const [remainingSeconds, setRemainingSeconds] = useState(initialData.serverRemainingSeconds);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveWarning, setSaveWarning] = useState(false);

  const questionEnteredAtRef = useRef(Date.now());
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);

  const currentQuestion = questions[currentIndex] ?? null;
  const currentQuestionId = currentQuestion?.id ?? null;

  const flushTimeSpent = useCallback(
    (questionId: string | null) => {
      if (!questionId) return;
      const elapsed = Math.round((Date.now() - questionEnteredAtRef.current) / 1000);
      questionEnteredAtRef.current = Date.now();
      if (elapsed > 0) void recordTimeSpent(sessionId, questionId, elapsed);
    },
    [sessionId]
  );

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    flushTimeSpent(currentQuestionId);
    const result = await submitSession(sessionId);
    if (result.success) {
      router.push(`/pmp/practice/${sessionId}/results`);
    } else {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [currentQuestionId, flushTimeSpent, router, sessionId]);

  // Timed countdown - client-side ticking for display only; the actual
  // expiry decision is always re-verified server-side (submitSession /
  // getPracticeSession), so a slow/fast local clock can't extend or shrink
  // the real deadline, only the moment this tab happens to notice it.
  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      void handleSubmit();
      return;
    }
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(interval);
          void handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToIndex(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= questions.length || nextIndex === currentIndex) return;
    flushTimeSpent(currentQuestionId);
    setCurrentIndex(nextIndex);
    void saveCurrentIndex(sessionId, nextIndex);
  }

  function handleAnswerChange(question: QuizQuestion, partial: Partial<QuizSubmitAnswer>) {
    const next: QuizSubmitAnswer = {
      ...answers[question.id],
      ...partial,
      questionId: question.id,
      source: question.source,
    };
    setAnswers((prev) => ({ ...prev, [question.id]: next }));

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveAnswer(sessionId, question.id, next).then((res) => setSaveWarning(!res.success));
    }, 400);
  }

  function handleFlagToggle() {
    if (!currentQuestionId) return;
    const next = !flags[currentQuestionId];
    setFlags((prev) => ({ ...prev, [currentQuestionId]: next }));
    void toggleFlag(sessionId, currentQuestionId, next);
  }

  const answeredIndexes = new Set(questions.map((q, i) => (q && isQuestionAnswered(q, answers[q.id]) ? i : -1)).filter((i) => i >= 0));
  const flaggedIndexes = new Set(questions.map((q, i) => (q && flags[q.id] ? i : -1)).filter((i) => i >= 0));
  const unansweredCount = questions.length - answeredIndexes.size;

  function attemptSubmit() {
    if (unansweredCount > 0) {
      setShowSubmitConfirm(true);
    } else {
      void handleSubmit();
    }
  }

  const progressPct = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="relative min-h-screen px-6 py-24" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="container-page relative max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label">
              {rn.question} {currentIndex + 1} {rn.of} {questions.length}
            </p>
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AssessmentLangToggle />
            {remainingSeconds !== null && (
              <div
                className={`rounded-xl border px-4 py-2 text-[14px] font-semibold ${
                  remainingSeconds < 60 ? "border-red-500/30 bg-red-500/[0.08] text-red-400" : "border-white/[0.08] bg-white/[0.03] text-white"
                }`}
              >
                ⏱ {formatTime(remainingSeconds)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="card p-7">
            {saveWarning && (
              <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-2 text-[12px] text-amber-400">
                {rn.saveWarning}
              </p>
            )}

            {!currentQuestion ? (
              <p className="text-[14px] text-slate-500">{rn.noQuestionAvailable}</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[15px] font-medium text-white">
                    {lang === "ar" && currentQuestion.questionTextAr ? currentQuestion.questionTextAr : currentQuestion.questionTextEn}
                  </p>
                  <button
                    onClick={handleFlagToggle}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      flags[currentQuestion.id] ? "bg-amber-500/[0.15] text-amber-400" : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]"
                    }`}
                  >
                    {flags[currentQuestion.id] ? `★ ${rn.flagged}` : `☆ ${rn.flagForReview}`}
                  </button>
                </div>

                <div className="mt-5">
                  {(currentQuestion.interactionType === "standard" || currentQuestion.interactionType === "graphic_based") && (
                    <StandardQuestion question={currentQuestion} value={answers[currentQuestion.id]} onChange={(p) => handleAnswerChange(currentQuestion, p)} />
                  )}
                  {currentQuestion.interactionType === "matching" && (
                    <MatchingQuestion question={currentQuestion} value={answers[currentQuestion.id]} onChange={(p) => handleAnswerChange(currentQuestion, p)} />
                  )}
                  {currentQuestion.interactionType === "drag_and_drop" && (
                    <DragDropQuestion question={currentQuestion} value={answers[currentQuestion.id]} onChange={(p) => handleAnswerChange(currentQuestion, p)} />
                  )}
                  {currentQuestion.interactionType === "hotspot" && (
                    <HotspotQuestion question={currentQuestion} value={answers[currentQuestion.id]} onChange={(p) => handleAnswerChange(currentQuestion, p)} />
                  )}
                </div>
              </>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-6">
              <button onClick={() => goToIndex(currentIndex - 1)} disabled={currentIndex === 0} className="btn-ghost px-5 py-2.5 text-[13px] disabled:opacity-30">
                ← {rn.previous}
              </button>
              {currentIndex === questions.length - 1 ? (
                <button onClick={attemptSubmit} disabled={submitting} className="btn-primary px-6 py-2.5 text-[13px] disabled:opacity-50">
                  {submitting ? rn.submitting : rn.submitPractice}
                </button>
              ) : (
                <button onClick={() => goToIndex(currentIndex + 1)} className="btn-primary px-5 py-2.5 text-[13px]">
                  {rn.next} →
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <PracticeNavigator
              total={questions.length}
              currentIndex={currentIndex}
              answeredIndexes={answeredIndexes}
              flaggedIndexes={flaggedIndexes}
              onJump={goToIndex}
            />
            <button onClick={attemptSubmit} disabled={submitting} className="btn-ghost w-full py-2.5 text-[13px] disabled:opacity-50">
              {submitting ? rn.submitting : rn.submitPractice}
            </button>
          </div>
        </div>
      </div>

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="card max-w-sm p-6">
            <p className="text-[15px] font-semibold text-white">{rn.submitConfirmTitle}</p>
            <p className="mt-2 text-[13px] text-slate-400">{tf(rn.submitConfirmBody, { count: unansweredCount })}</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)} className="btn-ghost flex-1 py-2.5 text-[13px]">
                {rn.keepGoing}
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  void handleSubmit();
                }}
                className="btn-primary flex-1 py-2.5 text-[13px]"
              >
                {rn.submitAnyway}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
