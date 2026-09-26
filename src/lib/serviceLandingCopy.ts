/**
 * Copy for the Data Analytics and Power BI service landing pages (SEO growth
 * sprint). Kept in its own module - same {en, ar} shape as the rest of the
 * translation tree, wired into translations.ts - so the two pages can share
 * one rendering component (components/ServiceLandingContent.tsx).
 *
 * Content rules: describes deliverables, illustrative use cases, and process
 * only. No completed-client claims, no partnerships/certifications, no
 * prices, no invented timelines or statistics.
 */

interface Item { title: string; desc: string }
interface Step { step: string; title: string; desc: string }
interface Faq { q: string; a: string }
interface RelatedLink { title: string; desc: string; href: string }

export interface ServiceLandingCopy {
  hero_eyebrow: string; hero_h1: string; hero_sub: string; hero_cta1: string; hero_cta2: string;
  audience_eyebrow: string; audience_h2: string; audience_sub: string;
  audience: Item[];
  deliverables_eyebrow: string; deliverables_h2: string; deliverables_sub: string;
  deliverables: Item[];
  usecases_eyebrow: string; usecases_h2: string; usecases_sub: string;
  usecases: Item[];
  process_eyebrow: string; process_h2: string; process_sub: string;
  process: Step[];
  related_eyebrow: string; related_h2: string;
  related: RelatedLink[];
  faq_eyebrow: string; faq_h2: string;
  faq: Faq[];
  cta_h2: string; cta_sub: string; cta_btn: string;
}

// ─── Data Analytics ─────────────────────────────────────────────────────────

