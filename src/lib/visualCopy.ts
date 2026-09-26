/**
 * Copy for the explanatory diagrams on the marketing and product pages.
 *
 * Every statement restates something the same page (or the implemented
 * product) already says: the AI-agent diagram uses the agent behaviour
 * described on the AI Agents page, the ML diagram the page's own
 * "learns patterns -> prediction -> decision" and baseline explanation, the
 * analytics diagram the data-analytics process, and the simulator loop the
 * verified Practice Mode / mock exam / review / retake features. Nothing
 * here is a client result, a metric, or a claim of scale. The dashboard is
 * a layout sketch and says so.
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

export interface SketchCopy {
  eyebrow: string; heading: string; sub: string; label: string; chip: string;
  metric: string; trend: string; breakdown: string; filters: string;
}

interface VisualCopy {
  agent: AgentCopy;
  mlFlow: FlowCopy;
  analyticsFlow: FlowCopy;
  dashboardSketch: SketchCopy;
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
  mlFlow: {
    eyebrow: "How It Works",
    heading: "From Historical Data to a Business Decision",
    sub: "Machine learning learns patterns from past examples to produce a prediction or a score. A person or workflow then acts on it.",
    label: "Diagram: historical data, pattern learning, a prediction or score, then a business decision.",
    steps: [
      { title: "Historical data", desc: "Records of past outcomes, such as orders, tickets or transactions" },
      { title: "Pattern learning", desc: "A model learns what usually leads to each outcome" },
      { title: "Prediction or score", desc: "A forecast, a classification or a flag for unusual activity" },
      { title: "Business decision", desc: "Your team or workflow acts on the result" },
    ],
    note: "Before anything goes live, the model is compared with a simple baseline, so its value is measured against something real.",
  },
  analyticsFlow: {
    eyebrow: "How It Works",
    heading: "From Scattered Data to Decisions",
    sub: "Analytics work turns the data you already have into agreed numbers your team can act on.",
    label: "Diagram: your data sources, audit and modelling, agreed KPIs, then dashboards and reports that support decisions.",
    steps: [
      { title: "Your data sources", desc: "Spreadsheets, system exports and reports" },
      { title: "Audit and model", desc: "Sources reviewed, cleaned and structured consistently" },
      { title: "Agreed KPIs", desc: "Written definitions everyone reads the same way" },
      { title: "Dashboards and reports", desc: "Interactive views and scheduled reports your team uses to decide" },
    ],
    note: "An illustrative process. The exact scope is agreed before work starts.",
  },
  dashboardSketch: {
    eyebrow: "The Deliverable",
    heading: "How a Management Dashboard Is Organised",
    sub: "A layout sketch of a typical management dashboard. It shows structure only, with no real data and no client work.",
    label: "Layout sketch of a management dashboard with headline metric tiles, a trend chart, a category breakdown and filters. Structure only, no real data.",
    chip: "Layout sketch, no real data",
    metric: "Headline metric",
    trend: "Trend over time",
    breakdown: "Breakdown by category",
    filters: "Filters, for example date or region",
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
  mlFlow: {
    eyebrow: "كيف يعمل",
    heading: "من البيانات التاريخية إلى قرار العمل",
    sub: "يتعلم تعلّم الآلة الأنماط من أمثلة سابقة لينتج تنبؤاً أو درجة. ثم يتصرف شخص أو سير عمل بناءً عليها.",
    label: "مخطط: بيانات تاريخية، ثم تعلّم الأنماط، ثم تنبؤ أو درجة، ثم قرار عمل.",
    steps: [
      { title: "بيانات تاريخية", desc: "سجلات لنتائج سابقة، مثل الطلبات أو التذاكر أو المعاملات" },
      { title: "تعلّم الأنماط", desc: "يتعلم النموذج ما يؤدي عادة إلى كل نتيجة" },
      { title: "تنبؤ أو درجة", desc: "توقع أو تصنيف أو إشارة إلى نشاط غير معتاد" },
      { title: "قرار العمل", desc: "يتصرف فريقك أو سير العمل بناءً على النتيجة" },
    ],
    note: "قبل الإطلاق، يُقارن النموذج بخط أساس بسيط، لتُقاس قيمته مقابل شيء حقيقي.",
  },
  analyticsFlow: {
    eyebrow: "كيف يعمل",
    heading: "من البيانات المتفرقة إلى القرارات",
    sub: "يحوّل عمل التحليل البيانات التي تملكها إلى أرقام متفق عليها يتصرف فريقك بناءً عليها.",
    label: "مخطط: مصادر بياناتك، ثم التدقيق والنمذجة، ثم مؤشرات أداء متفق عليها، ثم لوحات معلومات وتقارير تدعم القرارات.",
    steps: [
      { title: "مصادر بياناتك", desc: "جداول بيانات وتصديرات الأنظمة والتقارير" },
      { title: "التدقيق والنمذجة", desc: "مراجعة المصادر وتنظيفها وهيكلتها بشكل متسق" },
      { title: "مؤشرات أداء متفق عليها", desc: "تعريفات مكتوبة يقرؤها الجميع بالطريقة نفسها" },
      { title: "لوحات المعلومات والتقارير", desc: "عروض تفاعلية وتقارير مجدولة يستخدمها فريقك لاتخاذ القرار" },
    ],
    note: "عملية توضيحية. يُتفق على النطاق الدقيق قبل بدء العمل.",
  },
  dashboardSketch: {
    eyebrow: "المخرج",
    heading: "كيف تُنظَّم لوحة المعلومات الإدارية",
    sub: "رسم تخطيطي لتخطيط لوحة معلومات إدارية نموذجية. يعرض البنية فقط، دون بيانات حقيقية ودون أي عمل لعميل.",
    label: "رسم تخطيطي للوحة معلومات إدارية يضم بطاقات مؤشرات رئيسية ومخطط اتجاه وتفصيلاً حسب الفئة ومرشحات. البنية فقط، دون بيانات حقيقية.",
    chip: "رسم تخطيطي، دون بيانات حقيقية",
    metric: "مؤشر رئيسي",
    trend: "الاتجاه عبر الزمن",
    breakdown: "التفصيل حسب الفئة",
    filters: "المرشحات، مثل التاريخ أو المنطقة",
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
