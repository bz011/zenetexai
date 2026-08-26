"use client";

import { useLang } from "@/lib/LanguageContext";
import { tf } from "@/lib/translations";

/**
 * Full-screen section-boundary gate (Sprint 9.1 items 3+4). Rendered
 * SYNCHRONOUSLY the instant the student finishes a section's last
 * question - before any network round trip - so the next section's
 * content can never flash underneath while startExamBreak/
 * advanceToNextSection are in flight. Both buttons disable themselves
 * while a choice is being submitted to prevent a double-click racing two
 * transitions.
 */

interface Props {
  completedSection: number;
  nextSection: number;
  breakEligible: boolean;
  breakMinutes: number;
  submitting: boolean;
  onStartBreak: () => void;
  onContinue: () => void;
}

export default function SectionCompleteScreen({ completedSection, nextSection, breakEligible, breakMinutes, submitting, onStartBreak, onContinue }: Props) {
  const { t } = useLang();
  const sc = t.assessment.sectionComplete;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6">
      <div className="max-w-sm text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">{tf(sc.sectionComplete, { n: completedSection })}</p>
        <p className="mt-4 text-2xl font-bold text-slate-900">{breakEligible ? sc.takeBreakOrContinue : tf(sc.continueToSection, { n: nextSection })}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
          {breakEligible ? tf(sc.breakBody, { n: completedSection }) : tf(sc.continueBody, { n: completedSection, next: nextSection })}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {breakEligible && (
            <button
              onClick={onStartBreak}
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? sc.pleaseWait : tf(sc.startBreak, { n: breakMinutes })}
            </button>
          )}
          <button
            onClick={onContinue}
            disabled={submitting}
            className={
              breakEligible
                ? "rounded-xl border border-slate-200 px-6 py-2.5 text-[14px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                : "rounded-xl bg-indigo-600 px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            }
          >
            {submitting ? sc.pleaseWait : breakEligible ? tf(sc.continueWithoutBreak, { n: nextSection }) : tf(sc.continueToSection, { n: nextSection })}
          </button>
        </div>
      </div>
    </div>
  );
}
