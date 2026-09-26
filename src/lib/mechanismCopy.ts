/**
 * Mechanism diagrams for the service pages (EN + AR). Each restates the process
 * ALREADY published on that page - stage wording is taken from the page's own
 * process steps, deliverables and FAQ - in the site's flow -> gate -> decision
 * language. No figures, results, clients or dashboards appear here.
 * (The AI Agents page uses the richer GovernedFlow, whose copy is visualCopy.agent.)
 */

export type MechanismKind = "analytics" | "powerBi" | "ml";

export interface MechanismCopy {
  eyebrow: string;
  heading: string;
  sub: string;
  /** Full text alternative of the diagram (aria-label). */
  label: string;
  stages: { title: string; desc: string }[];
  /** gates[i] is the control between stages[i] and stages[i + 1]. length === stages.length - 1 */
  gates: string[];
  note?: string;
}

export const mechanismCopy: Record<"en" | "ar", Record<MechanismKind, MechanismCopy>> = {
  en: {
    analytics: {
      eyebrow: "How it works",
      heading: "From Sources to Decisions",
      sub: "Analytics work turns the data you already have into agreed numbers your team can act on.",
      label: "Diagram: data sources are audited and transformed, analysed against written KPI definitions, reconciled, and turned into insight your team decides on.",
      stages: [
        { title: "Sources", desc: "Spreadsheets, system exports and reports." },
        { title: "Validation and transformation", desc: "Sources reviewed, cleaned and structured consistently." },
        { title: "Analysis and model", desc: "KPIs with written definitions everyone reads the same way." },
        { title: "Insight", desc: "Interactive views and scheduled reports." },
        { title: "Decision", desc: "Numbers your team can trust and act on." },
      ],
      gates: ["Data audited", "Definitions agreed in writing", "Figures reconciled to sources", "Refined with your team"],
      note: "An illustrative process. The exact scope is agreed before work starts.",
    },
    powerBi: {
      eyebrow: "How it works",
      heading: "From Sources to a Governed Report",
      sub: "A Power BI project settles the data model and the measures before any chart is drawn, and stays governed after publishing.",
      label: "Diagram: data sources, a semantic model, documented measures, a report, then scheduled refresh with access control and documentation.",
      stages: [
        { title: "Sources", desc: "Excel files, databases, cloud applications and APIs." },
        { title: "Semantic model", desc: "A clean model with sensible relationships." },
        { title: "Measures", desc: "Measure definitions written in DAX and documented." },
        { title: "Report", desc: "Layouts wireframed with you first, so the build matches how your team reads it." },
        { title: "Refresh and governance", desc: "Scheduled refresh, access design and row-level security where needed." },
      ],
      gates: ["Access and quality reviewed", "Definitions written down", "Reconciled to source systems", "Published and documented"],
      note: "An illustrative process. The exact scope is agreed before work starts.",
    },
    ml: {
      eyebrow: "How it works",
      heading: "Baseline First, Then a Decision",
      sub: "Before anything goes live, the model is compared with a simple baseline, so its value is measured against something real.",
      label: "Diagram: data readiness is checked, a simple baseline is set, candidate models are tested against it, evaluated on business metrics, then a validated model is integrated and monitored.",
      stages: [
        { title: "Data", desc: "We check whether the data exists, and in what condition." },
        { title: "Baseline", desc: "A simple baseline first, so any model's value has something real to be measured against." },
        { title: "Candidate models", desc: "Candidate approaches are tested against the baseline." },
        { title: "Evaluation", desc: "Metrics tied to the business outcome, not just technical accuracy." },
        { title: "Decision and monitoring", desc: "A validated model connects to the workflow that needs its output, then is monitored over time." },
      ],
      gates: ["Fit and readiness checked", "Baseline set before any model", "Compared with the baseline", "Validated before integration"],
    },
  },
  ar: {
    analytics: {
      eyebrow: "كيف يعمل",
      heading: "من المصادر إلى القرارات",
      sub: "يحوّل عمل التحليل البيانات التي تملكها إلى أرقام متفق عليها يتصرف فريقك بناءً عليها.",
      label: "مخطط: تُدقَّق مصادر البيانات وتُحوَّل، ثم تُحلَّل وفق تعريفات مكتوبة لمؤشرات الأداء، وتُطابَق الأرقام، لتصبح استنتاجات يبني عليها فريقك قراره.",
      stages: [
        { title: "المصادر", desc: "جداول بيانات وتصديرات الأنظمة والتقارير." },
        { title: "التحقق والتحويل", desc: "مراجعة المصادر وتنظيفها وهيكلتها بشكل متسق." },
        { title: "التحليل والنمذجة", desc: "مؤشرات أداء بتعريفات مكتوبة يقرؤها الجميع بالطريقة نفسها." },
        { title: "الاستنتاج", desc: "عروض تفاعلية وتقارير مجدولة." },
        { title: "القرار", desc: "أرقام يمكن لفريقك الوثوق بها والتصرف بناءً عليها." },
      ],
      gates: ["تدقيق البيانات", "تعريفات متفق عليها كتابةً", "مطابقة الأرقام مع المصادر", "تحسين مع فريقك"],
      note: "عملية توضيحية. يُتفق على النطاق الدقيق قبل بدء العمل.",
    },
    powerBi: {
      eyebrow: "كيف يعمل",
      heading: "من المصادر إلى تقرير محكوم",
      sub: "يحسم مشروع Power BI نموذج البيانات والمقاييس قبل رسم أي مخطط، ويبقى محكوماً بعد النشر.",
      label: "مخطط: مصادر البيانات، ثم نموذج بيانات، ثم مقاييس موثّقة، ثم تقرير، ثم تحديث مجدول مع ضبط الوصول والتوثيق.",
      stages: [
        { title: "المصادر", desc: "ملفات Excel وقواعد البيانات والتطبيقات السحابية وواجهات API." },
        { title: "نموذج البيانات", desc: "نموذج نظيف بعلاقات سليمة." },
        { title: "المقاييس", desc: "تعريفات المقاييس مكتوبة بلغة DAX وموثّقة." },
        { title: "التقرير", desc: "نرسم التخطيطات معك أولاً، ليتطابق البناء مع طريقة قراءة فريقك." },
        { title: "التحديث والحوكمة", desc: "تحديث مجدول وتصميم للوصول وأمان على مستوى الصفوف عند الحاجة." },
      ],
      gates: ["مراجعة الوصول والجودة", "تعريفات مكتوبة", "مطابقة الأرقام مع الأنظمة المصدرية", "نشر وتوثيق"],
      note: "عملية توضيحية. يُتفق على النطاق الدقيق قبل بدء العمل.",
    },
    ml: {
      eyebrow: "كيف يعمل",
      heading: "خط الأساس أولاً، ثم القرار",
      sub: "قبل الإطلاق، يُقارن النموذج بخط أساس بسيط، لتُقاس قيمته مقابل شيء حقيقي.",
      label: "مخطط: يُتحقق من جاهزية البيانات، ثم يوضع خط أساس بسيط، ثم تُختبر نماذج مرشحة مقابله، وتُقيَّم بمقاييس العمل، ثم يُدمج نموذج معتمد ويُراقب.",
      stages: [
        { title: "البيانات", desc: "نتحقق مما إذا كانت البيانات موجودة فعلاً، وما حالتها." },
        { title: "خط الأساس", desc: "خط أساس بسيط أولاً، ليكون لقيمة أي نموذج ما تُقاس به." },
        { title: "النماذج المرشحة", desc: "تُختبر الأساليب المرشحة مقابل خط الأساس." },
        { title: "التقييم", desc: "مقاييس مرتبطة بنتيجة العمل، لا الدقة التقنية فقط." },
        { title: "القرار والمراقبة", desc: "يُربط النموذج المعتمد بسير العمل الذي يحتاج نتائجه، ثم يُراقب مع الوقت." },
      ],
      gates: ["فحص الملاءمة والجاهزية", "خط الأساس قبل أي نموذج", "مقارنة مع خط الأساس", "اعتماد قبل التكامل"],
    },
  },
};