const dataAnalyticsEn: ServiceLandingCopy = {
  hero_eyebrow: "Data Analytics",
  hero_h1: "Data Analytics Services for UAE Businesses",
  hero_sub:
    "Turn scattered spreadsheets, systems, and reports into numbers your team trusts and can act on — KPI frameworks, clean data models, and dashboards built around how your business actually runs.",
  hero_cta1: "Discuss Your Data",
  hero_cta2: "See Deliverables",

  audience_eyebrow: "Who It's For",
  audience_h2: "Data Analytics for SMEs and Growing Teams",
  audience_sub: "Useful when the data exists, but nobody can turn it into a reliable answer quickly.",
  audience: [
    { title: "Businesses Running on Spreadsheets", desc: "Growing companies whose reporting lives in Excel files, system exports, and manual copy-paste — and who want one dependable view without building an in-house data team." },
    { title: "Leadership Without a Single Source of Truth", desc: "Managers who get different numbers from sales, finance, and operations, and need agreed definitions for revenue, margin, utilisation, or churn." },
    { title: "Operations and Service Businesses", desc: "Teams that need to see bookings, turnaround times, throughput, or backlog while it is still actionable, not weeks after the month closes." },
    { title: "Businesses Preparing for AI or Automation", desc: "Organisations that know reliable data is the foundation for forecasting, AI agents, or automation, and want that foundation right first." },
  ],

  deliverables_eyebrow: "Deliverables",
  deliverables_h2: "What You Actually Receive",
  deliverables_sub: "Every engagement is scoped around a small number of concrete outputs, agreed before work starts.",
  deliverables: [
    { title: "KPI & Metrics Framework", desc: "A short, agreed list of metrics with written definitions, owners, and calculation rules, so everyone reads the same number the same way." },
    { title: "Data Audit & Source Map", desc: "A written map of where your data lives, its quality and gaps, and which sources should feed reporting." },
    { title: "Cleaned & Modelled Data", desc: "Consistently structured data, with the relationships between customers, orders, projects, or transactions defined once and reused everywhere." },
    { title: "Dashboards & Reports", desc: "Interactive dashboards and scheduled reports for leadership and operations, built in the business intelligence tool that fits your stack (see our Power BI consulting page)." },
    { title: "Reporting Automation", desc: "Replacing manual month-end report assembly with refreshed, repeatable data flows — where the effort is actually justified." },
    { title: "Handover & Documentation", desc: "Documentation and a walkthrough, so your team can read, question, and maintain what was built." },
  ],

  usecases_eyebrow: "Typical Business Use Cases",
  usecases_h2: "Where Analytics Pays Off",
  usecases_sub: "Illustrative examples of the problems analytics work is well suited to — not completed ZentexAI client projects.",
  usecases: [
    { title: "Sales & Pipeline Reporting", desc: "One view of leads, conversion, and revenue by source, product, or salesperson, replacing several conflicting spreadsheets." },
    { title: "Finance & Margin Visibility", desc: "Management reporting on revenue, cost, and margin by service line or project, on a consistent monthly basis." },
    { title: "Operations & Service Performance", desc: "Tracking volumes, delays, and utilisation so bottlenecks are visible while there is still time to act." },
    { title: "Customer & Retention Analysis", desc: "Understanding repeat business, churn signals, and customer segments using the data you already collect." },
  ],

  process_eyebrow: "Engagement Process",
  process_h2: "From Business Question to Working Dashboard",
  process_sub: "A practical sequence that keeps the work tied to real decisions rather than to technology.",
  process: [
    { step: "01", title: "Business Questions", desc: "We start with the decisions you need to make and the questions leadership keeps asking." },
    { step: "02", title: "Data Audit", desc: "We review the sources, quality, and gaps, and tell you plainly what is and is not usable." },
    { step: "03", title: "Metric Definitions", desc: "We agree on written definitions for each KPI before any dashboard is designed." },
    { step: "04", title: "Model & Build", desc: "We structure the data and build the reports and dashboards against the agreed definitions." },
    { step: "05", title: "Validate", desc: "We reconcile the figures against source systems with your team, so the numbers can be trusted." },
    { step: "06", title: "Handover & Iterate", desc: "We document and hand over, then refine based on how the team actually uses the reports." },
  ],

  related_eyebrow: "Related",
  related_h2: "Related Services and Reading",
  related: [
    { title: "Power BI Consulting UAE", desc: "Dashboards, data models, and rollout in Microsoft Power BI.", href: "/services/power-bi-consulting-uae" },
    { title: "Machine Learning Services UAE", desc: "Forecasting and prediction once your data foundation is reliable.", href: "/services/machine-learning-uae" },
    { title: "AI Agents & Automation UAE", desc: "Automating the workflows your reports point to.", href: "/services/ai-agents-automation-uae" },
    { title: "ZentexAI Blog", desc: "Practical articles on AI, automation, and delivery.", href: "/blog" },
  ],

  faq_eyebrow: "FAQ",
  faq_h2: "Common Questions",
  faq: [
    { q: "What are data analytics services?", a: "Data analytics services help a business collect, clean, structure, and interpret its data so decisions rest on reliable numbers. In practice that usually means agreeing the key metrics, tidying the data behind them, and presenting the results in dashboards or reports people actually use." },
    { q: "What is the difference between data analytics and business intelligence?", a: "Business intelligence usually refers to the ongoing reporting layer — dashboards and recurring reports on what is happening. Data analytics is broader and also covers investigating why something happened and what is likely to happen next. Most engagements start with the BI layer, because reliable reporting is the foundation for everything else." },
    { q: "Is data analytics realistic for a small or medium business?", a: "Yes, if it is scoped sensibly. A small business rarely needs a data warehouse; it often needs agreed metrics, cleaner source data, and one or two dashboards. We recommend the smallest setup that answers your actual questions." },
    { q: "What do you need from us to start?", a: "A clear description of the decisions you want to improve, access to a representative sample of the relevant data or reports, and someone on your side who can confirm what the numbers should mean. We review data access and confidentiality with you before anything is shared." },
    { q: "Do you work with businesses in Dubai and across the UAE?", a: "ZentexAI's services are designed for businesses across the UAE and the wider MENA region, including Dubai and Abu Dhabi. Get in touch with your location and requirements and we will confirm how an engagement would work." },
  ],

  cta_h2: "Ready to Get Clear Numbers?",
  cta_sub: "Tell us which decisions your data should support — we will give you an honest view of what is realistic and what to do first.",
  cta_btn: "Discuss Your Data",
};

