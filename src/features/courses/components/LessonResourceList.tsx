"use client";

import { useLang } from "@/lib/LanguageContext";

interface Props {
  resources: { id: string; fileName: string; fileUrl: string }[];
}

export default function LessonResourceList({ resources }: Props) {
  const { t } = useLang();
  const r = t.courses.resources;

  if (resources.length === 0) return null;

  return (
    <div className="card mt-6 p-6">
      <p className="label">{r.title}</p>
      <div className="mt-3 space-y-2">
        {resources.map((res) => (
          <a
            key={res.id}
            href={res.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <span aria-hidden>📎</span>
            {res.fileName}
          </a>
        ))}
      </div>
    </div>
  );
}
