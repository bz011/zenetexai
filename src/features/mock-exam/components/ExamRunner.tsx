"use client";

/**
 * Distraction-free, CBT-style Mock Exam runner. White background, restrained
 * controls, high-contrast question number/timer/flag/navigation states -
 * deliberately NOT a copy of any proctoring vendor's branding or layout,
 * just a plain, professional testing surface. AcademyShell (the "Exam
 * Shell" exception) suppresses the Academy header/footer and there is no
 * corporate chrome or WhatsApp button on this route tree at all (see
 * AcademyShell.tsx and (corporate)/layout.tsx).
 *
 * Mirrors PracticeRunner.tsx's autosave/timer/navigation patterns exactly,
 * extended for the break state machine (BreakScreen overlay + section
 * locking) that Practice Mode doesn't have.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { tf } from "@/lib/translations";
import AssessmentLangToggle from "@/components/assessment/AssessmentLangToggle";
import StandardQuestion from "@/features/courses/components/quiz/StandardQuestion";
import MatchingQuestion from "@/features/courses/components/quiz/MatchingQuestion";
import DragDropQuestion from "@/features/courses/components/quiz/DragDropQuestion";
import HotspotQuestion from "@/features/courses/components/quiz/HotspotQuestion";
import ExamNavigator from "@/features/mock-exam/components/ExamNavigator";
import BreakScreen from "@/features/mock-exam/components/BreakScreen";
import SectionCompleteScreen from "@/features/mock-exam/components/SectionCompleteScreen";
import {
  saveExamAnswer,
  saveExamCurrentIndex,
  toggleExamFlag,
  recordExamTimeSpent,
  startExamBreak,
  advanceToNextSection,
  endExamBreak,
  submitMockExam,
} from "@/features/mock-exam/services/examAttemptService";
import { getEligibleBreak } from "@/features/mock-exam/services/examTimerUtils";
import { getBlueprintByVersion, getActiveBlueprint } from "@/features/mock-exam/config/examBlueprint";
import type { QuizQuestion, QuizSubmitAnswer } from "@/features/courses/types/course";
import type { MockExamRunnerData } from "@/features/mock-exam/types/mockExam";

interface Props {
  attemptId: string;
  initialData: MockExamRunnerData;
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
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ExamRunner({ attemptId, initialData }: Props) {
  const router = useRouter();
  const { t, lang } = useLang();
  const rn = t.assessment.runner;

  const { attempt, questions, questionStates } = initialData;
  const blueprint = getBlueprintByVersion(attempt.blueprintVersion) ?? getActiveBlueprint();
  const sectionNumbers = questionStates.map((s) => s.sectionNumber);

  const [currentIndex, setCurrentIndex] = useState(attempt.currentQuestionIndex);
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
  const [onBreak, setOnBreak] = useState(attempt.onBreak);
  const [breakInfo, setBreakInfo] = useState<{ breakNumber: number; remainingSeconds: number } | null>(
    attempt.onBreak && attempt.breaksTaken.length > 0
      ? { breakNumber: attempt.breaksTaken[attempt.breaksTaken.length - 1], remainingSeconds: initialData.serverBreakRemainingSeconds ?? 0 }
      : null
  );
  const [breaksTaken, setBreaksTaken] = useState<number[]>(attempt.breaksTaken);
  // Only the setter is used - goToIndex's own section-boundary check
  // already makes navigating into a locked section impossible without
  // needing to read sectionsLocked directly (see its comment below); this
  // state exists purely to keep the client's copy in sync with the server
  // for potential future consumers.
  const [, setSectionsLocked] = useState<number[]>(attempt.sectionsLocked);
  const [resumingFromBreak, setResumingFromBreak] = useState(false);

  // Section-boundary gate (Sprint 9.1 items 3+4): set SYNCHRONOUSLY the
  // instant the student finishes a section's last question, before any
  // network call - this is what makes it impossible for the next
  // section's question to ever render underneath during the transition.
  const [sectionTransition, setSectionTransition] = useState<{ completedSection: number; nextSection: number; breakEligible: boolean; breakNumber: number | null } | null>(
    null
  );
  const [transitionSubmitting, setTransitionSubmitting] = useState(false);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveWarning, setSaveWarning] = useState(false);

  const questionEnteredAtRef = useRef(Date.now());
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);

  const currentQuestion = questions[currentIndex] ?? null;
  const currentQuestionId = currentQuestion?.id ?? null;
  const currentSection = sectionNumbers[currentIndex] ?? attempt.currentSection;

  const flushTimeSpent = useCallback(
    (questionId: string | null) => {
      if (!questionId) return;
      const elapsed = Math.round((Date.now() - questionEnteredAtRef.current) / 1000);
      questionEnteredAtRef.current = Date.now();
      if (elapsed > 0) void recordExamTimeSpent(attemptId, questionId, elapsed);
    },
    [attemptId]
  );

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    flushTimeSpent(currentQuestionId);
    const result = await submitMockExam(attemptId);
    if (result.success) {
      router.push(`/pmp/mock-exam/${attemptId}/results`);
    } else {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [attemptId, currentQuestionId, flushTimeSpent, router]);

  // Client-side ticking is display-only - submitMockExam always re-verifies
  // expiry (break-aware) server-side before trusting it, same posture as
  // PracticeRunner.
  useEffect(() => {
    if (onBreak || remainingSeconds === null) return;
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
  }, [onBreak]);

  // Prev/Next and the navigator only ever construct indexes within the
  // CURRENT section (item 4) - a locked/completed section's questions and
  // any not-yet-reached future section's questions are never offered as a
  // destination, so this single bounds check is both necessary and
  // sufficient (no separate sectionsLocked check needed here - the server
  // still enforces it independently in saveExamAnswer as a backstop).
  function goToIndex(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= questions.length || nextIndex === currentIndex) return;
    if (sectionNumbers[nextIndex] !== currentSection) return;
    flushTimeSpent(currentQuestionId);
    setCurrentIndex(nextIndex);
    void saveExamCurrentIndex(attemptId, nextIndex);
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
      saveExamAnswer(attemptId, question.id, next).then((res) => setSaveWarning(!res.success));
    }, 400);
  }

  function handleFlagToggle() {
    if (!currentQuestionId) return;
    const next = !flags[currentQuestionId];
    setFlags((prev) => ({ ...prev, [currentQuestionId]: next }));
    void toggleExamFlag(attemptId, currentQuestionId, next);
  }

  // Triggered by "Finish Section" on the last question of a section -
  // SYNCHRONOUSLY replaces exam content with SectionCompleteScreen before
  // any network call happens (item 3's "immediately replace exam content
  // with a full break-transition state... never render the next section
  // question behind/below it").
  function handleFinishSection() {
    const nextIndex = currentIndex + 1;
    const nextSection = sectionNumbers[nextIndex];
    flushTimeSpent(currentQuestionId);
    const eligibility = getEligibleBreak(nextIndex, breaksTaken, blueprint);
    setSectionTransition({ completedSection: currentSection, nextSection, breakEligible: eligibility.eligible, breakNumber: eligibility.breakNumber });
  }

  async function handleConfirmStartBreak() {
    if (!sectionTransition || transitionSubmitting) return;
    setTransitionSubmitting(true);
    const result = await startExamBreak(attemptId);
    if (result.success && result.nextIndex !== undefined) {
      const { completedSection, breakNumber } = sectionTransition;
      setSectionsLocked((prev) => (prev.includes(completedSection) ? prev : [...prev, completedSection]));
      setBreaksTaken((prev) => [...prev, breakNumber as number]);
      setCurrentIndex(result.nextIndex);
      setBreakInfo({ breakNumber: breakNumber as number, remainingSeconds: blueprint.breaks[(breakNumber as number) - 1]?.durationSeconds ?? 0 });
      setOnBreak(true);
      setSectionTransition(null);
    }
    setTransitionSubmitting(false);
  }

  async function handleConfirmContinue() {
    if (!sectionTransition || transitionSubmitting) return;
    setTransitionSubmitting(true);
    const result = await advanceToNextSection(attemptId);
    if (result.success && result.nextIndex !== undefined) {
      setSectionsLocked((prev) => (prev.includes(sectionTransition.completedSection) ? prev : [...prev, sectionTransition.completedSection]));
      setCurrentIndex(result.nextIndex);
      setSectionTransition(null);
    }
    setTransitionSubmitting(false);
  }

  async function handleResumeFromBreak() {
    if (resumingFromBreak) return;
    setResumingFromBreak(true);
    await endExamBreak(attemptId);
    // A fresh server-authoritative read is the simplest correct way to
    // resume - break-consumed-time accounting lives entirely server-side.
    window.location.reload();
  }

  const answeredIndexes = new Set(questions.map((q, i) => (q && isQuestionAnswered(q, answers[q.id])) ? i : -1).filter((i) => i >= 0));
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
  const isVeryLastQuestion = currentIndex === questions.length - 1;
  const isLastQuestionOfSection = !isVeryLastQuestion && sectionNumbers[currentIndex + 1] !== currentSection;
  const sectionQuestionIndexes = sectionNumbers.reduce<number[]>((acc, s, i) => (s === currentSection ? [...acc, i] : acc), []);

  // Section-boundary gate takes priority over everything else - rendered
  // the instant handleFinishSection sets it, with zero network wait.
  if (sectionTransition) {
    return (
      <SectionCompleteScreen
        completedSection={sectionTransition.completedSection}
        nextSection={sectionTransition.nextSection}
        breakEligible={sectionTransition.breakEligible}
        breakMinutes={sectionTransition.breakNumber !== null ? Math.round((blueprint.breaks[sectionTransition.breakNumber - 1]?.durationSeconds ?? 0) / 60) : 0}
        submitting={transitionSubmitting}
        onStartBreak={handleConfirmStartBreak}
        onContinue={handleConfirmContinue}
      />
    );
  }

  if (onBreak && breakInfo) {
    return <BreakScreen breakNumber={breakInfo.breakNumber} initialRemainingSeconds={breakInfo.remainingSeconds} onResume={handleResumeFromBreak} resuming={resumingFromBreak} />;
  }

  return (
    <div className="academy-shell min-h-screen bg-white px-4 py-6 sm:px-8" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              {rn.section} {currentSection} · {rn.question} {currentIndex + 1} {rn.of} {questions.length}
            </p>
            <div className="mt-1.5 h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AssessmentLangToggle />
            {remainingSeconds !== null && (
              <div
                className={`rounded-lg border px-4 py-2 text-[14px] font-semibold tabular-nums ${
                  remainingSeconds < 300 ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-900"
                }`}
              >
                {formatTime(remainingSeconds)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            {saveWarning && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-800">
                {rn.saveWarning}
              </p>
            )}

            {!currentQuestion ? (
              <p className="text-[14px] text-slate-500">{rn.noQuestionAvailable}</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[15px] font-medium text-slate-900">
                    {lang === "ar" && currentQuestion.questionTextAr ? currentQuestion.questionTextAr : currentQuestion.questionTextEn}
                  </p>
                  <button
                    onClick={handleFlagToggle}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      flags[currentQuestion.id] ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {flags[currentQuestion.id] ? `⚑ ${rn.flagged}` : `☆ ${rn.flagForReview}`}
                  </button>
                </div>

                <div className="academy-shell mt-5">
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

            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                onClick={() => goToIndex(currentIndex - 1)}
                disabled={currentIndex === sectionQuestionIndexes[0]}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-30"
              >
                ← {rn.previous}
              </button>
              {isVeryLastQuestion ? (
                <button
                  onClick={attemptSubmit}
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? rn.submitting : rn.submitExam}
                </button>
              ) : isLastQuestionOfSection ? (
                <button
                  onClick={handleFinishSection}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  {rn.finishSection} {currentSection} →
                </button>
              ) : (
                <button
                  onClick={() => goToIndex(currentIndex + 1)}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  {rn.next} →
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <ExamNavigator
              sectionNumber={currentSection}
              sectionQuestionIndexes={sectionQuestionIndexes}
              currentIndex={currentIndex}
              answeredIndexes={answeredIndexes}
              flaggedIndexes={flaggedIndexes}
              onJump={goToIndex}
            />
            <button
              onClick={attemptSubmit}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-200 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {submitting ? rn.submitting : rn.submitExam}
            </button>
          </div>
        </div>
      </div>

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6">
          <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-[15px] font-semibold text-slate-900">{rn.submitConfirmTitle}</p>
            <p className="mt-2 text-[13px] text-slate-500">{tf(rn.submitConfirmBody, { count: unansweredCount })}</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                {rn.keepGoing}
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  void handleSubmit();
                }}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700"
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
