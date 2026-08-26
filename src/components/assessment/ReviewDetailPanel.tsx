"use client";

import type { AssessmentReviewQuestionDetail } from "@/components/assessment/assessmentReviewTypes";
import { getQuestionImagePublicUrl } from "@/lib/supabase/imageUrls";
import type { Translations } from "@/lib/translations";

/**
 * Professional single-question review panel - question, student's answer,
 * correct answer, per-option "why this is wrong" feedback, explanation,
 * and (when the content has it) key concept / exam tip / common trap from
 * the AI Question Factory's structured explanation. Fetched lazily one
 * question at a time by the caller (item 9) - this component only renders
 * whatever detail it's handed.
 */

interface Props {
  detail: AssessmentReviewQuestionDetail | null;
  loading: boolean;
  lang: "en" | "ar";
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  t: Translations["assessment"]["review"];
}

export default function ReviewDetailPanel({ detail, loading, lang, hasPrev, hasNext, onPrev, onNext, onBack, t }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700">
          {t.backToGrid}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-30"
          >
            {t.previousQuestion}
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-30"
          >
            {t.nextQuestion}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-[13px] text-slate-500">{t.loading}</p>
      ) : !detail ? (
        <p className="mt-6 text-[13px] text-slate-500">{t.selectQuestion}</p>
      ) : (
        <div className="mt-5">
          <div className="flex items-start gap-2">
            <span className={detail.isCorrect === true ? "text-emerald-600" : detail.isCorrect === false ? "text-red-600" : "text-slate-400"}>
              {detail.isCorrect === true ? "✓" : detail.isCorrect === false ? "✗" : "—"}
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-slate-900">
                {detail.sequenceNumber + 1}. {lang === "ar" && detail.questionTextAr ? detail.questionTextAr : detail.questionTextEn}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{[detail.domain, detail.approach, detail.difficulty].filter(Boolean).join(" · ")}</p>
            </div>
            {detail.isFlagged && <span className="shrink-0 text-amber-500">⚑</span>}
          </div>

          {detail.images.length > 0 && (
            <div className="mt-4 space-y-2">
              {detail.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={getQuestionImagePublicUrl(img.imagePath)}
                  alt={(lang === "ar" && img.altAr) || img.altEn || ""}
                  className="max-h-80 w-full rounded-xl border border-slate-200 object-contain"
                />
              ))}
            </div>
          )}

          {(detail.interactionType === "standard" || detail.interactionType === "graphic_based") && (
            <div className="mt-4 space-y-2">
              {detail.options.map((o) => {
                const wasSelected = detail.response?.selectedOptionIds?.includes(o.id);
                const feedback = lang === "ar" && o.feedbackAr ? o.feedbackAr : o.feedbackEn;
                return (
                  <div key={o.id} className={`rounded-lg border px-4 py-2.5 text-[13px] ${o.isCorrect ? "border-emerald-200 bg-emerald-50" : wasSelected ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
                    <p className={o.isCorrect ? "text-emerald-700" : wasSelected ? "text-red-700" : "text-slate-600"}>
                      {o.isCorrect ? "✓ " : wasSelected ? "✗ " : "  "}
                      {lang === "ar" && o.textAr ? o.textAr : o.textEn}
                    </p>
                    {feedback && !o.isCorrect && <p className="mt-1 text-[12px] text-slate-500">{t.whyWrong}: {feedback}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {detail.interactionType === "matching" && (
            <div className="mt-4 space-y-1 text-[13px] text-slate-600">
              {detail.matchingLeft.map((left) => {
                const correctRightId = detail.matchingCorrectRightIdByLeft[left.id];
                const correctRight = detail.matchingRight.find((r) => r.id === correctRightId);
                return (
                  <p key={left.id}>
                    {lang === "ar" && left.textAr ? left.textAr : left.textEn} →{" "}
                    <span className="text-emerald-600">{correctRight ? (lang === "ar" && correctRight.textAr ? correctRight.textAr : correctRight.textEn) : "?"}</span>
                  </p>
                );
              })}
            </div>
          )}

          {detail.interactionType === "drag_and_drop" && (
            <ol className="mt-4 list-decimal space-y-1 ps-5 text-[13px] text-slate-600">
              {[...detail.dragDropItems]
                .sort((a, b) => (a.correctPosition ?? 0) - (b.correctPosition ?? 0))
                .map((item) => (
                  <li key={item.id}>{lang === "ar" && item.textAr ? item.textAr : item.textEn}</li>
                ))}
            </ol>
          )}

          {(detail.explanationEn || detail.explanationAr) && (
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{t.explanation}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">{lang === "ar" && detail.explanationAr ? detail.explanationAr : detail.explanationEn}</p>
            </div>
          )}

          {detail.explanationExtras && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(detail.explanationExtras.keyConceptEn || detail.explanationExtras.keyConceptAr) && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[11px] font-semibold text-indigo-600">{t.keyConcept}</p>
                  <p className="mt-1 text-[12px] text-slate-600">{lang === "ar" && detail.explanationExtras.keyConceptAr ? detail.explanationExtras.keyConceptAr : detail.explanationExtras.keyConceptEn}</p>
                </div>
              )}
              {(detail.explanationExtras.examTipEn || detail.explanationExtras.examTipAr) && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[11px] font-semibold text-emerald-600">{t.examTip}</p>
                  <p className="mt-1 text-[12px] text-slate-600">{lang === "ar" && detail.explanationExtras.examTipAr ? detail.explanationExtras.examTipAr : detail.explanationExtras.examTipEn}</p>
                </div>
              )}
              {(detail.explanationExtras.commonTrapEn || detail.explanationExtras.commonTrapAr) && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[11px] font-semibold text-amber-600">{t.commonTrap}</p>
                  <p className="mt-1 text-[12px] text-slate-600">{lang === "ar" && detail.explanationExtras.commonTrapAr ? detail.explanationExtras.commonTrapAr : detail.explanationExtras.commonTrapEn}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
