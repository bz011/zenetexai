"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createCourse, type CourseActionResult } from "@/features/courses/services/courseAdminService";

const initialState: CourseActionResult = { success: false };

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="mt-1 text-[12px] text-red-400">{messages.join(", ")}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary px-5 py-2.5 text-[13px] disabled:opacity-50">
      {pending ? "Creating..." : "Create course"}
    </button>
  );
}

export default function CreateCourseForm() {
  const [state, formAction] = useFormState(createCourse, initialState);

  return (
    <form action={formAction} className="card mt-8 space-y-4 p-6">
      <h2 className="text-[15px] font-semibold text-white">New course</h2>

      {state.error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-400">
          {state.error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input
            name="slug"
            placeholder="slug (e.g. pmp)"
            required
            className={inputCls}
            // Slugs must be lowercase (enforced server-side by the same
            // regex regardless of this) - lowercasing as the admin types
            // avoids the exact mistake that caused this bug (typing "PMP").
            onChange={(e) => {
              e.target.value = e.target.value.toLowerCase();
            }}
          />
          <FieldError messages={state.fieldErrors?.slug} />
        </div>
        <div>
          <input name="title_en" placeholder="Title (English)" required className={inputCls} />
          <FieldError messages={state.fieldErrors?.title_en} />
        </div>
        <div>
          <input name="title_ar" placeholder="Title (Arabic)" className={inputCls} />
          <FieldError messages={state.fieldErrors?.title_ar} />
        </div>
        <div>
          <input name="order_index" type="number" defaultValue={0} className={inputCls} />
          <FieldError messages={state.fieldErrors?.order_index} />
        </div>
      </div>

      <div>
        <textarea
          name="description_en"
          placeholder="Description (English)"
          rows={2}
          className={inputCls}
        />
        <FieldError messages={state.fieldErrors?.description_en} />
      </div>
      <div>
        <textarea
          name="description_ar"
          placeholder="Description (Arabic)"
          rows={2}
          className={inputCls}
        />
        <FieldError messages={state.fieldErrors?.description_ar} />
      </div>

      <label className="flex items-center gap-2 text-[13px] text-slate-400">
        <input type="checkbox" name="is_published" className="accent-indigo-500" />
        Published
      </label>

      <SubmitButton />
    </form>
  );
}
