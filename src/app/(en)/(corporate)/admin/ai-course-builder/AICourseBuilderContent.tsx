"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCourseDraft, saveApprovedCourse } from "@/features/courses/services/aiCourseBuilderService";
import type { CourseBuilderInput, CourseBuilderModuleInput, CourseDraft } from "@/features/courses/types/course";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";
const textareaCls = `${inputCls} min-h-[70px] resize-y`;

function emptyModule(): CourseBuilderModuleInput {
  return { title_en: "", lessons: [{ title_en: "" }] };
}

export default function AICourseBuilderContent() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "review">("input");

  const [title, setTitle] = useState("");
  const [modules, setModules] = useState<CourseBuilderModuleInput[]>([emptyModule()]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [draft, setDraft] = useState<CourseDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function updateModuleTitle(mi: number, value: string) {
    setModules((prev) => prev.map((m, i) => (i === mi ? { ...m, title_en: value } : m)));
  }
  function updateLessonTitle(mi: number, li: number, value: string) {
    setModules((prev) =>
      prev.map((m, i) => (i === mi ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { title_en: value } : l)) } : m))
    );
  }
  function addModule() {
    setModules((prev) => [...prev, emptyModule()]);
  }
  function removeModule(mi: number) {
    setModules((prev) => prev.filter((_, i) => i !== mi));
  }
  function addLesson(mi: number) {
    setModules((prev) => prev.map((m, i) => (i === mi ? { ...m, lessons: [...m.lessons, { title_en: "" }] } : m)));
  }
  function removeLesson(mi: number, li: number) {
    setModules((prev) => prev.map((m, i) => (i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m)));
  }

  async function handleGenerate() {
    setGenerateError(null);
    const input: CourseBuilderInput = { title_en: title, modules };
    setGenerating(true);
    const result = await generateCourseDraft(input);
    setGenerating(false);
    if (!result.success || !result.draft) {
      setGenerateError(result.error ?? "Generation failed.");
      return;
    }
    setDraft(result.draft);
    setStep("review");
  }

  function updateDraft(patch: Partial<CourseDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }
  function updateModuleDraft(mi: number, description_en: string) {
    setDraft((prev) => (prev ? { ...prev, modules: prev.modules.map((m, i) => (i === mi ? { ...m, description_en } : m)) } : prev));
  }
  function updateLessonDraft(mi: number, li: number, patch: Partial<CourseDraft["modules"][number]["lessons"][number]>) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            modules: prev.modules.map((m, i) =>
              i === mi ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) } : m
            ),
          }
        : prev
    );
  }

  async function handleSave() {
    if (!draft) return;
    setSaveError(null);
    setSaving(true);
    const result = await saveApprovedCourse(draft);
    setSaving(false);
    if (!result.success) {
      setSaveError(result.error ?? "Save failed.");
      return;
    }
    router.push(`/admin/courses/${result.courseId}`);
  }

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-2xl">
        <span className="label">Admin</span>
        <h1 className="mt-3 text-2xl font-bold text-white">AI Course Builder</h1>
        <p className="mt-2 text-[13px] text-slate-400">
          Enter a course title and outline of module/lesson titles. The AI drafts descriptions, learning objectives, and estimated
          durations for you to review — nothing is saved or published until you approve it.
        </p>

        {step === "input" && (
          <div className="card mt-8 space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Course Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PMP Certification Prep" />
            </div>

            <div className="space-y-4">
              {modules.map((m, mi) => (
                <div key={mi} className="rounded-xl border border-white/[0.07] p-4">
                  <div className="flex items-center gap-2">
                    <input
                      className={inputCls}
                      value={m.title_en}
                      onChange={(e) => updateModuleTitle(mi, e.target.value)}
                      placeholder={`Module ${mi + 1} title`}
                    />
                    {modules.length > 1 && (
                      <button onClick={() => removeModule(mi)} className="btn-ghost shrink-0 px-3 py-2 text-[12px]">
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="mt-3 space-y-2 ps-4">
                    {m.lessons.map((l, li) => (
                      <div key={li} className="flex items-center gap-2">
                        <input
                          className={inputCls}
                          value={l.title_en}
                          onChange={(e) => updateLessonTitle(mi, li, e.target.value)}
                          placeholder={`Lesson ${mi + 1}.${li + 1} title`}
                        />
                        {m.lessons.length > 1 && (
                          <button onClick={() => removeLesson(mi, li)} className="btn-ghost shrink-0 px-3 py-2 text-[12px]">
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addLesson(mi)} className="btn-ghost px-3 py-1.5 text-[12px]">
                      + Add Lesson
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addModule} className="btn-ghost px-4 py-2 text-[13px]">
                + Add Module
              </button>
            </div>

            {generateError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-400">{generateError}</p>
            )}

            <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full py-3 text-[14px] disabled:opacity-60">
              {generating ? "Generating…" : "Generate with AI"}
            </button>
          </div>
        )}

        {step === "review" && draft && (
          <div className="card mt-8 space-y-6 p-6">
            <p className="text-[12px] font-medium text-indigo-400">Review the AI-generated draft, edit anything, then save.</p>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Slug</label>
              <input className={inputCls} value={draft.slug} onChange={(e) => updateDraft({ slug: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Course Description</label>
              <textarea className={textareaCls} value={draft.description_en} onChange={(e) => updateDraft({ description_en: e.target.value })} />
            </div>

            {draft.modules.map((m, mi) => (
              <div key={mi} className="rounded-xl border border-white/[0.07] p-4">
                <p className="text-[14px] font-semibold text-white">{m.title_en}</p>
                <textarea
                  className={`${textareaCls} mt-2`}
                  value={m.description_en}
                  onChange={(e) => updateModuleDraft(mi, e.target.value)}
                />

                <div className="mt-4 space-y-4 ps-4">
                  {m.lessons.map((l, li) => (
                    <div key={li} className="border-t border-white/[0.06] pt-3">
                      <p className="text-[13px] font-medium text-slate-300">{l.title_en}</p>
                      <textarea
                        className={`${textareaCls} mt-2`}
                        value={l.description_en}
                        onChange={(e) => updateLessonDraft(mi, li, { description_en: e.target.value })}
                      />
                      <label className="mt-2 mb-1 block text-[12px] text-slate-500">Learning objectives (one per line)</label>
                      <textarea
                        className={textareaCls}
                        value={l.learning_objectives_en.join("\n")}
                        onChange={(e) => updateLessonDraft(mi, li, { learning_objectives_en: e.target.value.split("\n") })}
                      />
                      <label className="mt-2 mb-1 block text-[12px] text-slate-500">Estimated duration (minutes)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={l.duration_minutes}
                        onChange={(e) => updateLessonDraft(mi, li, { duration_minutes: Number(e.target.value) || 0 })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {saveError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-400">{saveError}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("input")} className="btn-ghost flex-1 py-3 text-[14px]">
                Back
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-3 text-[14px] disabled:opacity-60">
                {saving ? "Saving…" : "Save as Draft Course"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
