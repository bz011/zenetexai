/**
 * Copy for the explanatory diagrams on the marketing and product pages.
 *
 * Every statement restates something the same page (or the implemented
 * product) already says: the AI-agent diagram uses the agent behaviour
 * described on the AI Agents page (rendered by flow/GovernedFlow), and the
 * simulator loop the verified Practice Mode / mock exam / review / retake
 * features. The ML, analytics and Power BI mechanisms live in
 * lib/mechanismCopy.ts. Nothing here is a client result, a metric, or a claim
 * of scale.
 *
 * Placeholders {questions} {hours} are filled from the exam blueprint.
 */

export interface FlowStep { title: string; desc: string }
export interface FlowCopy { eyebrow: string; heading: string; sub: string; label: string; steps: FlowStep[]; note?: string }

export interface AgentCopy {
  eyebrow: string; heading: string; sub: string; label: string;
  inputs_title: string; inputs: string[];
  agent_title: string; steps: FlowStep[];
  systems_title: string; systems: string[];
  human_title: string; human: string;
  audit: string;
}

interface VisualCopy {
  agent: AgentCopy;
  simulatorLoop: FlowCopy;
}

const en: VisualCopy = {
  agent: {
    eyebrow: "The Big Picture",
    heading: "How a Production AI Agent Fits Into Your Business",
    sub: "The agent sits between the requests you receive and the systems you already use, and works inside boundaries you set.",
    label: "Diagram: incoming work goes to the AI agent, which understands, decides, acts and verifies using your approved knowledge and systems, and hands anything outside its permissions to your team.",
    inputs_title: "Incoming work",
    inputs: ["Customer messages, for example on WhatsApp", "New enquiries and booking requests", "Documents and internal requests"],
    agent_title: "The AI agent",
    steps: [
      { title: "Understand", desc: "Reads the request using your approved knowledge" },
      { title: "Decide", desc: "Applies your rules and permissions" },
      { title: "Act", desc: "Acts through approved integrations" },
      { title: "Verify", desc: "Checks the action completed correctly" },
    ],
    systems_title: "Your knowledge and systems",
    systems: ["Approved knowledge and documents", "Business systems such as your CRM and booking calendar, only where you approve access"],
    human_title: "Your team",
    human: "Anything outside the agent's permissions is handed over with full context.",
    audit: "Every decision and action is logged, so you can review what happened and why.",
  },
  simulatorLoop: {
    eyebrow: "How Preparation Works",
    heading: "Practise, Test, Review, Repeat",
    sub: "Four steps, all included with your access.",
    label: "Diagram: Practice Mode, a full mock exam, answer review, then retake and compare.",
    steps: [
      { title: "Practice Mode", desc: "Target a domain, approach or difficulty in short sessions" },
      { title: "Full mock exam", desc: "{questions} questions in {hours} hours, under exam conditions" },
      { title: "Review", desc: "Correct answers, explanations where available and a breakdown by domain" },
      { title: "Retake and compare", desc: "Repeat a finished exam with the same questions and see what changed" },
    ],
  },
};

const ar: VisualCopy = {
  agent: {
    eyebrow: "الصورة الكاملة",
    heading: "كيف يندمج وكيل الذكاء الاصطناعي الإنتاجي في عملك",
    sub: "يعمل الوكيل بين الطلبات التي تستقبلها والأنظمة التي تستخدمها بالفعل، وضمن حدود تضعها أنت.",
    label: "مخطط: يصل العمل الوارد إلى وكيل الذكاء الاصطناعي الذي يفهم ويقرر وينفذ ويتحقق باستخدام معرفتك وأنظمتك المعتمدة، ويحيل ما يخرج عن صلاحياته إلى فريقك.",
    inputs_title: "العمل الوارد",
    inputs: ["رسائل العملاء، مثل رسائل واتساب", "الاستفسارات الجديدة وطلبات الحجز", "المستندات والطلبات الداخلية"],
    agent_title: "وكيل الذكاء الاصطناعي",
    steps: [
      { title: "الفهم", desc: "يقرأ الطلب مستعيناً بمعرفتك المعتمدة" },
      { title: "القرار", desc: "يطبّق قواعدك وصلاحياتك" },
      { title: "التنفيذ", desc: "ينفّذ عبر تكاملات معتمدة" },
      { title: "التحقق", desc: "يتأكد من اكتمال الإجراء بشكل صحيح" },
    ],
    systems_title: "معرفتك وأنظمتك",
    systems: ["المعرفة والمستندات المعتمدة", "أنظمة العمل مثل نظام إدارة العملاء وتقويم الحجوزات، وفقط حيث توافق على الوصول"],
    human_title: "فريقك",
    human: "يُحال أي أمر يخرج عن صلاحيات الوكيل إلى الفريق مع السياق الكامل.",
    audit: "يُسجَّل كل قرار وإجراء، لتراجع ما حدث ولماذا.",
  },
  simulatorLoop: {
    eyebrow: "كيف يتم التحضير",
    heading: "تدرّب، اختبر، راجع، كرّر",
    sub: "أربع خطوات، وكلها مشمولة بوصولك.",
    label: "مخطط: وضع التدريب، ثم اختبار تجريبي كامل، ثم مراجعة الإجابات، ثم الإعادة والمقارنة.",
    steps: [
      { title: "وضع التدريب", desc: "استهدف مجالاً أو نهجاً أو مستوى صعوبة في جلسات قصيرة" },
      { title: "اختبار تجريبي كامل", desc: "{questions} سؤالاً في {hours} ساعات، في ظروف الاختبار" },
      { title: "المراجعة", desc: "الإجابات الصحيحة وشروح حيثما توفرت وتفصيل حسب المجال" },
      { title: "الإعادة والمقارنة", desc: "أعد اختباراً منتهياً بالأسئلة نفسها وشاهد ما تغيّر" },
    ],
  },
};

export const visualCopy = { en, ar };