const dataAnalyticsAr: ServiceLandingCopy = {
  hero_eyebrow: "تحليل البيانات",
  hero_h1: "خدمات تحليل البيانات للشركات في دولة الإمارات",
  hero_sub:
    "حوّل جداول البيانات والأنظمة والتقارير المتفرقة إلى أرقام يثق بها فريقك ويتصرف بناءً عليها — أُطر مؤشرات الأداء، ونماذج بيانات منظمة، ولوحات معلومات مبنية حول طريقة عمل شركتك الفعلية.",
  hero_cta1: "ناقش بياناتك",
  hero_cta2: "اطّلع على المخرجات",

  audience_eyebrow: "لمن هذه الخدمة",
  audience_h2: "تحليل البيانات للشركات الصغيرة والمتوسطة والفرق النامية",
  audience_sub: "مفيدة عندما تكون البيانات موجودة، لكن لا أحد يستطيع تحويلها إلى إجابة موثوقة بسرعة.",
  audience: [
    { title: "شركات تعتمد على جداول البيانات", desc: "شركات نامية تعيش تقاريرها في ملفات إكسل وتصديرات الأنظمة والنسخ اليدوي، وتريد رؤية واحدة موثوقة دون بناء فريق بيانات داخلي." },
    { title: "إدارة بلا مصدر موحّد للحقيقة", desc: "مديرون يحصلون على أرقام مختلفة من المبيعات والمالية والعمليات، ويحتاجون إلى تعريفات متفق عليها للإيرادات والهامش والاستغلال ومعدل فقدان العملاء." },
    { title: "شركات العمليات والخدمات", desc: "فرق تحتاج إلى رؤية الحجوزات وأزمنة التنفيذ والإنتاجية والمتأخرات وهي لا تزال قابلة للتصرف، لا بعد أسابيع من إغلاق الشهر." },
    { title: "شركات تستعد للذكاء الاصطناعي أو الأتمتة", desc: "مؤسسات تدرك أن البيانات الموثوقة هي أساس التنبؤ ووكلاء الذكاء الاصطناعي والأتمتة، وتريد إرساء هذا الأساس أولاً." },
  ],

  deliverables_eyebrow: "المخرجات",
  deliverables_h2: "ما الذي تستلمه فعلياً",
  deliverables_sub: "يُحدَّد نطاق كل مشروع حول عدد قليل من المخرجات الملموسة المتفق عليها قبل بدء العمل.",
  deliverables: [
    { title: "إطار مؤشرات الأداء والمقاييس", desc: "قائمة قصيرة متفق عليها من المقاييس بتعريفات مكتوبة وأصحاب مسؤولية وقواعد حساب، ليقرأ الجميع الرقم نفسه بالطريقة نفسها." },
    { title: "تدقيق البيانات وخريطة المصادر", desc: "خريطة مكتوبة لأماكن وجود بياناتك وجودتها وفجواتها، والمصادر التي ينبغي أن تغذي التقارير." },
    { title: "بيانات منظفة ومنمذجة", desc: "بيانات منظمة بشكل متسق، مع تعريف العلاقات بين العملاء والطلبات والمشاريع والمعاملات مرة واحدة واستخدامها في كل مكان." },
    { title: "لوحات المعلومات والتقارير", desc: "لوحات معلومات تفاعلية وتقارير مجدولة للإدارة والعمليات، مبنية على أداة ذكاء الأعمال المناسبة لبنيتك التقنية (راجع صفحة استشارات Power BI)." },
    { title: "أتمتة التقارير", desc: "استبدال تجميع تقارير نهاية الشهر يدوياً بتدفقات بيانات متجددة وقابلة للتكرار — حيث يكون الجهد مبرراً فعلاً." },
    { title: "التسليم والتوثيق", desc: "توثيق وشرح تفصيلي، ليتمكن فريقك من قراءة ما بُني ومساءلته وصيانته." },
  ],

  usecases_eyebrow: "حالات استخدام تجارية نموذجية",
  usecases_h2: "أين يحقق التحليل قيمة",
  usecases_sub: "أمثلة توضيحية على المشكلات التي يناسبها عمل التحليل — وليست مشاريع فعلية منجزة لعملاء ZentexAI.",
  usecases: [
    { title: "تقارير المبيعات وخط الفرص", desc: "رؤية واحدة للعملاء المحتملين والتحويل والإيرادات حسب المصدر أو المنتج أو مندوب المبيعات، بدلاً من عدة جداول متعارضة." },
    { title: "الرؤية المالية والهامش", desc: "تقارير إدارية عن الإيرادات والتكلفة والهامش حسب خط الخدمة أو المشروع، بشكل شهري متسق." },
    { title: "أداء العمليات والخدمة", desc: "متابعة الأحجام والتأخيرات والاستغلال لتظهر الاختناقات بينما لا يزال هناك وقت للتصرف." },
    { title: "تحليل العملاء والاحتفاظ بهم", desc: "فهم تكرار الشراء وإشارات فقدان العملاء وشرائح العملاء باستخدام البيانات التي تجمعها بالفعل." },
  ],

  process_eyebrow: "مراحل العمل",
  process_h2: "من سؤال العمل إلى لوحة معلومات تعمل",
  process_sub: "تسلسل عملي يربط العمل بقرارات حقيقية لا بالتقنية.",
  process: [
    { step: "01", title: "أسئلة العمل", desc: "نبدأ بالقرارات التي تحتاج إلى اتخاذها والأسئلة التي تكررها الإدارة." },
    { step: "02", title: "تدقيق البيانات", desc: "نراجع المصادر والجودة والفجوات، ونخبرك بوضوح بما هو قابل للاستخدام وما ليس كذلك." },
    { step: "03", title: "تعريف المقاييس", desc: "نتفق على تعريفات مكتوبة لكل مؤشر قبل تصميم أي لوحة معلومات." },
    { step: "04", title: "النمذجة والبناء", desc: "ننظم البيانات ونبني التقارير ولوحات المعلومات وفق التعريفات المتفق عليها." },
    { step: "05", title: "التحقق", desc: "نطابق الأرقام مع الأنظمة المصدرية مع فريقك، ليمكن الوثوق بها." },
    { step: "06", title: "التسليم والتحسين", desc: "نوثّق ونسلّم، ثم نحسّن بناءً على طريقة استخدام الفريق للتقارير فعلياً." },
  ],

  related_eyebrow: "ذات صلة",
  related_h2: "خدمات ومقالات ذات صلة",
  related: [
    { title: "استشارات Power BI في الإمارات", desc: "لوحات المعلومات ونماذج البيانات والنشر في Microsoft Power BI.", href: "/services/power-bi-consulting-uae" },
    { title: "خدمات تعلّم الآلة في الإمارات", desc: "التنبؤ والتوقع بعد أن يصبح أساس بياناتك موثوقاً.", href: "/services/machine-learning-uae" },
    { title: "وكلاء الذكاء الاصطناعي والأتمتة في الإمارات", desc: "أتمتة سير العمل الذي تشير إليه تقاريرك.", href: "/services/ai-agents-automation-uae" },
    { title: "مدونة ZentexAI", desc: "مقالات عملية عن الذكاء الاصطناعي والأتمتة والتنفيذ.", href: "/blog" },
  ],

  faq_eyebrow: "الأسئلة الشائعة",
  faq_h2: "أسئلة متكررة",
  faq: [
    { q: "ما هي خدمات تحليل البيانات؟", a: "تساعد خدمات تحليل البيانات الشركة على جمع بياناتها وتنظيفها وهيكلتها وتفسيرها لتستند القرارات إلى أرقام موثوقة. عملياً يعني ذلك عادة الاتفاق على المقاييس الرئيسية، وتنظيف البيانات الكامنة وراءها، وعرض النتائج في لوحات معلومات أو تقارير يستخدمها الناس فعلاً." },
    { q: "ما الفرق بين تحليل البيانات وذكاء الأعمال؟", a: "يشير ذكاء الأعمال عادة إلى طبقة التقارير المستمرة — لوحات المعلومات والتقارير الدورية عن ما يحدث. أما تحليل البيانات فهو أوسع، ويشمل أيضاً البحث في سبب حدوث أمر ما وما يُحتمل حدوثه لاحقاً. تبدأ معظم المشاريع بطبقة ذكاء الأعمال لأن التقارير الموثوقة هي أساس كل شيء آخر." },
    { q: "هل تحليل البيانات واقعي للشركات الصغيرة والمتوسطة؟", a: "نعم، إذا حُدد نطاقه بشكل معقول. نادراً ما تحتاج الشركة الصغيرة إلى مستودع بيانات؛ وغالباً ما تحتاج إلى مقاييس متفق عليها وبيانات مصدرية أنظف ولوحة أو لوحتين. نوصي بأصغر إعداد يجيب عن أسئلتك الفعلية." },
    { q: "ماذا تحتاجون منا للبدء؟", a: "وصف واضح للقرارات التي تريد تحسينها، وإمكانية الوصول إلى عينة ممثلة من البيانات أو التقارير ذات الصلة، وشخص من جانبكم يمكنه تأكيد ما ينبغي أن تعنيه الأرقام. نراجع معكم آلية الوصول إلى البيانات والسرية قبل مشاركة أي شيء." },
    { q: "هل تعملون مع شركات في دبي وعموم الإمارات؟", a: "خدمات ZentexAI مصممة للشركات في عموم دولة الإمارات ومنطقة الشرق الأوسط وشمال أفريقيا، بما في ذلك دبي وأبوظبي. تواصل معنا مع موقعك ومتطلباتك وسنؤكد كيف سيتم العمل." },
  ],

  cta_h2: "هل أنت مستعد للحصول على أرقام واضحة؟",
  cta_sub: "أخبرنا بالقرارات التي ينبغي أن تدعمها بياناتك — وسنعطيك رأياً صادقاً حول ما هو واقعي وما ينبغي البدء به.",
  cta_btn: "ناقش بياناتك",
};

