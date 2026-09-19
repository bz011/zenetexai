"use client";

import { useLang } from "@/lib/LanguageContext";
import type { PublicCertificate } from "@/features/courses/services/certificateService";

interface Props {
  certificate: PublicCertificate | null;
  certificateNumber: string;
}

export default function VerifyContent({ certificate, certificateNumber }: Props) {
  const { t, lang } = useLang();
  const v = t.verify;

  const courseTitle = certificate && lang === "ar" && certificate.courseTitleAr ? certificate.courseTitleAr : certificate?.courseTitleEn;
  const issuedDate = certificate
    ? new Date(certificate.issuedAt).toLocaleDateString(lang === "ar" ? "ar" : "en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-lg">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-indigo-400">{v.academy_name}</p>
        <h1 className="mt-2 text-center text-xl font-bold text-white">{v.heading}</h1>
        <p className="mt-2 text-center text-[13px] text-slate-500">{v.sub}</p>

        <div className="card mt-8 p-8 text-center">
          {certificate ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/[0.15] text-[20px] text-emerald-400">
                ✓
              </div>
              <h2 className="mt-4 text-lg font-bold text-emerald-400">{v.valid_heading}</h2>

              <div className="mt-6 space-y-4 text-start">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{v.student_label}</p>
                  <p className="mt-1 text-[15px] font-medium text-white">{certificate.studentName}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{v.course_label}</p>
                  <p className="mt-1 text-[15px] text-white">{courseTitle}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{v.issued_label}</p>
                  <p className="mt-1 text-[15px] text-white">{issuedDate}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{v.certificate_number_label}</p>
                  <p className="mt-1 font-mono text-[15px] text-white">{certificate.certificateNumber}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/[0.12] text-[20px] text-red-400">
                ✗
              </div>
              <h2 className="mt-4 text-lg font-bold text-red-400">{v.not_found_heading}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{v.not_found_body}</p>
              <p className="mt-3 font-mono text-[12px] text-slate-600">{certificateNumber}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
