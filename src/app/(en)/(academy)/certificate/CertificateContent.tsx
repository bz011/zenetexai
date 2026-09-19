"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { updateNameForCertificate } from "@/features/courses/services/certificateActions";
import type { IssuanceResult } from "@/features/courses/services/certificateService";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

interface Props {
  result: IssuanceResult;
  courseTitleEn: string;
  courseTitleAr: string | null;
  initialFirstName: string;
  initialLastName: string;
}

export default function CertificateContent({ result, courseTitleEn, courseTitleAr, initialFirstName, initialLastName }: Props) {
  const { t, lang } = useLang();
  const c = t.certificate;
  const router = useRouter();

  const courseTitle = lang === "ar" && courseTitleAr ? courseTitleAr : courseTitleEn;

  if (result.status === "not_eligible") {
    return (
      <div className="relative min-h-screen px-6 py-24">
        <div className="container-page relative max-w-lg">
          <div className="card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/[0.12] text-[20px]">
              🎓
            </div>
            <h1 className="mt-5 text-xl font-bold text-white">{c.not_eligible_heading}</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{c.not_eligible_body}</p>
            <Link href="/dashboard" className="btn-primary mt-6 inline-flex px-5 py-2.5 text-[13px]">
              {c.back_to_dashboard}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === "missing_name") {
    return <MissingNameForm heading={c.missing_name_heading} body={c.missing_name_body} initialFirstName={initialFirstName} initialLastName={initialLastName} labels={c} onSaved={() => router.refresh()} />;
  }

  const { certificate } = result;
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString(lang === "ar" ? "ar" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <div className="card border-2 border-indigo-500/20 p-8 text-center sm:p-12">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-indigo-400">{c.academy_name}</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{c.heading}</h1>

          <div className="mx-auto mt-8 h-px w-24 bg-white/10" />

          <p className="mt-8 text-[13px] text-slate-400">{c.certifies_that}</p>
          <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{certificate.studentName}</p>
          <p className="mt-4 text-[14px] leading-relaxed text-slate-300">
            {c.has_completed} <span className="font-semibold text-white">{courseTitle}</span> {c.offered_by}
          </p>

          <div className="mx-auto mt-8 h-px w-24 bg-white/10" />

          <div className="mt-8 grid grid-cols-1 gap-4 text-start sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{c.issued_on_label}</p>
              <p className="mt-1 text-[14px] text-white">{issuedDate}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{c.certificate_number_label}</p>
              <p className="mt-1 font-mono text-[14px] text-white">{certificate.certificateNumber}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{c.instructor_label}</p>
              <p className="mt-1 text-[14px] text-white">{c.instructor_name}</p>
              <p className="text-[12px] text-slate-500">{c.instructor_role}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href={`/api/certificates/${certificate.id}/pdf`} className="btn-primary px-5 py-2.5 text-[13px]">
              {c.download_pdf}
            </a>
            <Link href={`/verify/${certificate.certificateNumber}`} className="btn-ghost px-5 py-2.5 text-[13px]">
              {c.view_verification}
            </Link>
          </div>

          <p className="mx-auto mt-8 max-w-lg text-[11px] leading-relaxed text-slate-600">{c.disclaimer}</p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-[12px] text-slate-500 hover:text-slate-300">
            {c.back_to_dashboard}
          </Link>
        </div>
      </div>
    </div>
  );
}

function MissingNameForm({
  heading,
  body,
  initialFirstName,
  initialLastName,
  labels,
  onSaved,
}: {
  heading: string;
  body: string;
  initialFirstName: string;
  initialLastName: string;
  labels: { first_name_label: string; last_name_label: string; name_save: string; name_saving: string; name_error: string };
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError(labels.name_error);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateNameForCertificate(firstName, lastName);
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? labels.name_error);
      return;
    }
    onSaved();
  }

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-md">
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/[0.12] text-[20px]">
            ✍️
          </div>
          <h1 className="mt-5 text-xl font-bold text-white">{heading}</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{body}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-start">
            <div>
              <label className="text-[12px] text-slate-400">{labels.first_name_label}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`mt-1 ${inputCls}`}
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="text-[12px] text-slate-400">{labels.last_name_label}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`mt-1 ${inputCls}`}
                maxLength={100}
                required
              />
            </div>
            {error && <p className="text-[12px] text-red-400">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary w-full py-2.5 text-[13px] disabled:opacity-50">
              {saving ? labels.name_saving : labels.name_save}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