// ─── Power BI ───────────────────────────────────────────────────────────────

const powerBiEn: ServiceLandingCopy = {
  hero_eyebrow: "Power BI Consulting",
  hero_h1: "Power BI Consulting & Dashboards for UAE Businesses",
  hero_sub:
    "Design, build, and roll out Power BI dashboards and data models that leadership actually uses — from a first management dashboard to a well-governed reporting setup.",
  hero_cta1: "Discuss Your Dashboard",
  hero_cta2: "See Deliverables",

  audience_eyebrow: "Who It's For",
  audience_h2: "Teams Moving to, or Fixing, Power BI",
  audience_sub: "Power BI is only as useful as the model and the questions behind it.",
  audience: [
    { title: "Teams Moving from Excel to Power BI", desc: "Businesses whose monthly reporting is assembled by hand in spreadsheets and who want it refreshed, interactive, and consistent." },
    { title: "Businesses with Dashboards Nobody Trusts", desc: "Organisations with existing Power BI reports that are slow, confusing, or disagree with finance — and need them reviewed and repaired." },
    { title: "Leaders Who Need a Management View", desc: "Owners and managers who want one clear dashboard for sales, operations, or projects instead of chasing several reports." },
    { title: "PMOs and Project-Driven Teams", desc: "Teams that need consistent reporting on project status, schedule, and budget variance across a portfolio." },
  ],

  deliverables_eyebrow: "Deliverables",
  deliverables_h2: "What a Power BI Engagement Delivers",
  deliverables_sub: "Concrete outputs, agreed up front, so you know what you are getting before work begins.",
  deliverables: [
    { title: "Management & Executive Dashboards", desc: "Focused dashboards designed around the decisions of the people who use them, wireframed with you before anything is built." },
    { title: "Data Model", desc: "A clean model with sensible relationships and documented measures (written in DAX), so numbers stay consistent as reports grow." },
    { title: "Data Connections & Scheduled Refresh", desc: "Connections to sources such as Excel, databases, and cloud applications, with automated refresh — including a gateway where data sits on-premises." },
    { title: "Access & Sharing Design", desc: "How reports are published and shared, and row-level security where different users must see different data." },
    { title: "Review & Optimisation of Existing Reports", desc: "An assessment of current Power BI reports for performance, clarity, and model problems, with a prioritised list of fixes." },
    { title: "Training & Handover", desc: "A walkthrough and documentation so your team can maintain and extend what was built." },
  ],

  usecases_eyebrow: "Typical Business Use Cases",
  usecases_h2: "Power BI Dashboards in Practice",
  usecases_sub: "Illustrative examples of dashboards businesses commonly need — not completed ZentexAI client projects.",
  usecases: [
    { title: "Sales Performance Dashboard", desc: "Pipeline, conversion, and revenue by product, region, or salesperson, refreshed automatically." },
    { title: "Finance & Management Pack", desc: "Revenue, cost, and margin views that replace a manually assembled monthly pack." },
    { title: "Operations & Service KPIs", desc: "Volumes, turnaround times, backlog, and utilisation in one place." },
    { title: "Project & PMO Reporting", desc: "Portfolio status, schedule, and budget variance reporting across projects." },
  ],

  process_eyebrow: "Engagement Process",
  process_h2: "How a Power BI Project Runs",
  process_sub: "A structured sequence that keeps the dashboard tied to real decisions and verifiable numbers.",
  process: [
    { step: "01", title: "Scope & Audience", desc: "We agree who will use the dashboard and which decisions it must support." },
    { step: "02", title: "Data Access & Review", desc: "We review the sources, access, and data quality before design starts." },
    { step: "03", title: "Model Design", desc: "We design the data model and measure definitions the dashboard will rely on." },
    { step: "04", title: "Dashboard Design", desc: "We wireframe layouts with you first, so the build matches how the team will read it." },
    { step: "05", title: "Build & Validate", desc: "We build, then reconcile figures against source systems with your team." },
    { step: "06", title: "Publish & Hand Over", desc: "We publish, set up refresh and access, train your team, and document the model." },
  ],

  related_eyebrow: "Related",
  related_h2: "Related Services and Reading",
  related: [
    { title: "Data Analytics Services UAE", desc: "KPI frameworks, data audits, and reporting beyond a single tool.", href: "/services/data-analytics-uae" },
    { title: "Machine Learning Services UAE", desc: "Forecasting and predictive analytics on a reliable data foundation.", href: "/services/machine-learning-uae" },
    { title: "AI Agents & Automation UAE", desc: "Automating the workflows your dashboards highlight.", href: "/services/ai-agents-automation-uae" },
    { title: "Project Management Consulting", desc: "PMO setup and project delivery support.", href: "/services#pm-consulting" },
  ],

  faq_eyebrow: "FAQ",
  faq_h2: "Common Questions",
  faq: [
    { q: "What does Power BI consulting include?", a: "Typically: agreeing what the dashboard must answer, reviewing and connecting your data, designing the data model and measures, building and validating the reports, setting up refresh and sharing, and training your team. Reviews and repairs of existing reports are also common." },
    { q: "Do we need Power BI Pro or Premium licences?", a: "It depends on how many people view and share reports and where they are published. Microsoft's licensing changes over time, so we check what your setup needs against Microsoft's current licensing documentation before you buy anything." },
    { q: "Can you improve dashboards we already have?", a: "Yes. A review looks at report performance, clarity, and the underlying data model, and produces a prioritised list of fixes. Often the biggest gains come from correcting the model rather than redesigning the visuals." },
    { q: "Can Power BI connect to our existing systems?", a: "Power BI supports many sources, including Excel files, SQL databases, cloud applications, and APIs. Which connections are practical for you depends on your systems and access, which we check during scoping." },
    { q: "Do you provide Power BI dashboards for businesses in Dubai?", a: "ZentexAI serves businesses across the UAE, including Dubai and Abu Dhabi. Share your requirements through the contact page and we will confirm how the engagement would run." },
    { q: "Is ZentexAI affiliated with Microsoft?", a: "No. Power BI is a Microsoft product. ZentexAI is an independent consultancy, and this page does not imply partnership with, or endorsement by, Microsoft." },
  ],

  cta_h2: "Need a Power BI Dashboard That Works?",
  cta_sub: "Describe the reports you rely on today and the decisions they should support — we will tell you what a sensible first step looks like.",
  cta_btn: "Discuss Your Dashboard",
};

