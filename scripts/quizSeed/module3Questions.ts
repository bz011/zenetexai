import type { QuizQuestionSeed } from "./types";

/** Module 3 - Agile & Hybrid. FINAL APPROVED (Q10 rewritten; all 10 re-lettered for balance). */
export const module3Questions: QuizQuestionSeed[] = [
  {
    questionEn:
      "Midway through an iteration, a key stakeholder requests a significant change to a feature based on new market feedback. According to the Agile mindset, how should the team primarily view this request?",
    questionAr:
      "في منتصف التكرار (Iteration)، يطلب أحد أصحاب المصلحة الرئيسيين تغييراً جوهرياً في إحدى الميزات بناءً على تغذية راجعة جديدة من السوق. وفقاً للعقلية الرشيقة (Agile Mindset)، كيف ينبغي للفريق أن ينظر إلى هذا الطلب بشكل أساسي؟",
    options: [
      [
        "As a disruption that should be deferred until the current plan is fully honored",
        "كاضطراب ينبغي تأجيله إلى أن يتم الالتزام بالخطة الحالية بالكامل",
      ],
      [
        "As a scope violation that must be escalated for formal change control before any discussion",
        "كتجاوز للنطاق يجب تصعيده رسمياً عبر ضبط التغيير قبل أي نقاش",
      ],
      [
        "As valuable new information that should be welcomed and considered for upcoming work",
        "كمعلومة جديدة ذات قيمة ينبغي الترحيب بها والنظر في إدراجها ضمن العمل القادم",
      ],
      ["As a sign that the original requirements were gathered incorrectly", "كدليل على أن المتطلبات الأصلية لم تُجمع بشكل صحيح"],
    ],
    correctIndex: 2,
    explanationEn:
      "The Agile Manifesto values \"responding to change over following a plan.\" Changing requirements, even late in delivery, are expected and treated as an opportunity to increase value for the customer - not a disruption. Option A treats change as something to resist, which contradicts the mindset. Option D assumes a flaw in prior work rather than accepting that markets and understanding evolve. Option B applies a predictive, formal change-control mindset to a situation where lightweight backlog reprioritization is the appropriate response.",
    explanationAr:
      "يُقدّر بيان أجايل (Agile Manifesto) \"الاستجابة للتغيير أكثر من اتباع خطة\". فالتغيّر في المتطلبات، حتى في مراحل متأخرة من التنفيذ، أمر متوقع ويُنظر إليه كفرصة لزيادة القيمة للعميل، لا كاضطراب. الخيار (A) يتعامل مع التغيير كأمر يجب مقاومته، وهذا يتعارض مع العقلية الرشيقة. الخيار (D) يفترض وجود خلل في العمل السابق بدلاً من تقبّل أن فهم السوق يتطور. الخيار (B) يطبّق عقلية ضبط التغيير الرسمية التنبؤية على موقف يناسبه إعادة ترتيب أولويات المتراكم (Backlog) بشكل مرن.",
  },
  {
    questionEn:
      "A Product Owner tells a Developer exactly which specific task to work on next and how many hours to spend on it. Which Scrum principle does this action most directly conflict with?",
    questionAr:
      "يخبر مالك المنتج (Product Owner) أحد المطورين بالضبط بالمهمة المحددة التي يجب العمل عليها تالياً وعدد الساعات التي يجب تخصيصها لها. مع أي مبدأ من مبادئ سكرم يتعارض هذا الإجراء بشكل مباشر؟",
    options: [
      ["Self-management of the Developers", "الإدارة الذاتية للمطورين (Self-Management)"],
      ["Definition of Done", "تعريف الإنجاز (Definition of Done)"],
      ["Sprint Goal", "هدف السبرنت (Sprint Goal)"],
      ["Product Backlog refinement", "تنقيح المتراكم (Product Backlog Refinement)"],
    ],
    correctIndex: 0,
    explanationEn:
      "In Scrum, Developers are self-managing: they decide internally who does what work and how, based on the Sprint Backlog they own. The Product Owner is accountable for maximizing product value and ordering the Product Backlog - not for assigning individual tasks or dictating hours. This is a common misunderstanding that turns the Product Owner into a traditional task-assigning manager. The Definition of Done (B) is a shared quality standard, the Sprint Goal (C) is the objective for the Sprint, and Product Backlog refinement (D) is about clarifying and ordering backlog items - none of these are what this action violates.",
    explanationAr:
      "في سكرم، يتمتع المطورون بالإدارة الذاتية (Self-Management): إذ يقررون داخلياً من يقوم بأي عمل وكيف، استناداً إلى سجل السبرنت (Sprint Backlog) الذي يملكونه. أما مالك المنتج فهو مسؤول عن تعظيم قيمة المنتج وترتيب المتراكم (Product Backlog) - وليس عن تخصيص مهام فردية أو تحديد عدد الساعات. هذا التصرف يمثل التباساً شائعاً يحوّل مالك المنتج إلى مدير تقليدي يوزّع المهام. أما تعريف الإنجاز (B) فهو معيار جودة مشترك، وهدف السبرنت (C) هو غاية السبرنت، وتنقيح المتراكم (D) يتعلق بتوضيح وترتيب عناصر المتراكم - وليس أياً منها ما ينتهكه هذا التصرف.",
  },
  {
    questionEn:
      "A team using Kanban notices that many work items are started but few are finished, and cycle time is increasing. A team member suggests assigning even more new items to keep everyone busy. What should the team do instead?",
    questionAr:
      "لاحظ فريق يستخدم كانبان (Kanban) أن عناصر عمل كثيرة قد بدأت لكن القليل منها اكتمل، وأن زمن الدورة (Cycle Time) آخذ في الازدياد. يقترح أحد أعضاء الفريق تخصيص المزيد من العناصر الجديدة لإبقاء الجميع مشغولين. ماذا ينبغي للفريق أن يفعل بدلاً من ذلك؟",
    options: [
      [
        "Increase the work-in-progress (WIP) limits so more items can be started in parallel",
        "زيادة حدود العمل قيد التنفيذ (WIP) للسماح ببدء المزيد من العناصر بالتوازي",
      ],
      ["Assign more new items so idle team members remain fully utilized", "تخصيص المزيد من العناصر الجديدة لضمان بقاء الأعضاء غير المشغولين مستغَلّين بالكامل"],
      ["Remove WIP limits entirely since they are slowing the team down", "إلغاء حدود العمل قيد التنفيذ (WIP) بالكامل لأنها تُبطئ الفريق"],
      [
        "Enforce or lower WIP limits to force finishing items before starting new ones",
        "فرض أو تخفيض حدود العمل قيد التنفيذ (WIP) لإلزام إنهاء العناصر قبل بدء عناصر جديدة",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "In Kanban, rising cycle time with many started-but-unfinished items is a classic sign of too much work in progress. Enforcing or lowering WIP limits forces the team to finish existing work before pulling new items, which improves flow and typically reduces cycle time. Options A, B, and C all increase or remove the very constraint that would fix the problem, based on the misunderstanding that keeping everyone \"busy\" improves throughput - in flow-based systems, starting more work without finishing it worsens flow rather than improving it.",
    explanationAr:
      "في كانبان، يُعد ازدياد زمن الدورة مع وجود عناصر كثيرة بدأت ولم تكتمل مؤشراً كلاسيكياً على زيادة العمل قيد التنفيذ. فرض أو تخفيض حدود WIP يُلزم الفريق بإنهاء العمل الحالي قبل سحب عناصر جديدة، مما يحسّن التدفق (Flow) ويقلل زمن الدورة عادة. أما الخيارات (A) و(B) و(C) فجميعها تزيد أو تلغي القيد الذي من شأنه معالجة المشكلة، استناداً إلى فهم خاطئ مفاده أن إبقاء الجميع \"مشغولين\" يحسّن الإنتاجية - بينما في الأنظمة القائمة على التدفق، بدء عمل إضافي دون إنهاء العمل الحالي يزيد الأمر سوءاً بدلاً من تحسينه.",
  },
  {
    questionEn:
      "A team building software in small increments decides to build only the features currently needed, gets them reviewed by real users quickly, and avoids producing extensive documentation that no one will use. Which Lean principle is this team primarily applying?",
    questionAr:
      "يقرر فريق يطوّر برمجيات على شكل زيادات صغيرة أن يبني فقط الميزات المطلوبة حالياً، ويحصل على مراجعة سريعة من مستخدمين فعليين، ويتجنب إعداد وثائق مطوّلة لن يستخدمها أحد. أي مبدأ من مبادئ Lean يطبّقه هذا الفريق بشكل أساسي؟",
    options: [
      ["Amplifying learning", "تضخيم التعلم (Amplifying Learning)"],
      ["Eliminating waste", "التخلص من الهدر (Eliminating Waste)"],
      ["Deciding as late as possible", "اتخاذ القرار في أبعد وقت ممكن (Deciding as Late as Possible)"],
      ["Building integrity in", "بناء التكامل (Building Integrity In)"],
    ],
    correctIndex: 1,
    explanationEn:
      "Lean identifies unnecessary work - such as building unneeded features or producing documentation no one uses - as waste, and focuses on removing it so effort concentrates on what actually delivers value. Amplifying learning (A) is about using feedback loops to learn faster, deciding late (C) is about deferring irreversible decisions until more information is available, and building integrity in (D) is about ensuring the whole system is coherent and fit for purpose - this scenario is centered on cutting unnecessary work, which is specifically waste elimination.",
    explanationAr:
      "يعتبر Lean العمل غير الضروري - مثل بناء ميزات غير مطلوبة أو إعداد وثائق لن يستخدمها أحد - هدراً (Waste)، ويركّز على التخلص منه بحيث يتركز الجهد على ما يحقق قيمة فعلية. أما تضخيم التعلم (A) فيتعلق باستخدام حلقات التغذية الراجعة للتعلم بشكل أسرع، واتخاذ القرار في أبعد وقت ممكن (C) يتعلق بتأجيل القرارات التي يصعب التراجع عنها إلى حين توفر معلومات أكثر، وبناء التكامل (D) يتعلق بضمان تماسك النظام ككل وملاءمته للغرض - بينما هذا السيناريو يتمحور حول تقليص العمل غير الضروري، وهو تحديداً التخلص من الهدر.",
  },
  {
    questionEn:
      "A project has two components: a data-migration component with well-understood, stable regulatory requirements that must be planned and approved in detail before execution, and a new customer-facing feature set where requirements are expected to evolve based on user feedback. What is the most appropriate life-cycle approach, and why?",
    questionAr:
      "يتضمن أحد المشاريع مكوّنين: مكوّن ترحيل بيانات (Data Migration) له متطلبات تنظيمية مستقرة ومفهومة جيداً ويجب التخطيط لها واعتمادها بالتفصيل قبل التنفيذ، ومجموعة ميزات جديدة موجهة للعملاء يُتوقع أن تتطور متطلباتها بناءً على تغذية راجعة من المستخدمين. ما هو نهج دورة الحياة الأنسب، ولماذا؟",
    options: [
      [
        "A hybrid approach, applying predictive planning to the stable regulatory component and adaptive delivery to the evolving feature set",
        "نهج هجين (Hybrid)، بتطبيق التخطيط التنبؤي على المكوّن التنظيمي المستقر والتسليم التكيّفي على مجموعة الميزات المتطورة",
      ],
      [
        "A fully predictive approach, since the regulatory component requires detailed upfront planning",
        "نهج تنبؤي بالكامل، لأن مكوّن الامتثال التنظيمي يتطلب تخطيطاً تفصيلياً مسبقاً",
      ],
      [
        "A fully adaptive approach, since responding to changing requirements is always the priority",
        "نهج تكيّفي بالكامل، لأن الاستجابة للمتطلبات المتغيرة هي الأولوية دائماً",
      ],
      [
        "A hybrid approach, applying exactly 50% predictive process and 50% adaptive process across the entire project regardless of component",
        "نهج هجين، بتطبيق 50% من العمليات التنبؤية و50% من العمليات التكيّفية على المشروع بأكمله بغض النظر عن المكوّن",
      ],
    ],
    correctIndex: 0,
    explanationEn:
      "Hybrid is the deliberate tailoring of predictive and adaptive practices to match the actual characteristics of different parts of a project - here, predictive planning suits the stable, well-defined regulatory component, while adaptive delivery suits the evolving feature set. Option B ignores the genuine uncertainty in the feature set, and Option C ignores the genuine stability and compliance needs of the migration component. Option D reflects a common misconception: Hybrid is not a fixed formula or \"half-and-half\" split applied uniformly - it is a context-driven decision about which approach best fits each part of the work.",
    explanationAr:
      "يمثّل النهج الهجين (Hybrid) تكييفاً متعمداً للممارسات التنبؤية والتكيّفية بما يناسب الخصائص الفعلية لأجزاء مختلفة من المشروع - فهنا يناسب التخطيط التنبؤي المكوّن التنظيمي المستقر والمحدد جيداً، بينما يناسب التسليم التكيّفي مجموعة الميزات المتطورة. الخيار (B) يتجاهل عدم اليقين الحقيقي في مجموعة الميزات، والخيار (C) يتجاهل الاستقرار الحقيقي ومتطلبات الامتثال لمكوّن الترحيل. أما الخيار (D) فيعكس التباساً شائعاً: فالهجين ليس معادلة ثابتة أو تقسيماً \"نصف-نصف\" يُطبَّق بشكل موحّد، بل هو قرار مبني على السياق حول أنسب نهج لكل جزء من العمل.",
  },
  {
    questionEn:
      "Early in a new product's backlog refinement, the team is asked to estimate several unfamiliar items. A stakeholder insists on estimates in exact hours to two decimal places. Why would most Agile teams prefer relative estimation (e.g., story points) instead in this situation?",
    questionAr:
      "في وقت مبكر من تنقيح متراكم منتج جديد، يُطلب من الفريق تقدير عدة عناصر غير مألوفة. يصرّ أحد أصحاب المصلحة على تقديرات بالساعات بدقة رقمين عشريين. لماذا تفضّل معظم فرق أجايل التقدير النسبي (مثل نقاط القصة - Story Points) بدلاً من ذلك في هذا الموقف؟",
    options: [
      [
        "Because relative estimation always produces more accurate forecasts than any time-based estimate",
        "لأن التقدير النسبي ينتج دائماً توقعات أكثر دقة من أي تقدير قائم على الوقت",
      ],
      [
        "Because story points are required by the Scrum Guide and cannot be substituted",
        "لأن نقاط القصة مطلوبة إلزامياً بموجب دليل سكرم ولا يمكن استبدالها",
      ],
      [
        "Because relative estimation eliminates the need for any future re-estimation as the team learns more",
        "لأن التقدير النسبي يلغي الحاجة لأي إعادة تقدير مستقبلية كلما تعلّم الفريق المزيد",
      ],
      [
        "Because precise hour-based estimates for unfamiliar work create false confidence, while relative sizing better reflects genuine uncertainty",
        "لأن التقديرات الدقيقة بالساعات لعمل غير مألوف تخلق ثقة زائفة، بينما يعكس التحجيم النسبي عدم اليقين الفعلي بشكل أفضل",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "When requirements or work are not yet well understood, expressing estimates as precise hours implies a level of certainty the team doesn't actually have - false precision. Relative estimation compares item size against other items, which is easier to judge accurately under uncertainty and doesn't overstate confidence. Option A overclaims that relative estimation is universally \"more accurate\" rather than more honest about uncertainty. Option B is factually incorrect - the Scrum Guide does not mandate story points as a required practice. Option C is false - teams continue to re-estimate and refine as they learn more, regardless of the estimation technique used.",
    explanationAr:
      "عندما لا تكون المتطلبات أو العمل مفهومة جيداً بعد، فإن التعبير عن التقديرات بساعات دقيقة يوحي بمستوى من اليقين لا يملكه الفريق فعلياً - وهذا ما يُعرف بالدقة الزائفة (False Precision). يقارن التقدير النسبي حجم العنصر بعناصر أخرى، وهو أسهل في الحكم عليه بدقة في ظل عدم اليقين، ولا يبالغ في مستوى الثقة. الخيار (A) يبالغ بادعاء أن التقدير النسبي \"أكثر دقة\" دائماً بدلاً من كونه أكثر صدقاً بشأن عدم اليقين. الخيار (B) غير صحيح واقعياً - فدليل سكرم (Scrum Guide) لا يفرض نقاط القصة كممارسة إلزامية. الخيار (C) غير صحيح - فالفرق تستمر في إعادة التقدير والتنقيح كلما تعلّمت المزيد، بغض النظر عن أسلوب التقدير المستخدم.",
  },
  {
    questionEn:
      "An Agile team is struggling to resolve a technical disagreement and misses a sprint commitment as a result. Acting as a servant leader, what should the team's leader do first?",
    questionAr:
      "يواجه فريق أجايل صعوبة في حل خلاف تقني، وينتج عن ذلك عدم الوفاء بالتزام السبرنت. بصفته قائداً خادماً (Servant Leader)، ماذا ينبغي أن يفعل قائد الفريق أولاً؟",
    options: [
      ["Make the technical decision personally and instruct the team to implement it", "اتخاذ القرار التقني بنفسه وتوجيه الفريق لتنفيذه"],
      ["Reassign the disagreement to a single senior team member to decide unilaterally", "إسناد الخلاف إلى عضو أقدم واحد في الفريق ليقرر بشكل منفرد"],
      [
        "Help the team identify and remove the impediment blocking their own resolution of the disagreement",
        "مساعدة الفريق على تحديد وإزالة العائق الذي يمنعه من حل الخلاف بنفسه",
      ],
      ["Escalate the disagreement to upper management for a binding decision", "تصعيد الخلاف إلى الإدارة العليا لاتخاذ قرار ملزم"],
    ],
    correctIndex: 2,
    explanationEn:
      "Servant leadership focuses on removing impediments and enabling the team to solve problems themselves, rather than directing the solution - this preserves self-management while still providing support. Option A substitutes command-and-control decision-making for team ownership. Option B bypasses the team's collective self-management by handing authority to one individual. Option D escalates a resolvable team-level technical disagreement unnecessarily to an external authority, which undermines the team's autonomy without first attempting facilitation.",
    explanationAr:
      "تركّز القيادة الخادمة (Servant Leadership) على إزالة العوائق وتمكين الفريق من حل المشكلات بنفسه، بدلاً من توجيه الحل مباشرة - وهذا يحافظ على الإدارة الذاتية مع تقديم الدعم اللازم. الخيار (A) يستبدل ملكية الفريق للقرار بأسلوب القيادة الآمرة (Command-and-Control). الخيار (B) يتجاوز الإدارة الذاتية الجماعية للفريق بمنح السلطة لفرد واحد. الخيار (D) يصعّد خلافاً تقنياً يمكن حله على مستوى الفريق إلى جهة خارجية دون داعٍ، مما يقوّض استقلالية الفريق دون محاولة التيسير أولاً.",
  },
  {
    questionEn:
      "A manager compares the velocity of two different Scrum teams and announces that the team with the higher number is more productive, and both teams should aim to keep increasing their velocity every sprint. What is the main problem with this approach?",
    questionAr:
      "يقارن أحد المدراء سرعة (Velocity) فريقَي سكرم مختلفين ويعلن أن الفريق صاحب الرقم الأعلى أكثر إنتاجية، وأن على كلا الفريقين السعي لزيادة سرعتهما باستمرار في كل سبرنت. ما المشكلة الأساسية في هذا التوجه؟",
    options: [
      [
        "Velocity should only be used to compare teams against each other, never for forecasting",
        "يجب استخدام السرعة (Velocity) فقط لمقارنة الفرق ببعضها، وليس للتنبؤ أبداً",
      ],
      [
        "Velocity is team-specific and based on that team's own point scale, so comparing teams or treating it as a target to maximize misuses the metric and can encourage inflated estimates",
        "السرعة (Velocity) خاصة بكل فريق ومبنية على مقياس النقاط الخاص به، لذا فإن مقارنة الفرق ببعضها أو التعامل معها كهدف يجب تعظيمه يسيء استخدام المقياس وقد يشجع على تضخيم التقديرات",
      ],
      ["Velocity is not a valid Agile metric and should not be tracked at all", "السرعة (Velocity) ليست مقياساً رشيقاً صحيحاً ولا ينبغي تتبعها إطلاقاً"],
      [
        "Velocity should be reported directly to executive management as a key performance indicator for individual developers",
        "يجب رفع السرعة (Velocity) مباشرة إلى الإدارة التنفيذية كمؤشر أداء رئيسي للمطورين الأفراد",
      ],
    ],
    correctIndex: 1,
    explanationEn:
      "Velocity reflects one team's own historical throughput using that team's own relative-sizing scale, so it is meaningful only for that team's own sprint planning and forecasting - not for comparing across teams, since point scales aren't standardized between teams. Treating it as a target to be continuously maximized also creates an incentive to inflate estimates rather than improve genuine delivery, turning a learning/forecasting tool into a punitive KPI. Option A is wrong because forecasting is exactly the legitimate use of velocity. Option C overcorrects - velocity is a valid metric when used correctly. Option D compounds the misuse by turning it into an individual performance measure, which velocity was never designed to do (it is a team-level metric).",
    explanationAr:
      "تعكس السرعة (Velocity) الإنتاجية التاريخية لفريق معيّن باستخدام مقياس التحجيم النسبي الخاص به، لذا فهي ذات معنى فقط لتخطيط والتنبؤ بسبرنتات ذلك الفريق نفسه - وليس لمقارنة الفرق ببعضها، لأن مقاييس النقاط غير موحدة بين الفرق. كما أن التعامل معها كهدف يجب تعظيمه باستمرار يخلق حافزاً لتضخيم التقديرات بدلاً من تحسين التسليم الفعلي، مما يحوّل أداة تعلم وتنبؤ إلى مؤشر أداء عقابي. الخيار (A) خاطئ لأن التنبؤ هو تحديداً الاستخدام المشروع للسرعة. الخيار (C) مبالغ فيه - فالسرعة مقياس صحيح عند استخدامه بشكل سليم. الخيار (D) يفاقم سوء الاستخدام بتحويلها إلى مقياس أداء فردي، وهو أمر لم تُصمم السرعة له أساساً (فهي مقياس على مستوى الفريق).",
  },
  {
    questionEn:
      "A team is building a new product and decides not to show any working functionality to stakeholders until the final release, reasoning that early versions are \"not polished enough\" to share. What risk does this approach create from an Agile perspective?",
    questionAr:
      "يقرر فريق يبني منتجاً جديداً عدم عرض أي وظائف عاملة على أصحاب المصلحة حتى الإصدار النهائي، بحجة أن النسخ المبكرة \"غير مكتملة بما يكفي\" للمشاركة. ما الخطر الذي يخلقه هذا النهج من منظور أجايل؟",
    options: [
      ["It has no real risk, since stakeholders only need to see a fully finished product", "لا يشكّل خطراً حقيقياً، لأن أصحاب المصلحة يحتاجون فقط لرؤية منتج مكتمل بالكامل"],
      ["It improves quality, since the team has more time to polish the product before any feedback", "يحسّن الجودة، لأن الفريق يحصل على وقت أطول لتحسين المنتج قبل أي تغذية راجعة"],
      ["It only affects the Product Owner's satisfaction and has no broader project impact", "يؤثر فقط على رضا مالك المنتج وليس له أي تأثير أوسع على المشروع"],
      [
        "It delays discovery of misunderstandings or misaligned expectations until it is too late to adjust cheaply",
        "يؤخر اكتشاف سوء الفهم أو عدم توافق التوقعات إلى وقت متأخر يصبح فيه التعديل مكلفاً",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "Agile approaches rely on frequent delivery of working increments specifically so misunderstandings, wrong assumptions, or changing needs are surfaced early, when they are cheap to correct. Withholding all feedback until final release reintroduces the late-validation risk that iterative/incremental delivery is designed to prevent - by the time stakeholders see it, correcting course is far more expensive. Option A and C both understate the impact of deferred feedback, and Option B incorrectly assumes withholding feedback improves quality, when in practice continuous feedback is what helps the team course-correct and build the right thing.",
    explanationAr:
      "تعتمد أساليب أجايل على التسليم المتكرر لزيادات عاملة تحديداً لكي يظهر سوء الفهم أو الافتراضات الخاطئة أو تغيّر الاحتياجات مبكراً، حين يكون تصحيحها منخفض التكلفة. حجب أي تغذية راجعة حتى الإصدار النهائي يعيد خطر التحقق المتأخر (Late Validation) الذي صُممت أساليب التسليم التكراري والتزايدي أساساً لمنعه - فبحلول الوقت الذي يرى فيه أصحاب المصلحة المنتج، يصبح تصحيح المسار أكثر تكلفة بكثير. يقلل كل من الخيارين (A) و(C) من أهمية تأثير تأجيل التغذية الراجعة، ويفترض الخيار (B) خطأً أن حجب التغذية الراجعة يحسّن الجودة، بينما التغذية الراجعة المستمرة هي فعلياً ما يساعد الفريق على تصحيح المسار وبناء المنتج الصحيح.",
  },
  {
    // REWRITTEN per Zaid's feedback: exposing/addressing risk early via feedback/inspection/learning, complementing (not replacing) formal risk management.
    questionEn:
      "A project team delivering a new capability in short iterations shows working functionality to stakeholders every few weeks, gathers their feedback, and adjusts the backlog accordingly. How does this way of working primarily help the team manage project risk?",
    questionAr:
      "يقوم فريق مشروع يسلّم قدرة جديدة عبر تكرارات قصيرة بعرض وظائف عاملة على أصحاب المصلحة كل بضعة أسابيع، ويجمع تغذيتهم الراجعة، ويعدّل المتراكم (Backlog) بناءً عليها. كيف تساعد طريقة العمل هذه الفريق بشكل أساسي على إدارة مخاطر المشروع؟",
    options: [
      [
        "By exposing uncertainty, technical problems, and misaligned expectations early through frequent inspection of real working results, allowing the team to learn and adjust continuously; this complements rather than replaces explicit risk identification and response planning",
        "من خلال كشف عدم اليقين والمشكلات التقنية وعدم توافق التوقعات مبكراً عبر الفحص المتكرر للنتائج العاملة الفعلية، مما يتيح للفريق التعلم والتعديل باستمرار؛ وهذا يكمّل ممارسات تحديد المخاطر والاستجابة لها الصريحة، لا يحل محلها",
      ],
      [
        "By removing the need to identify or plan for risk at all, since short iterations are assumed to be too brief for meaningful risks to occur",
        "من خلال إلغاء الحاجة لتحديد المخاطر أو التخطيط لها إطلاقاً، على افتراض أن التكرارات القصيرة أقصر من أن تسمح بحدوث مخاطر ذات أهمية",
      ],
      [
        "By shifting all responsibility for recognizing and resolving risk to the Product Owner, since Developers are expected to focus only on building features",
        "من خلال نقل المسؤولية الكاملة عن تحديد المخاطر ومعالجتها إلى مالك المنتج (Product Owner)، باعتبار أن المطورين يركزون فقط على بناء الميزات",
      ],
      [
        "By managing risk in the same way regardless of how frequently the team delivers, since delivery frequency has no real effect on how early problems are discovered",
        "من خلال إدارة المخاطر بنفس الطريقة بغض النظر عن وتيرة التسليم، لأن تكرار التسليم لا يؤثر فعلياً على مدى مبكر اكتشاف المشكلات",
      ],
    ],
    correctIndex: 0,
    explanationEn:
      "Adaptive delivery helps manage risk primarily by exposing it early and often: short iterations, frequent inspection of working results, incremental delivery, and continuous learning allow the team to detect uncertainty, technical issues, and misaligned expectations sooner, while adjustments are still inexpensive to make. This works alongside - not instead of - explicit risk-management practices such as risk identification, analysis, and response planning; both adaptive and predictive approaches use deliberate risk management, but adaptive delivery adds a continuous, built-in mechanism for earlier detection. Option B incorrectly assumes that short iterations make risk irrelevant - risk still exists and still requires deliberate attention. Option C incorrectly concentrates risk ownership in a single role; recognizing and addressing risk in Agile is a whole-team responsibility, not limited to the Product Owner. Option D ignores the direct relationship between delivery frequency and how early problems can surface and be addressed.",
    explanationAr:
      "يساعد التسليم التكيّفي على إدارة المخاطر بشكل أساسي من خلال كشفها مبكراً وبشكل متكرر: فالتكرارات القصيرة، والفحص المتكرر للنتائج العاملة، والتسليم التزايدي، والتعلم المستمر تتيح للفريق اكتشاف عدم اليقين والمشكلات التقنية وعدم توافق التوقعات في وقت أبكر، بينما لا يزال التعديل غير مكلف. وهذا يعمل جنباً إلى جنب مع ممارسات إدارة المخاطر الصريحة مثل تحديد المخاطر وتحليلها والتخطيط للاستجابة لها - لا بديلاً عنها؛ فكل من النهج التكيّفي والتنبؤي يستخدم إدارة مخاطر متعمدة، لكن التسليم التكيّفي يضيف آلية مستمرة ومدمجة للكشف المبكر. الخيار (B) يفترض خطأً أن التكرارات القصيرة تجعل المخاطر غير ذات أهمية - فالمخاطر لا تزال قائمة وتتطلب اهتماماً متعمداً. الخيار (C) يركّز ملكية المخاطر خطأً في دور واحد؛ فالتعرف على المخاطر ومعالجتها في أجايل مسؤولية الفريق بأكمله، وليست مقتصرة على مالك المنتج. الخيار (D) يتجاهل العلاقة المباشرة بين وتيرة التسليم ومدى مبكر ظهور المشكلات ومعالجتها.",
  },
];
