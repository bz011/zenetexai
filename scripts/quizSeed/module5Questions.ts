import type { QuizQuestionSeed } from "./types";

/** Module 5 - Process Domain. FINAL APPROVED (Q8 explanation precision-corrected; scenario/options/correct answer/arithmetic unchanged). */
export const module5Questions: QuizQuestionSeed[] = [
  {
    questionEn:
      "A stakeholder requests accelerating a milestone by two weeks to align with a marketing launch. The team could compress the schedule by adding resources, but doing so would increase cost and reduce the team's available time for quality reviews. What should the project manager do?",
    questionAr:
      "يطلب أحد أصحاب المصلحة تسريع أحد المعالم الرئيسية بأسبوعين لمواءمته مع إطلاق تسويقي. يمكن للفريق ضغط الجدول الزمني بإضافة موارد، لكن ذلك سيزيد التكلفة ويقلل الوقت المتاح للفريق لمراجعات الجودة. ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      [
        "Approve the schedule compression immediately, since satisfying the marketing launch date is the priority",
        "الموافقة على ضغط الجدول الزمني فوراً، لأن تلبية موعد الإطلاق التسويقي هي الأولوية",
      ],
      [
        "Decline the request outright without evaluating whether an integrated adjustment could accommodate it",
        "رفض الطلب فوراً دون تقييم ما إذا كان بالإمكان استيعابه من خلال تعديل متكامل",
      ],
      [
        "Assess how accelerating the milestone would affect cost, resource availability, and quality before deciding whether and how to accommodate the request",
        "تقييم كيفية تأثير تسريع المعلم على التكلفة وتوافر الموارد والجودة قبل تحديد ما إذا كان سيتم تلبية الطلب وكيف",
      ],
      [
        "Add resources to compress the schedule without adjusting the quality review process, since quality plans should remain fixed regardless of schedule changes",
        "إضافة موارد لضغط الجدول الزمني دون تعديل عملية مراجعة الجودة، لأن خطط الجودة ينبغي أن تبقى ثابتة بغض النظر عن تغييرات الجدول",
      ],
    ],
    correctIndex: 2,
    explanationEn:
      "Integrated planning means recognizing that a change to one constraint (schedule) has ripple effects across others (cost, resources, quality), so the delivery strategy must account for these together rather than optimizing one area in isolation. Option A commits to schedule compression before understanding the cost and quality trade-offs involved. Option B rejects the request without analysis, potentially missing a genuinely workable integrated adjustment. Option D compresses the schedule while treating the quality approach as untouchable - the opposite of integration, since schedule pressure typically requires a coordinated look at quality activities too, not a frozen plan alongside a changed one.",
    explanationAr:
      "يعني التخطيط المتكامل (Integrated Planning) إدراك أن تغيير أحد القيود (الجدول الزمني) له تأثيرات متتالية على قيود أخرى (التكلفة، الموارد، الجودة)، لذا يجب أن تأخذ استراتيجية التسليم هذه العوامل بعين الاعتبار معاً بدلاً من تحسين مجال واحد بمعزل عن غيره. الخيار (A) يلتزم بضغط الجدول الزمني قبل فهم المقايضات المتعلقة بالتكلفة والجودة. الخيار (B) يرفض الطلب دون تحليل، مما قد يفوّت تعديلاً متكاملاً قابلاً للتنفيذ فعلياً. الخيار (D) يضغط الجدول الزمني بينما يعامل نهج الجودة على أنه غير قابل للمس - وهذا عكس التكامل تماماً، إذ إن ضغط الجدول يتطلب عادة النظر بشكل منسّق في أنشطة الجودة أيضاً، لا إبقاء خطة ثابتة بجانب أخرى متغيرة.",
  },
  {
    questionEn:
      "During a routine check-in, a stakeholder casually asks a developer to add a \"small\" additional feature not in the approved scope baseline, and the developer starts working on it without informing the project manager. What should the project manager do upon learning this?",
    questionAr:
      "خلال متابعة روتينية، يطلب أحد أصحاب المصلحة بشكل غير رسمي من أحد المطورين إضافة ميزة \"بسيطة\" غير مدرجة في خط أساس النطاق (Scope Baseline) المعتمد، فيبدأ المطور العمل عليها دون إبلاغ مدير المشروع. ماذا ينبغي لمدير المشروع أن يفعل عند علمه بذلك؟",
    options: [
      [
        "Ask the developer to pause work on the unapproved item and ensure the request is evaluated against the scope baseline and its impact assessed before any further work proceeds",
        "الطلب من المطور إيقاف العمل على البند غير المعتمد، والتأكد من تقييم الطلب مقابل خط أساس النطاق وتقدير أثره قبل استمرار أي عمل إضافي",
      ],
      ["Allow the developer to finish the small addition since it is minor and unlikely to affect the project", "السماح للمطور بإنهاء الإضافة البسيطة لأنها طفيفة ومن غير المرجح أن تؤثر على المشروع"],
      ["Instruct the developer to stop immediately and formally reprimand them for accepting unauthorized work", "توجيه المطور للتوقف فوراً وتوجيه لوم رسمي له لقبوله عملاً غير مصرّح به"],
      ["Ignore the situation since the stakeholder, not the developer, initiated the request", "تجاهل الموقف لأن صاحب المصلحة، لا المطور، هو من بادر بالطلب"],
    ],
    correctIndex: 0,
    explanationEn:
      "Uncontrolled scope expansion - even well-intentioned \"small\" additions - undermines the scope baseline and can accumulate into significant, unassessed impact over time. The appropriate response is to pause the informal work and route the request through proper evaluation against the baseline before it proceeds, rather than letting perceived size alone decide whether to allow it. Option B allows scope creep based on a subjective judgment of size rather than actual evaluation. Option C jumps to punitive action rather than correcting the process gap, which is disproportionate and doesn't address the systemic issue of requests bypassing evaluation. Option D ignores the issue entirely and fails to protect the scope baseline, regardless of who initiated the request.",
    explanationAr:
      "يقوّض التوسع غير المضبوط في النطاق (Uncontrolled Scope Expansion) - حتى الإضافات \"البسيطة\" حسنة النية - خط أساس النطاق، وقد يتراكم إلى أثر كبير غير مُقيَّم بمرور الوقت. الاستجابة المناسبة هي إيقاف العمل غير الرسمي وتوجيه الطلب عبر تقييم صحيح مقابل خط الأساس قبل المضي فيه، بدلاً من ترك حجم الإضافة المُتصوَّر وحده يحدد قبولها. الخيار (B) يسمح بزحف النطاق (Scope Creep) بناءً على حكم ذاتي على الحجم بدلاً من تقييم فعلي. الخيار (C) يقفز إلى إجراء عقابي بدلاً من تصحيح الثغرة في العملية، وهو غير متناسب ولا يعالج المشكلة الجوهرية المتمثلة في تجاوز الطلبات لعملية التقييم. الخيار (D) يتجاهل الموقف كلياً ويفشل في حماية خط أساس النطاق، بغض النظر عمّن بادر بالطلب.",
  },
  {
    questionEn:
      "A development team completes a deliverable and considers it finished because it satisfies the technical requirements the developers implemented it against. No one outside the team has reviewed it. What is missing before this deliverable's scope can be considered properly validated?",
    questionAr:
      "ينهي فريق تطوير أحد المخرجات ويعتبره مكتملاً لأنه يستوفي المتطلبات التقنية التي بنى عليها التطوير. لم يقم أحد خارج الفريق بمراجعته. ما الذي ينقص قبل اعتبار نطاق هذا المخرج مُتحقَّقاً منه (Validated) بشكل سليم؟",
    options: [
      ["A second internal code review performed by another developer on the same team", "مراجعة برمجية داخلية ثانية يقوم بها مطور آخر من نفس الفريق"],
      ["Confirmation that the deliverable was completed within the original planned schedule", "تأكيد أن المخرج قد اكتمل ضمن الجدول الزمني المخطط له أصلاً"],
      ["A performance/load test confirming the system can handle expected technical demand", "اختبار أداء/حمل يؤكد قدرة النظام على تحمّل الطلب التقني المتوقع"],
      [
        "Formal review and acceptance of the deliverable against the agreed acceptance criteria by the customer or authorized stakeholder",
        "مراجعة رسمية واعتماد المخرج مقابل معايير القبول (Acceptance Criteria) المتفق عليها من قبل العميل أو صاحب المصلحة المخوَّل",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "Validating scope means formally confirming, with the customer or authorized stakeholder, that the completed deliverable meets the documented acceptance criteria - internal technical completion is necessary but not sufficient on its own. Option A is still an internal technical check by the same team, not an external validation against acceptance criteria. Option B is a schedule fact, unrelated to whether the deliverable actually meets what was agreed to be delivered. Option C is a valuable technical/quality verification, but it does not substitute for the stakeholder's formal acceptance that the scope was correctly delivered.",
    explanationAr:
      "يعني التحقق من النطاق (Validate Scope) التأكيد الرسمي، مع العميل أو صاحب المصلحة المخوَّل، بأن المخرج المكتمل يستوفي معايير القبول (Acceptance Criteria) الموثقة - فالاكتمال التقني الداخلي ضروري لكنه غير كافٍ وحده. الخيار (A) لا يزال فحصاً تقنياً داخلياً من نفس الفريق، وليس تحققاً خارجياً مقابل معايير القبول. الخيار (B) حقيقة تتعلق بالجدول الزمني، ولا علاقة لها بما إذا كان المخرج يستوفي فعلاً ما تم الاتفاق على تسليمه. الخيار (C) تحقق تقني/جودة ذو قيمة، لكنه لا يغني عن الاعتماد الرسمي (Formal Acceptance) من صاحب المصلحة بأن النطاق قد سُلِّم بشكل صحيح.",
  },
  {
    questionEn:
      "A planned feature has been fully built and meets all its technical specifications. However, usage data from an early release to a pilot group shows that customers are not using the feature, and product research suggests it does not address a real customer need. What should the project team do?",
    questionAr:
      "تم بناء إحدى الميزات المخطط لها بالكامل وهي تستوفي جميع مواصفاتها التقنية. لكن بيانات الاستخدام من إصدار مبكر لمجموعة تجريبية تُظهر أن العملاء لا يستخدمون الميزة، وتشير أبحاث المنتج إلى أنها لا تلبي حاجة حقيقية للعملاء. ماذا ينبغي لفريق المشروع أن يفعل؟",
    options: [
      ["Complete and release the feature as originally planned, since it was already fully built to specification", "إكمال وإطلاق الميزة كما هو مخطط لها أصلاً، لأنها بُنيت بالفعل بالكامل وفق المواصفات"],
      [
        "Reassess whether continuing to deliver, promote, or expand this feature is still the best use of remaining project resources, given the evidence that it may not generate real value",
        "إعادة تقييم ما إذا كان الاستمرار في تسليم هذه الميزة أو الترويج لها أو توسيعها لا يزال الاستخدام الأفضل للموارد المتبقية للمشروع، في ضوء الأدلة على أنها قد لا تحقق قيمة (Value) حقيقية",
      ],
      [
        "Continue investing further resources in the feature based on the plan, since evidence from a single pilot group is not a valid reason to reconsider committed scope",
        "الاستمرار في استثمار المزيد من الموارد في الميزة وفق الخطة، لأن الأدلة من مجموعة تجريبية واحدة ليست سبباً كافياً لإعادة النظر في النطاق الملتزم به",
      ],
      ["Immediately halt all further work on the feature without informing the relevant stakeholders", "إيقاف جميع الأعمال المتعلقة بالميزة فوراً دون إبلاغ أصحاب المصلحة المعنيين"],
    ],
    correctIndex: 1,
    explanationEn:
      "Value-based delivery means evaluating whether an output is genuinely producing the outcome and benefit it was intended for, not just whether it was technically completed as specified. When evidence suggests a completed output won't be used or valued, that is a signal to reassess the decision, not a reason to blindly finish or expand it. Option A treats \"technically complete per specification\" as equivalent to \"delivering value\" - exactly the trap value-based delivery is meant to avoid. Option C dismisses meaningful early evidence and treats the original plan as fixed regardless of new information. Option D acts unilaterally without informing the stakeholders who are accountable for scope and value trade-offs, bypassing the people who should be part of this decision.",
    explanationAr:
      "يعني التسليم القائم على القيمة (Value-Based Delivery) تقييم ما إذا كان المخرج (Output) يحقق فعلياً النتيجة (Outcome) والفائدة (Benefit) المقصودة منه، لا مجرد التحقق من اكتماله تقنياً وفق المواصفات. عندما تشير الأدلة إلى أن مخرجاً مكتملاً لن يُستخدَم أو تكون له قيمة، فهذا مؤشر لإعادة تقييم القرار، لا سبب لإكماله أو توسيعه دون تفكير. الخيار (A) يعامل \"الاكتمال التقني وفق المواصفات\" وكأنه مرادف لـ\"تحقيق القيمة\" - وهذا بالضبط الفخ الذي يهدف التسليم القائم على القيمة إلى تجنبه. الخيار (C) يتجاهل أدلة مبكرة ذات دلالة ويعامل الخطة الأصلية كأمر ثابت بغض النظر عن المعلومات الجديدة. الخيار (D) يتصرف بشكل منفرد دون إبلاغ أصحاب المصلحة المسؤولين عن مقايضات النطاق والقيمة، متجاوزاً الأشخاص الذين ينبغي إشراكهم في هذا القرار.",
  },
  {
    questionEn:
      "A vendor has recently missed two consecutive delivery milestones on a fixed-price contract, and the quality of recent deliverables has declined. What should the project manager do FIRST?",
    questionAr:
      "فوّت أحد الموردين مؤخراً معلمَي تسليم متتاليين ضمن عقد بسعر ثابت (Fixed-Price)، كما تراجعت جودة المخرجات الأخيرة. ماذا ينبغي لمدير المشروع أن يفعل أولاً؟",
    options: [
      [
        "Review the contract's agreed obligations, performance criteria, and remedies to understand what has actually been violated before deciding on a course of action",
        "مراجعة التزامات العقد المتفق عليها ومعايير الأداء وسبل المعالجة المنصوص عليها لفهم ما تم انتهاكه فعلياً قبل تحديد مسار العمل",
      ],
      ["Terminate the contract immediately, since two consecutive missed milestones indicates the vendor cannot be trusted", "إنهاء العقد فوراً، لأن تفويت معلمين متتاليين يدل على أنه لا يمكن الوثوق بالمورد"],
      ["Unilaterally revise the delivery schedule and quality expectations to something the vendor can meet", "تعديل الجدول الزمني للتسليم وتوقعات الجودة من جانب واحد إلى ما يستطيع المورد تحقيقه"],
      [
        "Escalate directly to the vendor's senior executives without first addressing the issue through the project's own contract management process",
        "التصعيد مباشرة إلى كبار المسؤولين التنفيذيين لدى المورد دون معالجة المشكلة أولاً عبر عملية إدارة العقد الخاصة بالمشروع",
      ],
    ],
    correctIndex: 0,
    explanationEn:
      "Before taking any action on declining vendor performance, the project manager must understand what the contract actually requires and permits - obligations, performance criteria, and remedies - since the appropriate response (formal notice, corrective action plan, penalty clause, etc.) depends entirely on the agreement's terms, not just on the fact that performance has slipped. This is why understanding the contract comes FIRST: none of the other options can be responsibly chosen without it. Option B jumps to termination - an often costly and disruptive remedy - without first confirming it is contractually justified. Option C assumes the project manager has unilateral authority to change contract terms, which is generally not accurate; contract terms are negotiated, not changed alone by the PM. Option D bypasses the established contract management process in favor of a premature escalation that could damage the working relationship unnecessarily.",
    explanationAr:
      "قبل اتخاذ أي إجراء بشأن تراجع أداء المورد، يجب على مدير المشروع فهم ما يتطلبه العقد ويسمح به فعلياً - الالتزامات ومعايير الأداء وسبل المعالجة - لأن الاستجابة المناسبة (إشعار رسمي، خطة تصحيحية، بند جزائي، إلخ) تعتمد كلياً على شروط الاتفاقية، لا على مجرد تراجع الأداء. لهذا السبب يأتي فهم العقد أولاً: فلا يمكن اختيار أي من الخيارات الأخرى بمسؤولية دون ذلك. الخيار (B) يقفز إلى الإنهاء - وهو إجراء غالباً ما يكون مكلفاً ومعطلاً - دون التأكد أولاً من أنه مبرر تعاقدياً. الخيار (C) يفترض أن مدير المشروع يملك صلاحية أحادية لتغيير شروط العقد، وهذا غير صحيح عموماً؛ فشروط العقد تُتفاوض عليها ولا يغيّرها مدير المشروع منفرداً. الخيار (D) يتجاوز عملية إدارة العقد المعتمدة لصالح تصعيد سابق لأوانه قد يضر بعلاقة العمل دون داعٍ.",
  },
  {
    questionEn:
      "At the current point in the project, actual costs to date exactly match the planned budget for work completed. However, the forecast to complete, based on current spending trends, shows the project is likely to exceed the total approved budget by a significant margin. A stakeholder states that the project's financial status is fine because spending matches the plan so far. How should the project manager respond?",
    questionAr:
      "في المرحلة الحالية من المشروع، تتطابق التكاليف الفعلية حتى الآن تماماً مع الميزانية المخطط لها للعمل المُنجز. لكن التوقع (Forecast) للإكمال، بناءً على اتجاهات الإنفاق الحالية، يُظهر أن المشروع من المرجح أن يتجاوز الميزانية الإجمالية المعتمدة بهامش كبير. يقول أحد أصحاب المصلحة إن الوضع المالي للمشروع جيد لأن الإنفاق يطابق الخطة حتى الآن. كيف ينبغي لمدير المشروع أن يرد؟",
    options: [
      [
        "Agree that the financial status is fine, since actual costs matching the budget to date is the most reliable indicator of overall project financial health",
        "الموافقة على أن الوضع المالي جيد، لأن تطابق التكاليف الفعلية مع الميزانية حتى الآن هو أكثر المؤشرات موثوقية للصحة المالية العامة للمشروع",
      ],
      ["Withhold the forecast from the stakeholder until it becomes a confirmed overrun, to avoid causing unnecessary concern", "حجب التوقع عن صاحب المصلحة إلى أن يتحول إلى تجاوز مؤكد، لتجنب إثارة قلق غير ضروري"],
      ["Request additional budget immediately, without first analyzing what is driving the unfavorable forecast", "طلب ميزانية إضافية فوراً، دون تحليل العوامل المسببة للتوقع غير المواتي أولاً"],
      [
        "Explain that spending matching the plan to date does not guarantee the project will finish within budget, and share the forecast showing a likely budget overrun so it can be addressed proactively",
        "توضيح أن تطابق الإنفاق مع الخطة حتى الآن لا يضمن إنجاز المشروع ضمن الميزانية، ومشاركة التوقع الذي يُظهر احتمال تجاوز الميزانية حتى تتسنى معالجته بشكل استباقي",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "Actual cost matching the budget to date reflects only historical spending - it does not account for the trend and forecast for remaining work. A forecast indicating a likely overrun is meaningful, decision-relevant financial information that should be surfaced proactively, not deferred, so it can be investigated and addressed while there is still time to influence the outcome. Option A relies solely on a lagging, point-in-time comparison and ignores the more decision-relevant forecast, giving stakeholders an incomplete and misleading picture. Option B withholds important information until it is too late to act on it, undermining transparency and timely decision-making. Option C jumps to requesting more money before understanding the root cause of the unfavorable trend, which may or may not be the right response.",
    explanationAr:
      "تعكس التكلفة الفعلية المطابقة للميزانية حتى الآن الإنفاق التاريخي فقط - ولا تأخذ بعين الاعتبار اتجاه وتوقع العمل المتبقي. التوقع (Forecast) الذي يشير إلى احتمال تجاوز الميزانية هو معلومة مالية مهمة وذات صلة بالقرار، وينبغي طرحها بشكل استباقي لا تأجيلها، حتى يمكن تحليلها ومعالجتها بينما لا يزال هناك وقت للتأثير على النتيجة. الخيار (A) يعتمد فقط على مقارنة تاريخية لحظية ويتجاهل التوقع الأكثر صلة بالقرار، مما يعطي أصحاب المصلحة صورة ناقصة ومضللة. الخيار (B) يحجب معلومة مهمة إلى أن يفوت أوان التصرف بناءً عليها، مما يقوّض الشفافية واتخاذ القرار في الوقت المناسب. الخيار (C) يقفز إلى طلب مزيد من المال قبل فهم السبب الجذري وراء الاتجاه غير المواتي، وهو ما قد لا يكون الاستجابة الصحيحة.",
  },
  {
    questionEn:
      "A project team is repeatedly finding the same category of defects during final testing, all traceable to a similar coding mistake made across multiple components. A team member suggests adding more testers at the end of the process to catch these defects before release. What is the better approach to address this issue?",
    questionAr:
      "يكتشف فريق المشروع بشكل متكرر نفس فئة العيوب أثناء الاختبار النهائي، وجميعها تعود إلى خطأ برمجي متشابه تكرر عبر عدة مكونات. يقترح أحد أعضاء الفريق إضافة مزيد من المختبِرين في نهاية العملية لاكتشاف هذه العيوب قبل الإطلاق. ما هو النهج الأفضل لمعالجة هذه المشكلة؟",
    options: [
      ["Add more testers at the final testing stage, since catching defects before release is the most important quality objective", "إضافة مزيد من المختبِرين في مرحلة الاختبار النهائي، لأن اكتشاف العيوب قبل الإطلاق هو الهدف الأهم للجودة"],
      ["Accept the current defect rate as normal, since some level of defects is expected in any project", "قبول معدل العيوب الحالي باعتباره طبيعياً، لأن مستوى معيناً من العيوب متوقع في أي مشروع"],
      [
        "Conduct root-cause analysis on the recurring defect pattern and address it earlier in the development process (e.g., through coding standards, peer review, or targeted training) to prevent the mistake from recurring",
        "إجراء تحليل السبب الجذري (Root Cause Analysis) لنمط العيوب المتكرر ومعالجته في وقت أبكر من عملية التطوير (مثل معايير البرمجة، أو المراجعة من الأقران، أو التدريب الموجّه) لمنع تكرار الخطأ",
      ],
      ["Increase the acceptance criteria threshold so that this category of defect is no longer classified as a failure", "رفع عتبة معايير القبول (Acceptance Criteria) بحيث لم تعد هذه الفئة من العيوب تُصنَّف كفشل"],
    ],
    correctIndex: 2,
    explanationEn:
      "Quality management emphasizes preventing defects by addressing their root cause upstream, rather than relying on inspection at the end of the process to catch recurring problems - inspection alone does not stop the mistake from recurring, it only filters output after the fact. Option A increases inspection effort without addressing why the defect keeps occurring, so the underlying problem and the cost of repeatedly reworking it remain. Option B normalizes a preventable, recurring, traceable problem rather than investigating and improving it. Option D changes the definition of an acceptable outcome to make a real problem disappear on paper, which does not improve actual quality and misrepresents the deliverable's true condition.",
    explanationAr:
      "تركّز إدارة الجودة على منع العيوب من خلال معالجة سببها الجذري في مرحلة مبكرة، بدلاً من الاعتماد على الفحص (Inspection) في نهاية العملية لاكتشاف المشكلات المتكررة - فالفحص وحده لا يمنع تكرار الخطأ، بل يقتصر على تصفية المخرجات بعد وقوعه. الخيار (A) يزيد جهد الفحص دون معالجة سبب استمرار حدوث العيب، مما يُبقي المشكلة الأساسية وتكلفة إعادة العمل المتكررة قائمة. الخيار (B) يطبّع مشكلة متكررة وقابلة للتتبع والوقاية بدلاً من التحقيق فيها وتحسينها. الخيار (D) يغيّر تعريف النتيجة المقبولة لجعل مشكلة حقيقية تختفي على الورق، وهذا لا يحسّن الجودة الفعلية بل يشوّه الحالة الحقيقية للمخرج.",
  },
  {
    // Q8: precision-corrected explanation (Total Float / Critical Path) - scenario, options, correct answer, arithmetic unchanged.
    questionEn:
      "An activity that is not on the project's critical path has 5 days of total float remaining. The activity has just been delayed by 3 days due to a resource conflict. What is the MOST accurate interpretation of this situation?",
    questionAr:
      "يمتلك أحد الأنشطة غير الواقعة على المسار الحرج (Critical Path) للمشروع 5 أيام من التعويم الكلي المتبقي (Total Float). تأخر هذا النشاط للتو بمقدار 3 أيام بسبب تعارض في الموارد. ما هو التفسير الأدق لهذا الموقف؟",
    options: [
      [
        "The delay will directly push back the project's overall finish date, since any schedule delay affects the end date",
        "سيؤدي التأخير مباشرة إلى تأجيل تاريخ الانتهاء الإجمالي للمشروع، لأن أي تأخير في الجدول يؤثر على تاريخ الانتهاء",
      ],
      [
        "The activity can absorb this delay without affecting the project's overall finish date, though the remaining float should now be monitored closely",
        "يمكن للنشاط استيعاب هذا التأخير دون التأثير على تاريخ الانتهاء الإجمالي للمشروع، مع ضرورة مراقبة التعويم المتبقي عن كثب الآن",
      ],
      ["The delay has no importance at all and requires no further attention from the project manager", "التأخير لا يحمل أي أهمية إطلاقاً ولا يتطلب أي اهتمام إضافي من مدير المشروع"],
      ["The activity must immediately be added to the critical path, since it has now experienced a delay", "يجب إضافة النشاط فوراً إلى المسار الحرج، لأنه تعرض الآن للتأخير"],
    ],
    correctIndex: 1,
    explanationEn:
      "Total float represents how much an activity can be delayed without affecting the project's finish date, as long as the delay does not consume more float than is available. This activity had 5 days of total float; a 3-day delay consumes 3 of those days, leaving 2 days of total float remaining. Based on the information given, the project's finish date is therefore not yet affected by this delay - but the activity now has less scheduling flexibility than before, so it is worth monitoring closely going forward. Option A incorrectly assumes any delay on any activity affects the finish date, which is true only for critical-path activities (zero float) or delays that exceed available float. Option C dismisses the situation entirely, ignoring that float has decreased and warrants attention even without immediate schedule impact. Option D confuses \"has experienced a delay\" with \"is now critical\" - experiencing a delay does not, by itself, make an activity part of the critical path. The critical path is fundamentally the longest path through the schedule network that determines the project's overall duration; zero total float is commonly associated with critical activities, but based on the information given, this activity still has 2 days of float remaining, so nothing here indicates it has become critical - only that its scheduling flexibility has decreased.",
    explanationAr:
      "يمثّل التعويم الكلي (Total Float) مقدار ما يمكن تأخير النشاط به دون التأثير على تاريخ انتهاء المشروع، طالما أن التأخير لا يستهلك تعويماً أكبر مما هو متاح. كان لدى هذا النشاط 5 أيام من التعويم الكلي؛ يستهلك التأخير البالغ 3 أيام ثلاثة من هذه الأيام، ليتبقى يومان من التعويم الكلي. واستناداً إلى المعطيات المتوفرة، فإن تاريخ انتهاء المشروع لم يتأثر بعد بهذا التأخير - لكن النشاط أصبح الآن يملك مرونة زمنية أقل من ذي قبل، لذا يستحق المراقبة عن كثب لاحقاً. الخيار (A) يفترض خطأً أن أي تأخير في أي نشاط يؤثر على تاريخ الانتهاء، وهذا صحيح فقط بالنسبة لأنشطة المسار الحرج (تعويم صفري) أو التأخيرات التي تتجاوز التعويم المتاح. الخيار (C) يتجاهل الموقف كلياً، متجاهلاً أن التعويم قد انخفض ويستحق الاهتمام حتى دون تأثير فوري على الجدول. الخيار (D) يخلط بين \"تعرّض للتأخير\" و\"أصبح حرجاً الآن\" - فتعرّض النشاط لتأخير لا يجعله تلقائياً جزءاً من المسار الحرج. المسار الحرج (Critical Path) هو في جوهره أطول مسار عبر شبكة الجدول الزمني يحدد مدة المشروع؛ ويرتبط التعويم الكلي الصفري (Zero Total Float) عادة بالأنشطة الحرجة، لكن استناداً إلى المعطيات المتوفرة، لا يزال لدى هذا النشاط يومان من التعويم، لذا لا يوجد ما يشير إلى أنه أصبح حرجاً - بل فقط أن مرونته الزمنية قد انخفضت.",
  },
  {
    questionEn:
      "A project's status report shows the current milestone as \"on track\" (green), based on the fact that no activities are late as of today. However, the trend over the past several reporting periods shows productivity steadily declining, and the forecast for the next milestone indicates a likely delay if the trend continues. What should the project manager do?",
    questionAr:
      "يُظهر تقرير حالة المشروع أن المعلم الحالي \"على المسار الصحيح\" (أخضر)، استناداً إلى عدم تأخر أي نشاط حتى اليوم. لكن الاتجاه (Trend) خلال فترات التقارير الأخيرة يُظهر تراجعاً مستمراً في الإنتاجية، ويشير التوقع (Forecast) للمعلم القادم إلى احتمال حدوث تأخير إذا استمر هذا الاتجاه. ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      [
        "Report only the current \"on track\" status, since the next milestone has not yet been missed and forecasts are not yet confirmed facts",
        "الإبلاغ عن الحالة \"على المسار الصحيح\" الحالية فقط، لأن المعلم القادم لم يُفوَّت بعد والتوقعات ليست حقائق مؤكدة بعد",
      ],
      [
        "Change the status to red immediately, even though no activities are currently late, to reflect the negative trend",
        "تغيير الحالة إلى اللون الأحمر فوراً، رغم عدم تأخر أي نشاط حالياً، لتعكس الاتجاه السلبي",
      ],
      [
        "Wait until the next milestone is actually missed before communicating any concern, to avoid alarming stakeholders unnecessarily",
        "الانتظار حتى يُفوَّت المعلم القادم فعلياً قبل إبلاغ أي قلق، لتجنب إثارة قلق غير ضروري لدى أصحاب المصلحة",
      ],
      [
        "Report the current milestone status accurately while also communicating the declining trend and forecast, and investigate the cause of the productivity decline",
        "الإبلاغ عن حالة المعلم الحالي بدقة مع الإفصاح أيضاً عن الاتجاه والتوقع المتراجعين، والتحقيق في سبب تراجع الإنتاجية",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "Meaningful performance reporting distinguishes current point-in-time status from trend and forecast information - both matter, and hiding a deteriorating trend behind a currently-green status misrepresents the project's real trajectory. The project manager should report the facts accurately at each level (today's status is genuinely on track) while also surfacing the trend and forecast and investigating their root cause, so the issue can be addressed before it becomes a missed milestone. Option A is technically accurate about today's status but omits decision-relevant forward-looking information - a form of incomplete, misleading reporting. Option B misrepresents the current, factual status in order to reflect a separate piece of information (the trend); accuracy at each level matters rather than overriding one true data point with another. Option C delays raising a known, worsening trend until it is too late to act on it proactively.",
    explanationAr:
      "يميّز الإبلاغ الفعّال عن الأداء (Performance Reporting) بين الحالة اللحظية الحالية ومعلومات الاتجاه والتوقع - فكلاهما مهم، وإخفاء اتجاه متراجع خلف حالة خضراء حالياً يشوّه المسار الحقيقي للمشروع. ينبغي لمدير المشروع الإبلاغ عن الحقائق بدقة على كل مستوى (فالحالة اليوم على المسار الصحيح فعلاً) مع الإفصاح أيضاً عن الاتجاه والتوقع والتحقيق في سببهما الجذري، حتى يمكن معالجة المشكلة قبل أن تتحول إلى معلم مُفوَّت. الخيار (A) دقيق تقنياً بشأن حالة اليوم لكنه يحذف معلومات استشرافية ذات صلة بالقرار - وهو شكل من أشكال الإبلاغ الناقص والمضلل. الخيار (B) يشوّه الحالة الواقعية الحالية من أجل عكس معلومة منفصلة (الاتجاه)؛ فالدقة على كل مستوى مهمة، لا استبدال حقيقة صحيحة بأخرى. الخيار (C) يؤجل الإفصاح عن اتجاه معروف ومتراجع إلى أن يفوت أوان التصرف الاستباقي بشأنه.",
  },
  {
    questionEn:
      "All project deliverables have been built and tested, and the team considers the technical work finished. However, the customer has not yet formally accepted the final deliverables, and the operational support team has not received a handover or knowledge transfer. Several team members are ready to move on to their next assignments. What should the project manager do?",
    questionAr:
      "تم بناء واختبار جميع مخرجات المشروع، ويعتبر الفريق أن العمل التقني قد انتهى. لكن العميل لم يعتمد المخرجات النهائية بشكل رسمي بعد، ولم يتلقَّ فريق الدعم التشغيلي أي تسليم أو نقل للمعرفة (Knowledge Transfer). عدد من أعضاء الفريق جاهزون للانتقال إلى مهامهم القادمة. ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      [
        "Release team members now that the technical work is finished, since formal acceptance and handover can be completed afterward by a smaller team",
        "تسريح أعضاء الفريق الآن بما أن العمل التقني قد انتهى، لأن الاعتماد الرسمي والتسليم يمكن إتمامهما لاحقاً بفريق أصغر",
      ],
      [
        "Complete formal acceptance with the customer and ensure a proper handover/knowledge transfer to the operational team before releasing project team members",
        "إتمام الاعتماد الرسمي (Formal Acceptance) مع العميل والتأكد من تسليم/نقل معرفة (Knowledge Transfer) سليم إلى الفريق التشغيلي قبل تسريح أعضاء فريق المشروع",
      ],
      [
        "Consider the project closed once testing is complete, since formal acceptance is a documentation formality with no real impact on the outcome",
        "اعتبار المشروع مغلقاً بمجرد اكتمال الاختبار، لأن الاعتماد الرسمي مجرد إجراء توثيقي شكلي لا تأثير فعلي له على النتيجة",
      ],
      ["Proceed directly to conducting the lessons-learned session, since that is the final step of closing a project", "المضي مباشرة إلى عقد جلسة الدروس المستفادة (Lessons Learned)، لأنها الخطوة الأخيرة في إغلاق المشروع"],
    ],
    correctIndex: 1,
    explanationEn:
      "Deliverables being technically finished is not the same as the project being ready for closure. Formal acceptance confirms the customer agrees the work meets what was agreed, and handover/knowledge transfer ensures operational readiness and continuity; releasing the team before these are complete risks losing the people needed to resolve acceptance issues or support the handover. Option A risks losing critical people and knowledge exactly when they may still be needed, based on an assumption that acceptance and handover are minor remaining tasks. Option C treats formal acceptance as a mere formality, when it is the actual mechanism confirming the customer's agreement that the project delivered what was required. Option D skips formal acceptance and handover entirely and jumps to a genuinely important but later closure activity out of proper sequence.",
    explanationAr:
      "اكتمال المخرجات تقنياً ليس مماثلاً لجهوزية المشروع للإغلاق. يؤكد الاعتماد الرسمي (Formal Acceptance) موافقة العميل على أن العمل يستوفي ما تم الاتفاق عليه، بينما يضمن التسليم/نقل المعرفة (Knowledge Transfer) الجاهزية التشغيلية والاستمرارية؛ وتسريح الفريق قبل إتمام ذلك يخاطر بفقدان الأشخاص اللازمين لحل مسائل الاعتماد أو دعم التسليم. الخيار (A) يخاطر بفقدان أشخاص ومعرفة بالغي الأهمية تحديداً في الوقت الذي قد لا تزال هناك حاجة إليهم، بناءً على افتراض أن الاعتماد والتسليم مهام ثانوية متبقية. الخيار (C) يعامل الاعتماد الرسمي كمجرد إجراء شكلي، بينما هو في الواقع الآلية الفعلية التي تؤكد موافقة العميل على أن المشروع سلّم ما هو مطلوب. الخيار (D) يتخطى الاعتماد الرسمي والتسليم بالكامل وينتقل إلى نشاط إغلاق مهم فعلاً لكنه لاحق، خارج تسلسله الصحيح.",
  },
];