const powerBiAr: ServiceLandingCopy = {
  hero_eyebrow: "استشارات Power BI",
  hero_h1: "استشارات ولوحات معلومات Power BI للشركات في دولة الإمارات",
  hero_sub:
    "تصميم وبناء ونشر لوحات معلومات ونماذج بيانات Power BI تستخدمها الإدارة فعلاً — من أول لوحة إدارية إلى منظومة تقارير محكومة جيداً.",
  hero_cta1: "ناقش لوحة المعلومات",
  hero_cta2: "اطّلع على المخرجات",

  audience_eyebrow: "لمن هذه الخدمة",
  audience_h2: "فرق تنتقل إلى Power BI أو تصلح ما لديها",
  audience_sub: "لا تكون Power BI مفيدة إلا بقدر جودة النموذج والأسئلة التي تقف وراءه.",
  audience: [
    { title: "فرق تنتقل من إكسل إلى Power BI", desc: "شركات تُجمَّع تقاريرها الشهرية يدوياً في جداول بيانات، وتريدها متجددة وتفاعلية ومتسقة." },
    { title: "شركات لديها لوحات معلومات لا يثق بها أحد", desc: "مؤسسات لديها تقارير Power BI بطيئة أو مربكة أو لا تتفق مع المالية — وتحتاج إلى مراجعتها وإصلاحها." },
    { title: "قادة يحتاجون إلى رؤية إدارية", desc: "ملاك ومديرون يريدون لوحة واضحة واحدة للمبيعات أو العمليات أو المشاريع بدلاً من ملاحقة عدة تقارير." },
    { title: "مكاتب إدارة المشاريع والفرق القائمة على المشاريع", desc: "فرق تحتاج إلى تقارير متسقة عن حالة المشاريع والجدول الزمني وانحراف الميزانية عبر محفظة المشاريع." },
  ],

  deliverables_eyebrow: "المخرجات",
  deliverables_h2: "ما يقدمه مشروع Power BI",
  deliverables_sub: "مخرجات ملموسة متفق عليها مسبقاً، لتعرف ما ستحصل عليه قبل بدء العمل.",
  deliverables: [
    { title: "لوحات المعلومات الإدارية والتنفيذية", desc: "لوحات مركّزة مصممة حول قرارات من يستخدمونها، ترسم معك مخططاً أولياً قبل بناء أي شيء." },
    { title: "نموذج البيانات", desc: "نموذج نظيف بعلاقات منطقية ومقاييس موثقة (مكتوبة بلغة DAX)، لتبقى الأرقام متسقة مع نمو التقارير." },
    { title: "الاتصال بالبيانات والتحديث المجدول", desc: "اتصال بمصادر مثل ملفات إكسل وقواعد البيانات والتطبيقات السحابية، مع تحديث تلقائي — بما في ذلك بوابة عندما تكون البيانات داخل مقر الشركة." },
    { title: "تصميم الوصول والمشاركة", desc: "كيفية نشر التقارير ومشاركتها، وأمان على مستوى الصفوف حيث يجب أن يرى المستخدمون المختلفون بيانات مختلفة." },
    { title: "مراجعة وتحسين التقارير الحالية", desc: "تقييم لتقارير Power BI الحالية من حيث الأداء والوضوح ومشكلات النموذج، مع قائمة مرتبة الأولوية بالإصلاحات." },
    { title: "التدريب والتسليم", desc: "شرح تفصيلي وتوثيق ليتمكن فريقك من صيانة ما بُني وتوسيعه." },
  ],

  usecases_eyebrow: "حالات استخدام تجارية نموذجية",
  usecases_h2: "لوحات Power BI في الواقع العملي",
  usecases_sub: "أمثلة توضيحية على لوحات المعلومات التي تحتاجها الشركات عادة — وليست مشاريع فعلية منجزة لعملاء ZentexAI.",
  usecases: [
    { title: "لوحة أداء المبيعات", desc: "خط الفرص والتحويل والإيرادات حسب المنتج أو المنطقة أو مندوب المبيعات، بتحديث تلقائي." },
    { title: "الحزمة المالية والإدارية", desc: "عروض للإيرادات والتكلفة والهامش تحل محل حزمة شهرية تُجمَّع يدوياً." },
    { title: "مؤشرات العمليات والخدمة", desc: "الأحجام وأزمنة التنفيذ والمتأخرات والاستغلال في مكان واحد." },
    { title: "تقارير المشاريع ومكتب إدارة المشاريع", desc: "تقارير حالة المحفظة والجدول الزمني وانحراف الميزانية عبر المشاريع." },
  ],

  process_eyebrow: "مراحل العمل",
  process_h2: "كيف يسير مشروع Power BI",
  process_sub: "تسلسل منظم يربط لوحة المعلومات بقرارات حقيقية وأرقام يمكن التحقق منها.",
  process: [
    { step: "01", title: "النطاق والجمهور", desc: "نتفق على من سيستخدم لوحة المعلومات والقرارات التي يجب أن تدعمها." },
    { step: "02", title: "الوصول إلى البيانات ومراجعتها", desc: "نراجع المصادر وإمكانية الوصول وجودة البيانات قبل بدء التصميم." },
    { step: "03", title: "تصميم النموذج", desc: "نصمم نموذج البيانات وتعريفات المقاييس التي ستعتمد عليها لوحة المعلومات." },
    { step: "04", title: "تصميم لوحة المعلومات", desc: "نرسم التخطيطات معك أولاً، ليتطابق البناء مع طريقة قراءة الفريق لها." },
    { step: "05", title: "البناء والتحقق", desc: "نبني ثم نطابق الأرقام مع الأنظمة المصدرية مع فريقك." },
    { step: "06", title: "النشر والتسليم", desc: "ننشر ونعد التحديث والوصول، وندرّب فريقك ونوثّق النموذج." },
  ],

  related_eyebrow: "ذات صلة",
  related_h2: "خدمات ومقالات ذات صلة",
  related: [
    { title: "خدمات تحليل البيانات في الإمارات", desc: "أُطر مؤشرات الأداء وتدقيق البيانات والتقارير بما يتجاوز أداة واحدة.", href: "/services/data-analytics-uae" },
    { title: "خدمات تعلّم الآلة في الإمارات", desc: "التنبؤ والتحليلات التنبؤية على أساس بيانات موثوق.", href: "/services/machine-learning-uae" },
    { title: "وكلاء الذكاء الاصطناعي والأتمتة في الإمارات", desc: "أتمتة سير العمل الذي تبرزه لوحات معلوماتك.", href: "/services/ai-agents-automation-uae" },
    { title: "استشارات إدارة المشاريع", desc: "إنشاء مكاتب إدارة المشاريع ودعم تنفيذ المشاريع.", href: "/services#pm-consulting" },
  ],

  faq_eyebrow: "الأسئلة الشائعة",
  faq_h2: "أسئلة متكررة",
  faq: [
    { q: "ماذا تشمل استشارات Power BI؟", a: "عادةً: الاتفاق على ما يجب أن تجيب عنه لوحة المعلومات، ومراجعة بياناتك وربطها، وتصميم نموذج البيانات والمقاييس، وبناء التقارير والتحقق منها، وإعداد التحديث والمشاركة، وتدريب فريقك. كما تشيع مراجعة التقارير الحالية وإصلاحها." },
    { q: "هل نحتاج إلى تراخيص Power BI Pro أو Premium؟", a: "يعتمد ذلك على عدد من يعرضون التقارير ويشاركونها وعلى مكان نشرها. تتغير تراخيص مايكروسوفت مع الوقت، لذلك نتحقق مما يحتاجه إعدادك وفق وثائق الترخيص الحالية لمايكروسوفت قبل أن تشتري أي شيء." },
    { q: "هل يمكنكم تحسين لوحات المعلومات الموجودة لدينا؟", a: "نعم. تنظر المراجعة في أداء التقارير ووضوحها ونموذج البيانات الكامن، وتنتج قائمة مرتبة الأولوية بالإصلاحات. غالباً ما تأتي أكبر المكاسب من تصحيح النموذج لا من إعادة تصميم الرسوم." },
    { q: "هل يمكن لـ Power BI الاتصال بأنظمتنا الحالية؟", a: "تدعم Power BI مصادر كثيرة، منها ملفات إكسل وقواعد بيانات SQL والتطبيقات السحابية وواجهات API. وما يناسبك عملياً من الاتصالات يعتمد على أنظمتك وإمكانية الوصول، ونتحقق منه أثناء تحديد النطاق." },
    { q: "هل تقدمون لوحات Power BI لشركات في دبي؟", a: "تخدم ZentexAI الشركات في عموم دولة الإمارات، بما في ذلك دبي وأبوظبي. شاركنا متطلباتك عبر صفحة التواصل وسنؤكد كيف سيتم العمل." },
    { q: "هل ZentexAI تابعة لمايكروسوفت؟", a: "لا. Power BI منتج من مايكروسوفت. أما ZentexAI فهي شركة استشارات مستقلة، ولا تعني هذه الصفحة وجود شراكة مع مايكروسوفت أو تزكية منها." },
  ],

  cta_h2: "هل تحتاج إلى لوحة Power BI تعمل فعلاً؟",
  cta_sub: "صف لنا التقارير التي تعتمد عليها اليوم والقرارات التي ينبغي أن تدعمها — وسنخبرك بما تبدو عليه الخطوة الأولى المعقولة.",
  cta_btn: "ناقش لوحة المعلومات",
};

export const dataAnalyticsCopy = { en: dataAnalyticsEn, ar: dataAnalyticsAr };
export const powerBiCopy = { en: powerBiEn, ar: powerBiAr };
