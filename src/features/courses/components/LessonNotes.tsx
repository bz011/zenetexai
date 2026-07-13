"use client";

import { useState, useTransition } from "react";
import { useLang } from "@/lib/LanguageContext";
import { saveLessonNote } from "@/features/courses/services/noteService";

interface Props {
  lessonId: string;
  initialNoteText: string;
}

/** Plain-text personal notes, one per (student, lesson). No rich text, no attachments, no sharing. */
export default function LessonNotes({ lessonId, initialNoteText }: Props) {
  const { t } = useLang();
  const n = t.courses.notes;

  const [noteText, setNoteText] = useState(initialNoteText);
  const [savedText, setSavedText] = useState(initialNoteText);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = noteText !== savedText;

  function handleSave() {
    startTransition(async () => {
      const res = await saveLessonNote(lessonId, noteText);
      if (res.success) {
        setSavedText(noteText);
        setSavedAt(Date.now());
      }
    });
  }

  return (
    <div className="card p-6">
      <p className="label">{n.title}</p>
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        rows={5}
        placeholder={n.placeholder}
        maxLength={10000}
        className="mt-3 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-slate-600 outline-none focus:border-indigo-500/60"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={handleSave} disabled={!dirty || isPending} className="btn-primary px-4 py-2 text-[13px] disabled:opacity-40">
          {isPending ? n.saving : n.save}
        </button>
        {!dirty && savedAt && <span className="text-[12px] text-slate-500">{n.saved}</span>}
      </div>
    </div>
  );
}
