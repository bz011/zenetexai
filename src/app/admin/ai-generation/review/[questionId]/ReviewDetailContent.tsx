"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  setQuestionReviewStatus,
  commentOnQuestion,
  editQuestionDraft,
  type QuestionEditInput,
} from "@/features/ai-generation/services/aiGenerationAdminService";
import { regenerateQuestion, requestQuestionRepair } from "@/features/ai-generation/services/aiGenerationReviseService";

interface QualityScores {
  schema_validity: number;
  pmp_alignment: number;
  answer_defensibility: number;
  distractor_quality: number;
  scenario_originality: number;
  similarity_safety: number;
  translation_quality: number;
  metadata_consistency: number;
  ambiguity_risk: number;
  scenario_realism?: number;
  grammar_quality?: number;
  option_balance?: number;
  explanation_quality?: number;
  overall: number;
  flags: string[];
  hard_failures: string[];
  reviewer_recommendations: string[];
}

interface ReviewLogRow {
  id: string;
  action: string;
  actor: string;
  previous_status: string | null;
  new_status: string | null;
  comment: string | null;
  created_at: string;
}

interface Props {
  question: Record<string, unknown> & {
    question_id: string;
    question_text_en: string;
    question_text_ar: string;
    explanation_en: string;
    explanation_ar: string;
    status: string;
    interaction_type: string;
    notes: string | null;
  };
  options: { id: string; option_key: string; option_text_en: string; option_text_ar: string; is_correct: boolean }[];
  matchingItems: { id: string; item_id: string; side: string; text_en: string; text_ar: string }[];
  matchingCorrectRightIdByLeft: Record<string, string>;
  dragDropItems: { id: string; item_id: string; item_text_en: string; item_text_ar: string; correct_position: number | null }[];
  images: { image_id: string; image_path: string }[];
  hotspots: { hotspot_id: string; x: number; y: number; width: number; height: number }[];
  qualityScores: QualityScores | null;
  pattern: { scenario_structure: string; tested_decision: string; correct_answer_principle: string; source_question_ids: string[] } | null;
  similarityResults: { comparison_type: string; matched_question_id: string | null; similarity_score: number; threshold_result: string }[];
  reviewLog: ReviewLogRow[];
}

const SCORE_LABELS: [keyof QualityScores, string][] = [
  ["schema_validity", "Schema validity"],
  ["pmp_alignment", "PMP alignment"],
  ["answer_defensibility", "Answer defensibility"],
  ["distractor_quality", "Distractor quality"],
  ["scenario_originality", "Scenario originality"],
  ["similarity_safety", "Similarity safety"],
  ["translation_quality", "Translation quality"],
  ["metadata_consistency", "Metadata consistency"],
  ["ambiguity_risk", "Ambiguity risk (lower is better)"],
  ["scenario_realism", "Scenario realism"],
  ["grammar_quality", "Grammar quality"],
  ["option_balance", "Option balance"],
  ["explanation_quality", "Explanation quality"],
];

const ACTION_LABELS: Record<string, string> = {
  approved: "Approved",
  rejected: "Rejected",
  needs_review_reset: "Reset to needs review",
  edited: "Edited",
  regenerated: "Regenerated",
  repair_requested: "Repair requested",
  commented: "Commented",
};

