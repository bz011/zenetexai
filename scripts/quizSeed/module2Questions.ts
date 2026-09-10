import type { QuizQuestionSeed } from "./types";

/** Module 2 - Foundations. FINAL APPROVED (Q3 and Q8 revised per Zaid's review). */
export const module2Questions: QuizQuestionSeed[] = [
  {
    questionEn:
      "A manufacturing company runs a continuous assembly line producing the same product every day, following standardized, repetitive procedures. Which characteristic would classify this work as an operation rather than a project?",
    questionAr:
      "تدير شركة تصنيع خط تجميع مستمر ينتج نفس المنتج يومياً، باتباع إجراءات موحدة ومتكررة. أي خاصية تجعل هذا العمل يُصنَّف كعملية تشغيلية (Operation) لا كمشروع (Project)؟",
    options: [
      ["It requires a dedicated team of skilled workers", "يتطلب فريقاً مخصصاً من العمال المهرة"],
      ["It follows a repetitive, ongoing process with no defined end date", "يتبع عملية متكررة ومستمرة دون تاريخ انتهاء محدد"],
      ["It consumes a significant portion of the annual budget", "يستهلك جزءاً كبيراً من الميزانية السنوية"],
      ["It is managed by a functional manager", "يُدار من قبل مدير وظيفي (Functional Manager)"],
    ],
    correctIndex: 1,
    explanationEn:
      "A project is defined by being temporary (a definite beginning and end) and creating a unique product, service, or result. The assembly line described is repetitive and ongoing with no planned end date - the defining characteristic of an operation, not a project. Having a dedicated team (A) or a functional manager (D) does not by itself distinguish a project from an operation, and budget size (C) is unrelated to that distinction.",
    explanationAr:
      "يتميّز المشروع (Project) بكونه مؤقتاً (له بداية ونهاية محددتان) وينتج منتجاً أو خدمة أو نتيجة فريدة. أما العمل الموصوف فهو متكرر ومستمر دون نهاية مخطط لها، وهذه هي الخاصية الأساسية التي تُصنّفه كعملية تشغيلية (Operation) لا مشروعاً. وجود فريق مخصص (A) أو مدير وظيفي (D) لا يميّز بحد ذاته بين المشروع والعملية، كما أن حجم الميزانية (C) لا علاقة له بهذا التمييز.",
  },
  {
    questionEn:
      "An organization groups several related projects together and manages them in a coordinated way specifically to obtain benefits that would not be available if the projects were managed individually. What is this grouping best described as?",
    questionAr:
      "تجمع إحدى المؤسسات عدة مشاريع مترابطة وتديرها بطريقة منسّقة تحديداً للحصول على فوائد (Benefits) لا يمكن تحقيقها لو أُديرت هذه المشاريع كل على حدة. كيف يُوصف هذا التجميع بشكل أفضل؟",
    options: [
      ["A portfolio", "محفظة (Portfolio)"],
      ["A subproject", "مشروع فرعي (Subproject)"],
      ["An operation", "عملية تشغيلية (Operation)"],
      ["A program", "برنامج (Program)"],
    ],
    correctIndex: 3,
    explanationEn:
      "A program is a group of related projects, subsidiary programs, and program activities managed in a coordinated way to obtain benefits not available from managing them individually - exactly what is described. A portfolio (A) groups projects, programs, and other work to achieve strategic objectives, but the key detail here - coordinated management specifically to realize combined benefits - is the definition of a program. A subproject (B) is a smaller component within a single project, and this is not an operation (C) since it involves temporary, related project work.",
    explanationAr:
      "البرنامج (Program) هو مجموعة من المشاريع المترابطة والبرامج الفرعية وأنشطة البرنامج التي تُدار بطريقة منسّقة للحصول على فوائد لا يمكن تحقيقها لو أُديرت بشكل منفصل - وهذا بالضبط ما يصفه السؤال. أما المحفظة (A) فتجمع مشاريع وبرامج وأعمالاً أخرى لتحقيق أهداف استراتيجية، لكن التفصيل الجوهري هنا - الإدارة المنسّقة خصيصاً لتحقيق فوائد مشتركة - هو تعريف البرنامج. أما المشروع الفرعي (B) فهو جزء أصغر ضمن مشروع واحد، وهذا ليس عملية تشغيلية (C) لأنه يتضمن عملاً مشروعياً مؤقتاً ومترابطاً.",
  },
  {
    // REVISED per Zaid's feedback: Output -> Outcome -> Benefit mobile-app scenario.
    questionEn:
      "A project delivers a new customer-facing mobile application. After launch, customers begin using the organization's digital services more frequently. Over time, this contributes to increased customer retention and revenue. Which option correctly identifies the project's output, the resulting outcome, and the ultimate benefit?",
    questionAr:
      "يسلّم أحد المشاريع تطبيق جوال جديد للعملاء. وبعد الإطلاق، يبدأ العملاء باستخدام الخدمات الرقمية للمؤسسة بشكل أكثر تكراراً. وبمرور الوقت، يساهم ذلك في زيادة الاحتفاظ بالعملاء (Customer Retention) والإيرادات. أي خيار يحدد بشكل صحيح مخرج (Output) المشروع، والنتيجة (Outcome) الناتجة عنه، والفائدة (Benefit) النهائية؟",
    options: [
      [
        "Output: the mobile application | Outcome: more frequent use of digital services | Benefit: increased customer retention and revenue",
        "المخرج (Output): التطبيق الجوال | النتيجة (Outcome): الاستخدام الأكثر تكراراً للخدمات الرقمية | الفائدة (Benefit): زيادة الاحتفاظ بالعملاء والإيرادات",
      ],
      [
        "Output: increased customer retention and revenue | Outcome: the mobile application | Benefit: more frequent use of digital services",
        "المخرج: زيادة الاحتفاظ بالعملاء والإيرادات | النتيجة: التطبيق الجوال | الفائدة: الاستخدام الأكثر تكراراً للخدمات الرقمية",
      ],
      [
        "Output: the mobile application | Outcome: increased customer retention and revenue | Benefit: more frequent use of digital services",
        "المخرج: التطبيق الجوال | النتيجة: زيادة الاحتفاظ بالعملاء والإيرادات | الفائدة: الاستخدام الأكثر تكراراً للخدمات الرقمية",
      ],
      [
        "Output: more frequent use of digital services | Outcome: the mobile application | Benefit: increased customer retention and revenue",
        "المخرج: الاستخدام الأكثر تكراراً للخدمات الرقمية | النتيجة: التطبيق الجوال | الفائدة: زيادة الاحتفاظ بالعملاء والإيرادات",
      ],
    ],
    correctIndex: 0,
    explanationEn:
      "The project's tangible product - the mobile application - is the output: what the project directly produces. The resulting change in stakeholder behavior after release - customers using digital services more frequently - is the outcome that the output enables. The value the organization ultimately realizes from that behavior change - increased customer retention and revenue - is the benefit. Option C is the most common confusion: it places the benefit (retention/revenue) before the outcome (increased use), but the increase in usage must occur first and lead to the retention/revenue gain, not the reverse. Options B and D place the application itself as an outcome or benefit rather than recognizing it as the tangible product the project produced.",
    explanationAr:
      "المنتج الملموس للمشروع - التطبيق الجوال - هو المخرج (Output)، أي ما ينتجه المشروع مباشرة. أما التغيّر في سلوك أصحاب المصلحة بعد الإطلاق - استخدام العملاء للخدمات الرقمية بشكل أكثر تكراراً - فهو النتيجة (Outcome) التي يُمكّنها ذلك المخرج. أما القيمة التي تحققها المؤسسة في النهاية من هذا التغيّر السلوكي - زيادة الاحتفاظ بالعملاء والإيرادات - فهي الفائدة (Benefit). الخيار (C) هو الالتباس الأكثر شيوعاً: فهو يضع الفائدة (الاحتفاظ والإيرادات) قبل النتيجة (زيادة الاستخدام)، بينما يجب أن تحدث زيادة الاستخدام أولاً لتؤدي إلى تحقق الاحتفاظ والإيرادات، لا العكس. أما الخياران (B) و(D) فيضعان التطبيق نفسه كنتيجة أو كفائدة بدلاً من إدراكه كمنتج ملموس أنتجه المشروع.",
  },
  {
    questionEn:
      "A senior executive asks a project manager to explain how the organization's projects, programs, and portfolios connect to the delivery of business value. Which concept should the project manager reference?",
    questionAr:
      "طلب أحد كبار المسؤولين التنفيذيين من مدير المشروع أن يوضح كيف ترتبط مشاريع المؤسسة وبرامجها ومحافظها بتحقيق القيمة التجارية (Business Value). أي مفهوم يجب أن يستند إليه مدير المشروع؟",
    options: [
      ["The work breakdown structure", "هيكل تجزئة العمل (Work Breakdown Structure)"],
      ["The stakeholder register", "سجل أصحاب المصلحة (Stakeholder Register)"],
      ["The value delivery system", "نظام تقديم القيمة (Value Delivery System)"],
      ["The risk management plan", "خطة إدارة المخاطر (Risk Management Plan)"],
    ],
    correctIndex: 2,
    explanationEn:
      "The value delivery system describes how an organization's components - portfolios, programs, projects, products, and operations - work together to create value aligned with strategy, connecting project outputs to organizational value. The WBS (A) decomposes one project's scope into work packages, not organization-wide value delivery. The stakeholder register (B) and risk management plan (D) are single-project artifacts, not the broader system connecting projects/programs/portfolios to strategic value.",
    explanationAr:
      "يصف نظام تقديم القيمة (Value Delivery System) كيف تعمل مكوّنات المؤسسة معاً - المحافظ والبرامج والمشاريع والمنتجات والعمليات - لتحقيق القيمة بما يتماشى مع الاستراتيجية. أما هيكل تجزئة العمل (A) فيجزّئ نطاق مشروع واحد فقط، ولا يصف تقديم القيمة على مستوى المؤسسة. أما سجل أصحاب المصلحة (B) وخطة إدارة المخاطر (D) فهما أداتان على مستوى مشروع واحد، وليستا النظام الأوسع الذي يربط المشاريع بالقيمة الاستراتيجية.",
  },
  {
    questionEn:
      "A project manager needs to confirm whether a proposed project aligns with the organization's overall policies, compliance requirements, and strategic decision-making framework, independent of any single project or program. Which of the following governs this alignment?",
    questionAr:
      "يحتاج مدير المشروع إلى التأكد مما إذا كان المشروع المقترح متوافقاً مع سياسات المؤسسة العامة، ومتطلبات الامتثال، وإطار اتخاذ القرار الاستراتيجي، بمعزل عن أي مشروع أو برنامج بعينه. أي مما يلي يحكم هذا التوافق؟",
    options: [
      ["The project charter", "ميثاق المشروع (Project Charter)"],
      ["The change control board", "لجنة ضبط التغيير (Change Control Board)"],
      ["Project governance", "حوكمة المشروع (Project Governance)"],
      ["Organizational governance", "الحوكمة المؤسسية (Organizational Governance)"],
    ],
    correctIndex: 3,
    explanationEn:
      "Organizational governance is the framework of policies, structures, and processes an organization uses to direct and control its overall activities, achieve strategic objectives, and comply with legal/regulatory requirements - broader than any single project. Project governance (C) applies specifically within one project/program, not organization-wide alignment. The project charter (A) authorizes a single project, and the change control board (B) reviews changes within a project - neither addresses organization-wide alignment.",
    explanationAr:
      "الحوكمة المؤسسية (Organizational Governance) هي إطار السياسات والهياكل والعمليات التي تستخدمها المؤسسة لتوجيه أنشطتها العامة، وتحقيق أهدافها الاستراتيجية، والامتثال للمتطلبات القانونية والتنظيمية - وهذا أوسع من أي مشروع منفرد. أما حوكمة المشروع (C) فتُطبَّق داخل مشروع أو برنامج بعينه فقط. أما ميثاق المشروع (A) فيفوّض مشروعاً واحداً، ولجنة ضبط التغيير (B) تراجع التغييرات ضمن مشروع، وكلاهما لا يتناول التوافق على مستوى المؤسسة.",
  },
  {
    questionEn:
      "Midway through a project, the project manager is uncertain who has the authority to approve a major scope change and how that decision should be escalated. Which project component should the project manager consult to resolve this uncertainty?",
    questionAr:
      "في منتصف المشروع، لم يعد مدير المشروع متأكداً من الجهة التي تملك صلاحية اعتماد تغيير جوهري في النطاق، وكيف ينبغي تصعيد هذا القرار. أي عنصر ينبغي أن يرجع إليه مدير المشروع لحل هذا الغموض؟",
    options: [
      ["The lessons learned register", "سجل الدروس المستفادة (Lessons Learned Register)"],
      ["The project governance framework", "إطار حوكمة المشروع (Project Governance Framework)"],
      ["The resource calendar", "تقويم الموارد (Resource Calendar)"],
      ["The quality management plan", "خطة إدارة الجودة (Quality Management Plan)"],
    ],
    correctIndex: 1,
    explanationEn:
      "The project governance framework defines the structure, roles, responsibilities, and decision-making authority for a specific project, including how decisions are made and escalated - exactly what is needed here. The lessons learned register (A) captures past knowledge, not current decision authority. The resource calendar (C) shows resource availability, and the quality management plan (D) addresses quality standards - neither defines decision or escalation authority.",
    explanationAr:
      "يحدد إطار حوكمة المشروع (Project Governance Framework) الهيكل والأدوار وصلاحيات اتخاذ القرار الخاصة بمشروع معيّن، بما في ذلك كيفية اتخاذ القرارات وتصعيدها - وهذا بالضبط ما يحتاجه مدير المشروع. أما سجل الدروس المستفادة (A) فيوثّق معرفة سابقة، لا صلاحيات القرار الحالية. أما تقويم الموارد (C) فيوضّح توفر الموارد، وخطة إدارة الجودة (D) تتناول معايير الجودة، وكلاهما لا يحدد صلاحيات القرار أو التصعيد.",
  },
  {
    questionEn:
      "In a particular organization, the project manager has full authority over the project budget and can assign full-time team members exclusively to the project, with minimal involvement from functional managers. Which organizational structure does this best describe?",
    questionAr:
      "في إحدى المؤسسات، يملك مدير المشروع صلاحية كاملة على ميزانية المشروع، ويمكنه تعيين أعضاء فريق متفرغين بالكامل للمشروع حصرياً، مع مشاركة محدودة جداً من المديرين الوظيفيين. أي هيكل تنظيمي يصف هذا الوضع؟",
    options: [
      ["Functional", "الهيكل الوظيفي (Functional)"],
      ["Weak matrix", "المصفوفة الضعيفة (Weak Matrix)"],
      ["Projectized", "الهيكل المشروعي (Projectized)"],
      ["Balanced matrix", "المصفوفة المتوازنة (Balanced Matrix)"],
    ],
    correctIndex: 2,
    explanationEn:
      "In a projectized structure, the project manager has high to almost total authority; team members are typically full-time and report directly to the project manager, and functional managers have little to no involvement. A functional structure (A) gives the project manager little or no authority. In a weak matrix (B), the project manager acts more as a coordinator with limited authority, and in a balanced matrix (D), authority is shared roughly equally with functional managers - neither matches the near-exclusive authority described.",
    explanationAr:
      "في الهيكل المشروعي (Projectized)، يملك مدير المشروع صلاحية عالية إلى شبه كاملة، ويُعيَّن أعضاء الفريق عادة بدوام كامل ويقدّمون تقاريرهم مباشرة له، بينما تكون مشاركة المديرين الوظيفيين ضئيلة أو معدومة. أما الهيكل الوظيفي (A) فيمنح مدير المشروع صلاحية ضئيلة أو معدومة. وفي المصفوفة الضعيفة (B) يعمل مدير المشروع كمنسّق بصلاحية محدودة، وفي المصفوفة المتوازنة (D) تُقسَّم الصلاحية تقريباً بالتساوي مع المديرين الوظيفيين - وكلاهما لا يطابق الصلاحية شبه الحصرية الموصوفة.",
  },
  {
    // REVISED per Zaid's feedback: Predictive vs Adaptive selection based on uncertainty.
    questionEn:
      "A project team is about to begin a new initiative. Requirements are highly uncertain and expected to change significantly as the team learns more, frequent stakeholder feedback will be essential throughout delivery, and attempting to finalize detailed scope, schedule, and cost estimates upfront would be unreliable. Which life-cycle approach is MOST appropriate for this project?",
    questionAr:
      "يستعد فريق مشروع للبدء بمبادرة جديدة. المتطلبات غير مؤكدة إلى حد كبير ومن المتوقع أن تتغير بشكل ملحوظ كلما تعلّم الفريق المزيد، والتغذية الراجعة المتكررة من أصحاب المصلحة ستكون ضرورية طوال التنفيذ، كما أن محاولة تحديد النطاق والجدول الزمني والتكلفة بالتفصيل مسبقاً ستكون غير موثوقة. أي نهج لدورة حياة المشروع (Project Life Cycle) هو الأنسب لهذا المشروع؟",
    options: [
      [
        "An adaptive approach, defining scope in short cycles and re-prioritizing frequently based on stakeholder feedback",
        "نهج تكيّفي (Adaptive)، يحدد النطاق عبر دورات قصيرة ويعيد ترتيب الأولويات باستمرار بناءً على تغذية راجعة من أصحاب المصلحة",
      ],
      [
        "A predictive approach, planning scope, schedule, and budget in detail before execution begins",
        "نهج تنبؤي (Predictive)، يخطط النطاق والجدول الزمني والميزانية بالتفصيل قبل بدء التنفيذ",
      ],
      [
        "A single fully sequential, phase-gated approach with no stakeholder review until final delivery",
        "نهج تسلسلي واحد بالكامل ومقسّم إلى مراحل معتمدة، دون أي مراجعة من أصحاب المصلحة حتى التسليم النهائي",
      ],
      [
        "An approach that begins execution without any defined scope or plan",
        "نهج يبدأ التنفيذ دون أي نطاق أو خطة محددة على الإطلاق",
      ],
    ],
    correctIndex: 0,
    explanationEn:
      "An adaptive approach is most appropriate when requirements are highly uncertain, frequent stakeholder feedback and learning are needed throughout delivery, and detailed upfront planning would be unreliable - it plans and re-prioritizes scope in short cycles as new information emerges. A predictive approach (B) is appropriate instead when requirements are relatively stable and can be planned substantially upfront - the opposite of the conditions described. Option C describes an even more rigid version of upfront planning with no stakeholder engagement until the end, which is especially unsuitable when frequent feedback is essential. Option D is not a defined life-cycle approach at all - proceeding without any scope or plan is not the same as adapting scope through structured, feedback-driven cycles.",
    explanationAr:
      "النهج التكيّفي (Adaptive) هو الأنسب عندما تكون المتطلبات غير مؤكدة إلى حد كبير، وتكون التغذية الراجعة المتكررة من أصحاب المصلحة والتعلّم ضروريين طوال التنفيذ، ويكون التخطيط التفصيلي المسبق غير موثوق - فهو يخطط النطاق ويعيد ترتيب أولوياته عبر دورات قصيرة كلما ظهرت معلومات جديدة. أما النهج التنبؤي (B) فهو مناسب عندما تكون المتطلبات مستقرة نسبياً ويمكن التخطيط لها بشكل كبير مسبقاً - وهو عكس الظروف الموصوفة تماماً. أما الخيار (C) فيصف نسخة أكثر جموداً من التخطيط المسبق دون أي إشراك لأصحاب المصلحة حتى النهاية، وهو غير مناسب بشكل خاص عندما تكون التغذية الراجعة المتكررة ضرورية. أما الخيار (D) فليس نهج دورة حياة محدداً على الإطلاق - فالمضي قدماً دون أي نطاق أو خطة لا يعني نفس الشيء كتكييف النطاق عبر دورات منظمة قائمة على التغذية الراجعة.",
  },
  {
    questionEn:
      "A project manager identifies that two key stakeholders have directly conflicting expectations about a critical project outcome, and the organizational structure adds further ambiguity about who has final decision authority. This situation is primarily contributing to which aspect of the project?",
    questionAr:
      "لاحظ مدير المشروع تعارضاً مباشراً بين توقعات صاحبَي مصلحة رئيسيين حول نتيجة جوهرية للمشروع، وأن الهيكل التنظيمي يزيد من غموض تحديد الجهة صاحبة القرار النهائي. إلى أي جانب من جوانب المشروع يساهم هذا الوضع بشكل أساسي؟",
    options: [
      ["Project schedule risk", "مخاطر الجدول الزمني (Schedule Risk)"],
      ["Scope creep", "زحف النطاق (Scope Creep)"],
      ["Resource contention", "التنافس على الموارد (Resource Contention)"],
      ["Project complexity", "تعقيد المشروع (Project Complexity)"],
    ],
    correctIndex: 3,
    explanationEn:
      "Project complexity arises from characteristics such as human behavior (differing stakeholder expectations), system behavior (interdependencies within organizational structure), and ambiguity (uncertainty over authority or outcomes) - all present here. Conflicting expectations could eventually contribute to schedule risk (A) or scope creep (B) if left unmanaged, but the situation as described - conflicting expectations plus structural ambiguity over authority - is best characterized as a source of complexity itself, not a specific downstream risk category. Resource contention (C) refers to competition for limited resources, which is not what is described.",
    explanationAr:
      "ينشأ تعقيد المشروع (Project Complexity) من خصائص مثل السلوك البشري (تباين توقعات أصحاب المصلحة)، وسلوك الأنظمة (الترابطات ضمن الهيكل التنظيمي)، والغموض (عدم اليقين حول الصلاحيات) - وجميعها حاضرة هنا. قد يساهم تعارض التوقعات لاحقاً في مخاطر الجدول الزمني (A) أو زحف النطاق (B) إن لم تتم إدارته، لكن الموقف الموصوف - تعارض التوقعات مع غموض هيكلي حول الصلاحية - يُصنَّف أساساً كمصدر للتعقيد بحد ذاته. أما التنافس على الموارد (C) فيشير إلى التنافس على موارد محدودة، وهو ما لا ينطبق هنا.",
  },
  {
    questionEn:
      "A project manager is deciding how to adapt the organization's standard project management processes for a new, small, low-risk internal project. Which factor should MOST influence this tailoring decision?",
    questionAr:
      "يقرر مدير المشروع كيفية تكييف عمليات إدارة المشاريع المعيارية في المؤسسة لتناسب مشروعاً داخلياً جديداً صغيراً ومنخفض المخاطر. أي عامل ينبغي أن يكون الأكثر تأثيراً في قرار التخصيص (Tailoring) هذا؟",
    options: [
      ["The preferences of the project sponsor's executive assistant", "تفضيلات المساعد التنفيذي لراعي المشروع"],
      [
        "The specific characteristics, context, and needs of the project and its organization",
        "الخصائص والسياق والاحتياجات الفعلية للمشروع ومؤسسته",
      ],
      ["Matching exactly what was used on the most recent large, complex project", "مطابقة ما استُخدم تماماً في أحدث مشروع كبير ومعقّد"],
      ["Applying every available process and tool to demonstrate thoroughness", "تطبيق كل عملية وأداة متاحة لإظهار الشمولية"],
    ],
    correctIndex: 1,
    explanationEn:
      "Tailoring means deliberately adapting the project management approach, governance, and processes to match the specific characteristics of the project, its organizational context, and its actual needs - using only what adds value. Reusing an approach from a much larger, more complex project without adaptation (C) ignores the current project's actual characteristics, and applying every available process regardless of need (D) adds unnecessary overhead rather than value. The preference of an individual with no decision authority over the project's approach (A) is not a legitimate basis for tailoring.",
    explanationAr:
      "يعني التخصيص (Tailoring) التكييف المتعمَّد لنهج إدارة المشروع وحوكمته وعملياته بما يتناسب مع خصائص المشروع وسياقه المؤسسي واحتياجاته الفعلية - باستخدام ما يضيف قيمة فقط. أما إعادة استخدام نهج مشروع أكبر وأكثر تعقيداً دون تكييف (C) فيتجاهل خصائص المشروع الحالي، وتطبيق كل عملية متاحة بغض النظر عن الحاجة (D) يضيف أعباءً غير ضرورية بدلاً من القيمة. أما تفضيلات شخص لا يملك صلاحية القرار (A) فليست أساساً مشروعاً لقرار التخصيص.",
  },
];
