"use client";

import { useState, type ReactNode } from "react";
import { useLang } from "@/lib/LanguageContext";
import StandardQuestion from "./StandardQuestion";
import MatchingQuestion from "./MatchingQuestion";
import DragDropQuestion from "./DragDropQuestion";
import HotspotQuestion from "./HotspotQuestion";
import QuizResults from "./QuizResults";
import type { QuizQuestion, QuizSubmitAnswer, QuizSubmitResult } from "@/features/courses/types/course";

export interface QuizRunnerProps {
  questions: QuizQuestion[];
  /**
   * Injected, not hardcoded — this is what makes the engine mode-agnostic.
   * A Learning Quiz posts to /api/assessments/[id]/submit; a future Practice
   * Mode or Mock Exam can post anywhere else (a different grading route,
   * different pass/fail rules, a timed auto-submit) without touching this
   * file, the six per-type question components, or quizGradingService.ts.
   */
  onSubmit: (answers: QuizSubmitAnswer[]) => Promise<QuizSubmitResult>;
  /** Mode-specific post-result CTAs (continue-learning links, exam analytics, etc.) — this component has no opinion on what comes next. */
  renderActions: (args: { result: QuizSubmitResult; onRetry: () => void }) => ReactNode;
}

/**
 * Orchestrates a mixed-interaction-type quiz — delegates rendering per
 * question to a type-specific component, all sharing one QuizSubmitAnswer
 * model. Contains NO learning-module-specific concepts (no assessmentId, no
 * courseSlug, no submit URL, no navigation) so it can be reused unmodified
 * for Learning Quizzes, Practice Mode, and Mock Exams — see
 * LearningQuizRunner.tsx for the learning-module-specific wrapper.
 */
export default function QuizRunner({ questions, onSubmit, renderActions }: QuizRunnerProps) {
  const { t, lang } = useLang();
  const a = t.courses.assessment;

  const [answers, setAnswers] = useState<Record<string, QuizSubmitAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  function setAnswer(question: QuizQuestion, partial: Partial<QuizSubmitAnswer>) {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], ...partial, questionId: question.id, source: question.source },
    }));
  }

  function isAnswered(q: QuizQuestion): boolean {
    const ans = answers[q.id];
    if (!ans) return false;
    switch (q.interactionType) {
      case "standard":
      case "graphic_based":
        return !!ans.selectedOptionIds?.length;
      case "matching":
        return q.matchingLeft.length > 0 && (ans.matchingPairs?.length ?? 0) === q.matchingLeft.length;
      case "drag_and_drop":
        return q.dragDropItems.length > 0 && (ans.dragDropOrder?.length ?? 0) === q.dragDropItems.length;
      case "hotspot":
        return !!ans.hotspotClick;
      default:
        return false;
    }
  }

  const allAnswered = questions.length > 0 && questions.every(isAnswered);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const data = await onSubmit(questions.map((q) => answers[q.id] ?? { questionId: q.id, source: q.source }));
      if (!data.success) {
        setError(data.error ?? a.generic_error);
        return;
      }
      setResult(data);
    } catch {
      setError(a.generic_error);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setError(null);
  }

  if (result) {
    return <QuizResults questions={questions} result={result} actions={renderActions({ result, onRetry: handleRetry })} />;
  }

  return (
    <div className="card p-7">
      <div className="space-y-8">
        {questions.map((q, qi) => (
          <div key={q.id}>
            <p className="text-[14px] font-medium text-white">
              {qi + 1}. {lang === "ar" && q.questionTextAr ? q.questionTextAr : q.questionTextEn}
            </p>
            <div className="mt-3">
              {(q.interactionType === "standard" || q.interactionType === "graphic_based") && (
                <StandardQuestion question={q} value={answers[q.id]} onChange={(partial) => setAnswer(q, partial)} />
              )}
              {q.interactionType === "matching" && (
                <MatchingQuestion question={q} value={answers[q.id]} onChange={(partial) => setAnswer(q, partial)} />
              )}
              {q.interactionType === "drag_and_drop" && (
                <DragDropQuestion question={q} value={answers[q.id]} onChange={(partial) => setAnswer(q, partial)} />
              )}
              {q.interactionType === "hotspot" && (
                <HotspotQuestion question={q} value={answers[q.id]} onChange={(partial) => setAnswer(q, partial)} />
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-400">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="btn-primary mt-6 w-full py-3 text-[14px] disabled:opacity-40"
      >
        {submitting ? a.submitting : a.submit}
      </button>
    </div>
  );
}