export default function ReviewDetailContent({
  question,
  options,
  matchingItems,
  matchingCorrectRightIdByLeft,
  dragDropItems,
  images,
  hotspots,
  qualityScores,
  pattern,
  similarityResults,
  reviewLog,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [repairFeedback, setRepairFeedback] = useState("");
  const [commentText, setCommentText] = useState("");

  const [editing, setEditing] = useState(false);
  const [editQuestionEn, setEditQuestionEn] = useState(question.question_text_en);
  const [editQuestionAr, setEditQuestionAr] = useState(question.question_text_ar);
  const [editExplanationEn, setEditExplanationEn] = useState(question.explanation_en);
  const [editExplanationAr, setEditExplanationAr] = useState(question.explanation_ar);
  const [editOptions, setEditOptions] = useState(
    options.map((o) => ({ id: o.id, option_key: o.option_key, option_text_en: o.option_text_en, option_text_ar: o.option_text_ar, feedback_en: "", feedback_ar: "" }))
  );

  async function handleApprove() {
    setBusy(true);
    const result = await setQuestionReviewStatus(question.question_id, "approved");
    setBusy(false);
    setMessage(result.success ? "Approved. Now visible to students." : `Failed: ${result.error}`);
    router.refresh();
  }

  async function handleReject() {
    setBusy(true);
    const result = await setQuestionReviewStatus(question.question_id, "rejected", "Rejected by reviewer");
    setBusy(false);
    setMessage(result.success ? "Rejected." : `Failed: ${result.error}`);
    router.refresh();
  }

  async function handleRegenerate() {
    setBusy(true);
    setMessage("Regenerating - this calls the LLM synchronously, please wait...");
    const result = await regenerateQuestion(question.question_id);
    setBusy(false);
    setMessage(result.accepted ? "Regenerated successfully - reload to see the new content." : `Regeneration did not pass: ${"rejectionReason" in result ? result.rejectionReason : ("error" in result ? result.error : "unknown")}`);
    router.refresh();
  }

  async function handleRequestRepair() {
    if (!repairFeedback.trim()) {
      setMessage("Enter feedback describing what to fix before requesting a repair.");
      return;
    }
    setBusy(true);
    setMessage("Requesting repair - this calls the LLM synchronously, please wait...");
    const result = await requestQuestionRepair(question.question_id, repairFeedback);
    setBusy(false);
    setMessage(result.accepted ? "Repaired successfully - reload to see the revised content." : `Repair did not pass: ${"rejectionReason" in result ? result.rejectionReason : ("error" in result ? result.error : "unknown")}`);
    router.refresh();
  }

  async function handleComment() {
    if (!commentText.trim()) {
      setMessage("Enter a comment before submitting.");
      return;
    }
    setBusy(true);
    const result = await commentOnQuestion(question.question_id, commentText);
    setBusy(false);
    setMessage(result.success ? "Comment added." : `Failed: ${result.error}`);
    if (result.success) setCommentText("");
    router.refresh();
  }

  async function handleSaveEdit() {
    setBusy(true);
    const edits: QuestionEditInput = {
      question_text_en: editQuestionEn,
      question_text_ar: editQuestionAr,
      explanation_en: editExplanationEn,
      explanation_ar: editExplanationAr,
      options: editOptions.length > 0 ? editOptions.map(({ id, option_text_en, option_text_ar, feedback_en, feedback_ar }) => ({ id, option_text_en, option_text_ar, feedback_en, feedback_ar })) : undefined,
    };
    const result = await editQuestionDraft(question.question_id, edits);
    setBusy(false);
    setMessage(result.success ? "Saved. Previous version snapshotted." : `Failed: ${result.error}`);
    if (result.success) setEditing(false);
    router.refresh();
  }

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{question.question_id}</h1>
          <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[12px] font-semibold text-slate-300">{question.status}</span>
        </div>

        {qualityScores && (
          <div className="card mt-6 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-white">Quality score breakdown</p>
              <p className="text-xl font-bold text-white">{qualityScores.overall}/100</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SCORE_LABELS.filter(([key]) => qualityScores[key] !== undefined).map(([key, label]) => (
                <div key={key}>
                  <p className="text-[11px] text-slate-500">{label}</p>
                  <p className="text-[14px] font-semibold text-white">{qualityScores[key] as number}</p>
                </div>
              ))}
            </div>
            {qualityScores.flags.length > 0 && (
              <div className="mt-3 space-y-1">
                {qualityScores.flags.map((f, i) => (
                  <p key={i} className="text-[12px] text-amber-400">⚠ {f}</p>
                ))}
              </div>
            )}
            {qualityScores.reviewer_recommendations.length > 0 && (
              <div className="mt-3">
                <p className="text-[12px] font-medium text-slate-400">Reviewer recommendations:</p>
                {qualityScores.reviewer_recommendations.map((r, i) => (
                  <p key={i} className="text-[12px] text-slate-500">- {r}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {!editing ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <p className="label">English</p>
              <p className="mt-2 text-[14px] text-white">{question.question_text_en}</p>
              <p className="mt-3 text-[12px] text-slate-500">Explanation</p>
              <p className="text-[13px] text-slate-400">{question.explanation_en}</p>
            </div>
            <div className="card p-5" dir="rtl">
              <p className="label">العربية</p>
              <p className="mt-2 text-[14px] text-white">{question.question_text_ar}</p>
              <p className="mt-3 text-[12px] text-slate-500">الشرح</p>
              <p className="text-[13px] text-slate-400">{question.explanation_ar}</p>
            </div>
          </div>
        ) : (
          <div className="card mt-6 p-5">
            <p className="label">Edit question text</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12px] text-slate-500">Question (English)</label>
                <textarea value={editQuestionEn} onChange={(e) => setEditQuestionEn(e.target.value)} rows={3} className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-indigo-500/60" />
                <label className="mb-1 mt-3 block text-[12px] text-slate-500">Explanation (English)</label>
                <textarea value={editExplanationEn} onChange={(e) => setEditExplanationEn(e.target.value)} rows={3} className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-indigo-500/60" />
              </div>
              <div dir="rtl">
                <label className="mb-1 block text-[12px] text-slate-500">السؤال (عربي)</label>
                <textarea value={editQuestionAr} onChange={(e) => setEditQuestionAr(e.target.value)} rows={3} className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-indigo-500/60" />
                <label className="mb-1 mt-3 block text-[12px] text-slate-500">الشرح (عربي)</label>
                <textarea value={editExplanationAr} onChange={(e) => setEditExplanationAr(e.target.value)} rows={3} className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-indigo-500/60" />
              </div>
            </div>

            {editOptions.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="label">Options</p>
                {editOptions.map((o, i) => (
                  <div key={o.id} className="rounded-lg border border-white/[0.08] p-3">
                    <p className="text-[12px] text-slate-500">Option {o.option_key}</p>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div>
                        <input
                          value={o.option_text_en}
                          onChange={(e) => setEditOptions((prev) => prev.map((p, idx) => (idx === i ? { ...p, option_text_en: e.target.value } : p)))}
                          placeholder="Option text (English)"
                          className="w-full rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-indigo-500/60"
                        />
                        <input
                          value={o.feedback_en}
                          onChange={(e) => setEditOptions((prev) => prev.map((p, idx) => (idx === i ? { ...p, feedback_en: e.target.value } : p)))}
                          placeholder="Feedback (English)"
                          className="mt-2 w-full rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[12px] text-slate-400 outline-none focus:border-indigo-500/60"
                        />
                      </div>
                      <div dir="rtl">
                        <input
                          value={o.option_text_ar}
                          onChange={(e) => setEditOptions((prev) => prev.map((p, idx) => (idx === i ? { ...p, option_text_ar: e.target.value } : p)))}
                          placeholder="نص الخيار"
                          className="w-full rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-indigo-500/60"
                        />
                        <input
                          value={o.feedback_ar}
                          onChange={(e) => setEditOptions((prev) => prev.map((p, idx) => (idx === i ? { ...p, feedback_ar: e.target.value } : p)))}
                          placeholder="الملاحظات"
                          className="mt-2 w-full rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[12px] text-slate-400 outline-none focus:border-indigo-500/60"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-[11px] text-slate-600">
              This only edits text content (question/explanation/option wording and feedback). Option correctness, matching/drag-and-drop/hotspot content, and metadata classification require Regenerate or Request repair instead.
            </p>

            <div className="mt-4 flex gap-3">
              <button onClick={handleSaveEdit} disabled={busy} className="btn-primary px-5 py-2.5 text-[13px]">
                Save changes
              </button>
              <button onClick={() => setEditing(false)} disabled={busy} className="btn-ghost px-5 py-2.5 text-[13px]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {!editing && (
          <div className="mt-4">
            <button onClick={() => setEditing(true)} disabled={busy} className="btn-ghost px-5 py-2.5 text-[13px]">
              Edit text
            </button>
          </div>
        )}

        {options.length > 0 && (
          <div className="card mt-4 p-5">
            <p className="label">Options</p>
            <div className="mt-2 space-y-2">
              {options.map((o) => (
                <div key={o.id} className={`rounded-lg border px-3 py-2 ${o.is_correct ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-white/[0.08]"}`}>
                  <p className="text-[13px] text-white">{o.option_key}. {o.option_text_en} {o.is_correct && <span className="text-emerald-400">✓ correct</span>}</p>
                  <p className="text-[12px] text-slate-500" dir="rtl">{o.option_text_ar}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {matchingItems.length > 0 && (
          <div className="card mt-4 p-5">
            <p className="label">Matching pairs</p>
            <div className="mt-2 space-y-1 text-[13px] text-slate-300">
              {matchingItems.filter((m) => m.side === "left").map((left) => {
                const rightId = matchingCorrectRightIdByLeft[left.id];
                const right = matchingItems.find((m) => m.id === rightId);
                return (
                  <p key={left.id}>
                    {left.text_en} → {right?.text_en ?? "(unmapped)"}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {dragDropItems.length > 0 && (
          <div className="card mt-4 p-5">
            <p className="label">Drag &amp; drop order</p>
            <div className="mt-2 space-y-1 text-[13px] text-slate-300">
              {[...dragDropItems]
                .sort((a, b) => (a.correct_position ?? 0) - (b.correct_position ?? 0))
                .map((d) => (
                  <p key={d.id}>{d.correct_position}. {d.item_text_en}</p>
                ))}
            </div>
          </div>
        )}

        {hotspots.length === 0 && question.interaction_type === "hotspot" && (
          <div className="card mt-4 border-amber-500/30 p-5">
            <p className="text-[13px] text-amber-400">
              No hotspot coordinates defined yet. {question.notes?.includes("HOTSPOT BRIEF") ? "See notes below for the image/target brief." : ""}
            </p>
          </div>
        )}
        {images.length === 0 && question.interaction_type === "graphic_based" && (
          <div className="card mt-4 border-amber-500/30 p-5">
            <p className="text-[13px] text-amber-400">
              No image attached yet. {question.notes?.includes("IMAGE BRIEF") ? "See notes below for the image brief." : ""}
            </p>
          </div>
        )}

        {question.notes && (
          <div className="card mt-4 p-5">
            <p className="label">Notes</p>
            <p className="mt-2 whitespace-pre-wrap text-[12px] text-slate-500">{question.notes}</p>
          </div>
        )}

        {pattern && (
          <div className="card mt-4 p-5">
            <p className="label">Source pattern</p>
            <p className="mt-2 text-[13px] text-slate-300">{pattern.scenario_structure}</p>
            <p className="mt-1 text-[12px] text-slate-500">Tested decision: {pattern.tested_decision}</p>
            <p className="mt-1 text-[12px] text-slate-500">Correct-answer principle: {pattern.correct_answer_principle}</p>
            <p className="mt-1 text-[11px] text-slate-600">Source question IDs: {pattern.source_question_ids.join(", ")}</p>
          </div>
        )}

        {similarityResults.length > 0 && (
          <div className="card mt-4 p-5">
            <p className="label">Similarity matches</p>
            <div className="mt-2 space-y-1">
              {similarityResults.map((s, i) => (
                <p
                  key={i}
                  className={`text-[12px] ${s.threshold_result === "hard_reject" ? "text-red-400" : s.threshold_result === "warning" ? "text-amber-400" : "text-slate-500"}`}
                >
                  {s.comparison_type} vs {s.matched_question_id ?? "(same-batch draft)"}: {(s.similarity_score * 100).toFixed(1)}% ({s.threshold_result})
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="card mt-4 p-5">
          <p className="label">Review history</p>
          {reviewLog.length === 0 ? (
            <p className="mt-2 text-[12px] text-slate-600">No reviewer actions logged yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {reviewLog.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/[0.08] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-slate-300">{ACTION_LABELS[entry.action] ?? entry.action}</p>
                    <p className="text-[11px] text-slate-600">{new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">by {entry.actor}</p>
                  {entry.comment && <p className="mt-1 text-[12px] text-slate-400">{entry.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card mt-4 p-5">
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Add a comment</label>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={2}
            placeholder="Leave a note for other reviewers, without changing status."
            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none focus:border-indigo-500/60"
          />
          <button onClick={handleComment} disabled={busy} className="btn-ghost mt-3 px-5 py-2.5 text-[13px]">
            Add comment
          </button>
        </div>

        {message && <p className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] text-slate-300">{message}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleApprove} disabled={busy} className="btn-primary px-5 py-2.5 text-[13px]">
            Approve
          </button>
          <button onClick={handleReject} disabled={busy} className="btn-ghost px-5 py-2.5 text-[13px]">
            Reject
          </button>
          <button onClick={handleRegenerate} disabled={busy} className="btn-ghost px-5 py-2.5 text-[13px]">
            Regenerate (fresh attempt)
          </button>
        </div>

        <div className="card mt-4 p-5">
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Request repair (specific feedback)</label>
          <textarea
            value={repairFeedback}
            onChange={(e) => setRepairFeedback(e.target.value)}
            rows={3}
            placeholder="e.g. Distractor C is too obviously wrong - make it a more realistic mistake."
            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none focus:border-indigo-500/60"
          />
          <button onClick={handleRequestRepair} disabled={busy} className="btn-ghost mt-3 px-5 py-2.5 text-[13px]">
            Request repair
          </button>
        </div>
      </div>
    </div>
  );
}
