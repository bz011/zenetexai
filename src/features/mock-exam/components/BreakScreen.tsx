"use client";

import { useEffect, useState } from "react";

interface Props {
  breakNumber: number;
  initialRemainingSeconds: number;
  onResume: () => void;
  resuming: boolean;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Full-screen break overlay. The countdown here is purely a display
 * convenience - examTimerUtils.ts's break-pause policy means the exam
 * clock accounting is already correct server-side no matter when the
 * candidate actually clicks "Resume", so there is nothing to lose by
 * letting this local timer run down to 0 and auto-resuming.
 */
export default function BreakScreen({ breakNumber, initialRemainingSeconds, onResume, resuming }: Props) {
  const [remaining, setRemaining] = useState(initialRemainingSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onResume();
      return;
    }
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onResume();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6">
      <div className="max-w-sm text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">Scheduled Break {breakNumber}</p>
        <p className="mt-4 text-5xl font-bold tabular-nums text-slate-900">{formatTime(remaining)}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
          Your exam clock is paused. Time not used on this break is returned to your exam. The exam resumes automatically when the break ends.
        </p>
        <button
          onClick={onResume}
          disabled={resuming}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {resuming ? "Resuming..." : "Resume Exam Now"}
        </button>
      </div>
    </div>
  );
}
