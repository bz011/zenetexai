/**
 * Extra labels for the governed-flow diagram. The stage names, descriptions,
 * inputs, systems, human-handoff and audit sentences are NOT here: they come
 * from visualCopy.agent, the copy already published on the AI Agents page, so
 * the diagram can never say something the page does not. Only the three gate
 * captions and UI strings are new, and each names a control the AI Agents page
 * already describes (Approved Knowledge Only, Least-Privilege Tool Access /
 * Human Approval Where Required, Validation Before Action).
 */
export const flowCopy = {
  en: {
    title: "How an AI agent handles a request",
    gates: { knowledge: "Approved knowledge only", permission: "Within permissions?", result: "Result checked" },
    auditTitle: "Audit trail",
    replay: "Replay",
  },
  ar: {
    title: "كيف يتعامل وكيل الذكاء الاصطناعي مع الطلب",
    gates: { knowledge: "المعرفة المعتمدة فقط", permission: "ضمن الصلاحيات؟", result: "تم فحص النتيجة" },
    auditTitle: "سجل التدقيق",
    replay: "إعادة التشغيل",
  },
} as const;
