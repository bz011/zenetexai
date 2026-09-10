import type { QuizQuestionSeed } from "./types";

/** Module 4 - People Domain. FINAL APPROVED (Q3 corrected lettering adopted; Q5 rewritten). */
export const module4Questions: QuizQuestionSeed[] = [
  {
    questionEn:
      "A project manager is leading a newly formed team. Team members are still unclear about their roles, lack confidence in how to approach the work, and frequently ask the project manager for detailed guidance on each task. What is the MOST appropriate leadership approach at this stage?",
    questionAr:
      "يقود مدير مشروع فريقاً تم تشكيله حديثاً. لا يزال أعضاء الفريق غير واضحين بشأن أدوارهم، ويفتقرون إلى الثقة في كيفية التعامل مع العمل، ويطلبون باستمرار من مدير المشروع توجيهات تفصيلية لكل مهمة. ما هو النهج القيادي الأنسب في هذه المرحلة؟",
    options: [
      [
        "Immediately adopt a fully hands-off approach, since empowering teams is always the best leadership practice",
        "تبنّي نهج غير موجّه بالكامل فوراً، لأن تمكين الفرق هو دائماً أفضل ممارسة قيادية",
      ],
      [
        "Provide clear direction and structure for now, while planning to shift toward greater autonomy as the team gains competence and confidence",
        "تقديم توجيه وهيكلة واضحين في الوقت الحالي، مع التخطيط للانتقال تدريجياً نحو استقلالية أكبر مع اكتساب الفريق للكفاءة والثقة",
      ],
      [
        "Maintain tight, directive control indefinitely regardless of how the team develops over time",
        "الحفاظ على سيطرة توجيهية صارمة إلى أجل غير مسمى بغض النظر عن كيفية تطور الفريق مع الوقت",
      ],
      [
        "Escalate to senior management to reassign a more experienced team, since this team is not yet capable",
        "التصعيد إلى الإدارة العليا لطلب فريق أكثر خبرة، لأن هذا الفريق غير كفؤ بعد",
      ],
    ],
    correctIndex: 1,
    explanationEn:
      "Situational leadership adapts the leader's style to the team's current competence and confidence. A newly formed team that lacks clarity and confidence generally benefits from more direction and structure at first, with an intentional shift toward greater autonomy as capability grows - leadership style is not fixed. Option A ignores the team's actual current maturity; jumping straight to full autonomy risks confusion given the described uncertainty. Option C is static and never adapts as the team develops, contradicting the situational approach. Option D escalates a normal, expected team-forming challenge as if it required replacing the team, when developing the team is the project manager's role.",
    explanationAr:
      "تُكيّف القيادة الموقفية (Situational Leadership) أسلوب القائد بحسب الكفاءة والثقة الحاليتين للفريق. الفريق حديث التشكيل الذي يفتقر إلى الوضوح والثقة يستفيد عموماً من مزيد من التوجيه والهيكلة في البداية، مع انتقال متعمد نحو استقلالية أكبر كلما ازدادت القدرات - فأسلوب القيادة ليس ثابتاً. الخيار (A) يتجاهل مستوى نضج الفريق الفعلي الحالي؛ فالانتقال المباشر إلى استقلالية كاملة يحمل خطر الارتباك في ظل حالة عدم اليقين الموصوفة. الخيار (C) ثابت ولا يتكيف أبداً مع تطور الفريق، مما يتعارض مع النهج الموقفي. الخيار (D) يصعّد تحدياً طبيعياً ومتوقعاً من مراحل تشكيل الفريق وكأنه يتطلب استبدال الفريق، بينما تطوير الفريق هو دور مدير المشروع.",
  },
  {
    questionEn:
      "During a tense stakeholder meeting, a stakeholder unfairly criticizes the project manager's work in front of the group. The project manager notices a strong urge to respond defensively. What is the BEST way for the project manager to apply emotional intelligence in this moment?",
    questionAr:
      "خلال اجتماع متوتر مع أصحاب المصلحة، ينتقد أحد أصحاب المصلحة عمل مدير المشروع بشكل غير عادل أمام المجموعة. يلاحظ مدير المشروع رغبة قوية في الرد بشكل دفاعي. ما هي أفضل طريقة يطبّق بها مدير المشروع الذكاء العاطفي (Emotional Intelligence - EI) في هذه اللحظة؟",
    options: [
      [
        "Suppress the reaction completely and avoid addressing the criticism at all, during or after the meeting",
        "كبت رد الفعل بالكامل وتجنّب التعامل مع الانتقاد إطلاقاً، سواء أثناء الاجتماع أو بعده",
      ],
      [
        "Respond immediately and assertively to defend their work and correct the record in front of the group",
        "الرد فوراً وبحزم للدفاع عن عملهم وتصحيح الموقف أمام المجموعة",
      ],
      [
        "Recognize the emotional reaction, pause before responding, and choose a measured, constructive response",
        "إدراك رد الفعل العاطفي، والتوقف قليلاً قبل الرد، واختيار استجابة متزنة وبنّاءة",
      ],
      ["End the meeting early to avoid escalating tension in front of stakeholders", "إنهاء الاجتماع مبكراً لتجنب تصعيد التوتر أمام أصحاب المصلحة"],
    ],
    correctIndex: 2,
    explanationEn:
      "This reflects the core EI competencies of self-awareness (recognizing the emotional reaction as it happens) and self-management (pausing rather than reacting, then choosing a constructive response) - the goal is not to eliminate the emotion but to manage the response to it. Option A suppresses the reaction without ever addressing the underlying issue, which does not resolve the concern or the relationship. Option B is the reflexive defensive reaction EI is meant to help the project manager move past, and risks escalating the conflict in front of the group. Option D avoids the situation rather than managing it, and does nothing to address the stakeholder's underlying concern.",
    explanationAr:
      "يعكس هذا الموقف كفاءتي الذكاء العاطفي الأساسيتين: الوعي الذاتي (self-awareness) - إدراك رد الفعل العاطفي لحظة حدوثه - والإدارة الذاتية (self-management) - التوقف بدلاً من الاندفاع، ثم اختيار استجابة بنّاءة. الهدف ليس إلغاء الشعور بل إدارة الاستجابة له. الخيار (A) يكبت رد الفعل دون معالجة المشكلة الأساسية إطلاقاً، مما لا يحل القلق ولا يحافظ على العلاقة. الخيار (B) هو رد الفعل الدفاعي الانعكاسي الذي يُفترض بالذكاء العاطفي مساعدة مدير المشروع على تجاوزه، وقد يصعّد الخلاف أمام المجموعة. الخيار (D) يتجنب الموقف بدلاً من إدارته، ولا يعالج قلق صاحب المصلحة الأساسي.",
  },
  {
    questionEn:
      "A project manager assumes a skilled team member's declining performance is due to insufficient pay and offers a bonus. The bonus does not improve the team member's engagement or performance. What does this MOST likely suggest?",
    questionAr:
      "يفترض مدير مشروع أن تراجع أداء أحد أعضاء الفريق الماهرين سببه انخفاض الأجر، فيعرض عليه مكافأة مالية. لكن المكافأة لا تحسّن مشاركة أو أداء عضو الفريق. ماذا يشير ذلك على الأرجح؟",
    options: [
      [
        "The team member's underlying motivation may be intrinsic (e.g., meaningful work, autonomy, growth) rather than purely financial, and the root cause has not yet been addressed",
        "أن الدافع الحقيقي لعضو الفريق قد يكون داخلياً (Intrinsic) - مثل العمل ذي المعنى، أو الاستقلالية، أو النمو - وليس مالياً بحتاً، وأن السبب الجذري لم تتم معالجته بعد",
      ],
      [
        "The team member is motivated primarily by extrinsic rewards, and the bonus amount was simply too small",
        "أن عضو الفريق يتحفّز بشكل أساسي بالحوافز الخارجية (Extrinsic)، وأن مبلغ المكافأة كان ببساطة صغيراً جداً",
      ],
      [
        "The team member is not motivated by any factors and no leadership action can change this",
        "أن عضو الفريق لا يتحفّز بأي عامل إطلاقاً وأنه لا يمكن لأي إجراء قيادي تغيير ذلك",
      ],
      [
        "Motivation issues should always be resolved through formal disciplinary action rather than incentives",
        "أنه ينبغي دائماً حل مشكلات التحفيز عبر إجراءات تأديبية رسمية بدلاً من الحوافز",
      ],
    ],
    correctIndex: 0,
    explanationEn:
      "When a financial incentive fails to change behavior, it's a signal that the actual driver may be intrinsic - meaningful work, autonomy, mastery, or growth - rather than money, and that the project manager assumed the wrong root cause instead of investigating it. Option B doubles down on the same unverified financial assumption rather than reconsidering it in light of the evidence. Option C is an unsupported absolute - people are motivated by something, even if it isn't yet identified. Option D jumps to punitive action without first understanding the actual cause, which is not a reasonable or supported response to an unexplained performance change.",
    explanationAr:
      "عندما يفشل حافز مالي في تغيير السلوك، فهذا مؤشر على أن الدافع الفعلي قد يكون داخلياً - كالعمل ذي المعنى، أو الاستقلالية، أو الإتقان، أو النمو - وليس المال، وأن مدير المشروع افترض السبب الجذري الخاطئ بدلاً من التحقق منه. الخيار (B) يكرر نفس الافتراض المالي غير المتحقق منه بدلاً من إعادة النظر فيه في ضوء الدليل. الخيار (C) تعميم مطلق غير مدعوم - فالأشخاص يتحفّزون بشيء ما، حتى وإن لم يُحدَّد بعد. الخيار (D) يقفز إلى إجراء عقابي دون فهم السبب الفعلي أولاً، وهو رد غير معقول أو مدعوم لتغيّر أداء لم يُفسَّر بعد.",
  },
  {
    questionEn:
      "A team that recently began working together is now experiencing frequent disagreements over how work should be approached, with some members challenging the project manager's authority and others competing for influence. Based on team development stages, what should the project manager do?",
    questionAr:
      "يشهد فريق بدأ العمل معاً مؤخراً خلافات متكررة حول كيفية التعامل مع العمل، حيث يتحدى بعض الأعضاء صلاحية مدير المشروع بينما يتنافس آخرون على النفوذ. استناداً إلى مراحل تطور الفريق، ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      [
        "Interpret the disagreements as a sign of poor hiring decisions and consider replacing the team members involved",
        "تفسير الخلافات كدليل على قرارات توظيف خاطئة، والنظر في استبدال الأعضاء المعنيين",
      ],
      [
        "Avoid intervening, since teams typically resolve early disagreements on their own without any guidance",
        "عدم التدخل، لأن الفرق عادة ما تحل خلافاتها المبكرة بنفسها دون أي توجيه",
      ],
      [
        "Assert stronger personal authority over all decisions to eliminate the disagreements and restore order",
        "فرض سلطة شخصية أقوى على جميع القرارات للقضاء على الخلافات واستعادة النظام",
      ],
      [
        "Recognize this as a normal stage of team development and actively facilitate the team toward clearer norms, roles, and constructive resolution of disagreements",
        "إدراك أن هذه مرحلة طبيعية من مراحل تطور الفريق، والقيام بتيسير الفريق بشكل فعّال نحو معايير وأدوار أوضح وحل بنّاء للخلافات",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "The behavior described - challenged authority, competition for influence, and disagreement over approach - is characteristic of Storming, a normal and expected stage of team development. The project manager's role is to actively facilitate the team toward Norming by clarifying roles and norms and guiding constructive resolution, not to eliminate the friction through authority or assume the people themselves are the problem. Option A misdiagnoses an expected developmental stage as a hiring failure. Option B is too passive - teams in Storming often need active facilitation to move forward productively, especially when authority itself is being challenged. Option C suppresses the disagreement through control rather than resolving it, which tends to push the friction underground rather than genuinely resolve it.",
    explanationAr:
      "يمثّل السلوك الموصوف - تحدي الصلاحية، والتنافس على النفوذ، والخلاف حول أسلوب العمل - خصائص مرحلة الاضطراب (Storming)، وهي مرحلة طبيعية ومتوقعة من مراحل تطور الفريق ضمن نموذج تاكمان (Tuckman). دور مدير المشروع هو تيسير انتقال الفريق بفعالية نحو مرحلة الاستقرار (Norming) من خلال توضيح الأدوار والمعايير وتوجيه حل بنّاء للخلافات، وليس القضاء على الاحتكاك بالسلطة أو افتراض أن الأشخاص أنفسهم هم المشكلة. الخيار (A) يسيء تشخيص مرحلة تطورية متوقعة باعتبارها فشلاً في التوظيف. الخيار (B) سلبي أكثر من اللازم - فالفرق في مرحلة الاضطراب غالباً ما تحتاج إلى تيسير فعّال للتقدم بشكل بنّاء، خاصة عندما تُتحدّى الصلاحية نفسها. الخيار (C) يكبت الخلاف عبر السيطرة بدلاً من حله، مما يميل إلى دفع الاحتكاك تحت السطح بدلاً من حله فعلياً.",
  },
  {
    // REWRITTEN per Zaid's feedback: force/direct within proper PM authority during a genuine emergency (PM directs deployment of an already-validated design, not a technical adjudication).
    questionEn:
      "Two senior engineers disagree over a new, unproven design change to a critical system, proposed just before a scheduled production deployment. The regulatory compliance deployment window closes in one hour and cannot be moved; missing it would create a compliance violation. There is no time to properly evaluate either engineer's new design proposal. A previously tested and approved design already exists that meets requirements and is ready to deploy as-is. What is the MOST appropriate conflict-management approach for the project manager to use in this moment?",
    questionAr:
      "يختلف مهندسان كبيران حول تغيير تصميم جديد وغير مُختبَر لنظام بالغ الأهمية، اقتُرح قبيل موعد نشر مقرر في بيئة الإنتاج. تُغلَق نافذة النشر الملزمة بالامتثال التنظيمي خلال ساعة واحدة ولا يمكن تأجيلها؛ وتفويتها يشكّل مخالفة للامتثال. لا يوجد وقت كافٍ لتقييم أي من التصميمين الجديدين المقترحين بشكل صحيح. ويوجد تصميم سابق تم اختباره واعتماده مسبقاً، يلبي المتطلبات، وجاهز للنشر كما هو. ما هو نهج إدارة النزاع (Conflict Management) الأنسب لمدير المشروع في هذه اللحظة؟",
    options: [
      [
        "Personally evaluate both engineers' technical arguments, decide which new design is correct, and direct the team to implement it immediately",
        "تقييم الحجج التقنية لكلا المهندسين شخصياً، وتحديد أي تصميم جديد هو الصحيح، ثم توجيه الفريق لتنفيذه فوراً",
      ],
      [
        "Direct the team to deploy the previously tested and approved design to meet the compliance deadline - a schedule and risk decision within the project manager's authority - rather than ruling on which engineer's new design is technically correct, then formally revisit the disagreement and its root cause after deployment",
        "توجيه الفريق لنشر التصميم المُختبَر والمعتمد سابقاً لتحقيق الموعد النهائي للامتثال - وهو قرار جدولة ومخاطر يقع ضمن صلاحية مدير المشروع - بدلاً من الفصل في أي تصميم جديد للمهندسين هو الصحيح تقنياً، ثم إعادة النظر رسمياً في الخلاف وسببه الجذري بعد النشر",
      ],
      [
        "Withdraw from the discussion and allow the engineers to continue debating, deploying whichever design happens to be ready when the window closes",
        "الانسحاب من النقاش والسماح للمهندسَين بمواصلة الجدال، ونشر أي تصميم يكون جاهزاً عند إغلاق النافذة",
      ],
      [
        "Facilitate a full collaborative session to thoroughly evaluate both new design proposals before deciding what to deploy",
        "تيسير جلسة تعاونية كاملة لتقييم كلا التصميمين الجديدين المقترحين بدقة قبل تحديد ما سيتم نشره",
      ],
    ],
    correctIndex: 1,
    explanationEn:
      "This is a genuine emergency: an immediate decision is required, missing the deadline creates a real compliance consequence, and there is no time for full collaborative evaluation - conditions where a Force/Direct approach is appropriate. Critically, the project manager's directive stays within proper authority: choosing to proceed with the already-validated, previously approved design is a schedule and risk-management decision squarely within the PM's role, not a ruling on which brand-new engineering design is technically superior. This resolves the immediate crisis without the PM overstepping into specialized technical judgment, and the disagreement itself is revisited afterward rather than treated as settled. Option A has the project manager personally adjudicate a specialized technical question outside their authority and expertise, which is risky regardless of urgency. Option C wastes the only time available and leaves the actual outcome to chance - an unmanaged, essentially random result for a regulated deployment. Option D, collaborate/problem-solve, is normally the strongest approach for a durable, well-evaluated resolution, but there genuinely isn't time to properly assess two new, unproven designs before the deadline, making it impractical in this specific moment.",
    explanationAr:
      "هذا وضع طارئ حقيقي: يتطلب قراراً فورياً، وتفويت الموعد النهائي يشكّل مخالفة امتثال فعلية، ولا يوجد وقت لتقييم تعاوني كامل - وهي ظروف يكون فيها نهج التوجيه/الفرض (Force/Direct) مناسباً. والأهم أن توجيه مدير المشروع يبقى ضمن صلاحياته الصحيحة: فاختيار المضي قدماً بالتصميم المعتمد والمختبر مسبقاً هو قرار جدولة وإدارة مخاطر يقع تماماً ضمن دور مدير المشروع، وليس فصلاً في أي تصميم هندسي جديد هو الأفضل تقنياً. هذا يحل الأزمة الفورية دون أن يتجاوز مدير المشروع صلاحياته إلى حكم تقني متخصص، مع العودة لاحقاً إلى الخلاف نفسه بدلاً من اعتباره منتهياً. الخيار (A) يجعل مدير المشروع يفصل شخصياً في مسألة تقنية متخصصة تتجاوز صلاحيته وخبرته، وهذا محفوف بالمخاطر بغض النظر عن الإلحاح. الخيار (C) يهدر الوقت الوحيد المتاح ويترك النتيجة الفعلية للصدفة - نتيجة عشوائية غير مُدارة لنشر خاضع للتنظيم. الخيار (D)، التعاون وحل المشكلات، هو عادة أقوى نهج للوصول إلى حل دائم ومُقيَّم جيداً، لكن لا يوجد فعلياً وقت لتقييم تصميمين جديدين وغير مُختبَرين بشكل صحيح قبل الموعد النهائي، مما يجعله غير عملي في هذه اللحظة تحديداً.",
  },
  {
    questionEn:
      "Two project managers both need the same specialized resource for overlapping critical-path work, and each insists their project must have exclusive full-time access. Before proposing any solution, what should the requesting project manager do FIRST?",
    questionAr:
      "يحتاج مديرا مشروعين إلى نفس المورد المتخصص لعمل متداخل على المسار الحرج، ويصرّ كل منهما على أن مشروعه يحتاج وصولاً حصرياً بدوام كامل. قبل اقتراح أي حل، ماذا ينبغي لمدير المشروع الطالب أن يفعل أولاً؟",
    options: [
      [
        "Explore the underlying interests, constraints, and priorities behind each project's need for the resource, rather than focusing only on each side's stated position",
        "استكشاف المصالح والقيود والأولويات الكامنة وراء حاجة كل مشروع للمورد، بدلاً من التركيز فقط على الموقف المُعلَن لكل طرف",
      ],
      ["Immediately escalate the conflict to the sponsor to have the resource assigned by authority", "التصعيد فوراً إلى الراعي (Sponsor) لتخصيص المورد بقرار من السلطة"],
      ["Insist on the originally requested full-time allocation, since backing down would set a bad precedent", "الإصرار على التخصيص الأصلي بدوام كامل، لأن التراجع قد يُرسي سابقة سيئة"],
      ["Propose splitting the resource's time evenly between both projects without further discussion", "اقتراح تقسيم وقت المورد بالتساوي بين المشروعين دون مزيد من النقاش"],
    ],
    correctIndex: 0,
    explanationEn:
      "Effective negotiation starts with understanding interests - the real needs, constraints, and priorities behind a stated position - rather than negotiating the positions themselves. Understanding both projects' actual scheduling constraints and priorities often reveals options neither side initially considered (e.g., sequencing, partial overlap, an alternate resource) that satisfy both projects' real needs better than a rigid full-time claim. Option B escalates before attempting to resolve the issue directly, skipping a step that is usually appropriate to try first. Option C is purely positional bargaining and risks a stalemate rather than a workable outcome. Option D imposes a solution before understanding whether an even split actually fits either project's real constraints - it may satisfy neither.",
    explanationAr:
      "يبدأ التفاوض الفعّال بفهم المصالح (Interests) - الاحتياجات والقيود والأولويات الحقيقية الكامنة خلف الموقف المُعلَن - بدلاً من التفاوض حول المواقف نفسها. فهم القيود الزمنية والأولويات الفعلية لكلا المشروعين غالباً ما يكشف خيارات لم يفكر فيها أي من الطرفين مبدئياً (مثل الترتيب الزمني، أو التداخل الجزئي، أو مورد بديل) تلبي الاحتياجات الحقيقية لكلا المشروعين بشكل أفضل من مطلب صارم بدوام كامل. الخيار (B) يصعّد الأمر قبل محاولة حله مباشرة، متجاوزاً خطوة يُفضَّل عادة تجربتها أولاً. الخيار (C) مساومة قائمة على المواقف بحتة وتحمل خطر الوصول إلى طريق مسدود بدلاً من نتيجة عملية. الخيار (D) يفرض حلاً قبل معرفة ما إذا كان التقسيم المتساوي يناسب فعلاً القيود الحقيقية لأي من المشروعين - فقد لا يُرضي أياً منهما.",
  },
  {
    questionEn:
      "A key stakeholder who was initially enthusiastic about the project has become increasingly disengaged, rarely responds to project updates, and seems resistant to attending planning sessions. What should the project manager do to address this?",
    questionAr:
      "أصبح أحد أصحاب المصلحة الرئيسيين، الذي كان متحمساً في البداية للمشروع، أكثر انسحاباً بمرور الوقت، ونادراً ما يستجيب لتحديثات المشروع، ويبدو مقاوماً لحضور جلسات التخطيط. ماذا ينبغي لمدير المشروع أن يفعل لمعالجة ذلك؟",
    options: [
      [
        "Continue sending the same regular project updates, since the stakeholder will likely re-engage once major milestones are reached",
        "الاستمرار في إرسال نفس تحديثات المشروع الاعتيادية، لأن صاحب المصلحة سيعود على الأرجح للمشاركة عند الوصول إلى معالم رئيسية",
      ],
      ["Reduce communication with the stakeholder to avoid burdening them further, since they appear uninterested", "تقليل التواصل مع صاحب المصلحة لتجنب إثقاله أكثر، بما أنه يبدو غير مهتم"],
      [
        "Escalate the stakeholder's disengagement to their manager to compel their participation in future sessions",
        "تصعيد انسحاب صاحب المصلحة إلى مديره لإجباره على المشاركة في الجلسات القادمة",
      ],
      [
        "Meet with the stakeholder directly to understand the reasons behind the disengagement and adjust the engagement approach based on what is learned",
        "الاجتماع مباشرة مع صاحب المصلحة لفهم أسباب انسحابه، وتعديل أسلوب الإشراك (Stakeholder Engagement) بناءً على ما يتم التوصل إليه",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "Effective stakeholder engagement means understanding a stakeholder's actual concerns and reasons for disengaging - which could stem from unmet expectations, unclear value, competing priorities, or a communication-style mismatch - and tailoring the engagement approach accordingly, rather than guessing. Option A repeats the same broadcast approach that has already failed to sustain engagement, treating the problem as self-resolving instead of addressing it. Option B reduces contact rather than rebuilding the relationship, effectively abandoning a stakeholder whose engagement matters. Option C escalates a relationship issue to an authority figure before attempting to understand and resolve it directly, which risks damaging trust without addressing the underlying cause.",
    explanationAr:
      "يعني إشراك أصحاب المصلحة (Stakeholder Engagement) الفعّال فهم مخاوف صاحب المصلحة الفعلية وأسباب انسحابه - والتي قد تنبع من توقعات لم تتحقق، أو قيمة غير واضحة، أو أولويات متنافسة، أو عدم توافق في أسلوب التواصل - وتكييف أسلوب الإشراك بناءً على ذلك، بدلاً من التخمين. الخيار (A) يكرر نفس أسلوب البث الذي فشل بالفعل في الحفاظ على المشاركة، ويتعامل مع المشكلة وكأنها ستُحل من تلقاء نفسها. الخيار (B) يقلل التواصل بدلاً من إعادة بناء العلاقة، مما يعني فعلياً التخلي عن صاحب مصلحة مهمة مشاركته. الخيار (C) يصعّد مشكلة علاقة إلى جهة سلطة قبل محاولة فهمها وحلها مباشرة، مما يخاطر بالإضرار بالثقة دون معالجة السبب الأساسي.",
  },
  {
    questionEn:
      "In a multicultural project team, a project manager notices that some team members rarely speak during meetings while a few members consistently dominate the discussion. The project manager assumes the quieter members simply have nothing valuable to add. Which of the following reflects the MOST appropriate action?",
    questionAr:
      "في فريق مشروع متعدد الثقافات، يلاحظ مدير المشروع أن بعض الأعضاء نادراً ما يتحدثون خلال الاجتماعات بينما يهيمن عدد قليل من الأعضاء باستمرار على النقاش. يفترض مدير المشروع أن الأعضاء الأقل حديثاً ليس لديهم ببساطة ما يضيفونه من قيمة. أي مما يلي يعكس الإجراء الأنسب؟",
    options: [
      [
        "Continue relying on whoever volunteers to speak, since requiring quieter members to contribute would make them uncomfortable",
        "الاستمرار في الاعتماد على من يتطوع للحديث، لأن مطالبة الأعضاء الأقل حديثاً بالمشاركة قد يجعلهم غير مرتاحين",
      ],
      ["Conclude that the quieter team members are less capable and assign them more limited responsibilities", "الاستنتاج بأن الأعضاء الأقل حديثاً أقل كفاءة وتكليفهم بمسؤوليات محدودة أكثر"],
      [
        "Recognize that differing communication styles and cultural norms can affect participation, and create structured opportunities (e.g., direct questions, written input, rotating facilitation) for all members to contribute",
        "إدراك أن اختلاف أساليب التواصل والأعراف الثقافية قد يؤثر على المشاركة، وخلق فرص منظمة (مثل الأسئلة المباشرة، أو المدخلات الكتابية، أو تناوب التيسير) لمشاركة جميع الأعضاء",
      ],
      ["Address the imbalance only if a quieter team member formally raises it as a concern", "معالجة الخلل فقط إذا أثاره أحد الأعضاء الأقل حديثاً بشكل رسمي كمصدر قلق"],
    ],
    correctIndex: 2,
    explanationEn:
      "Inclusive practice recognizes that differences in communication style, culture, seniority, or confidence can affect who speaks up, and deliberately creates structured, equitable opportunities for participation - supporting psychological safety - rather than assuming silence means a lack of value. Option A avoids addressing a real participation imbalance based on an assumption about comfort, and does not create genuine inclusion. Option B reflects an unfounded, biased conclusion based only on participation style rather than actual contribution or capability. Option D places the entire burden of raising the issue on the quieter members, who may already feel less comfortable speaking up - the project manager should proactively address participation gaps rather than wait to be told.",
    explanationAr:
      "تدرك الممارسة الشاملة (Inclusive Practice) أن اختلافات أسلوب التواصل أو الثقافة أو الأقدمية أو الثقة قد تؤثر على من يتحدث، وتخلق عمداً فرصاً منظمة وعادلة للمشاركة - بما يدعم الأمان النفسي (Psychological Safety) - بدلاً من افتراض أن الصمت يعني غياب القيمة. الخيار (A) يتجنب معالجة خلل مشاركة حقيقي بناءً على افتراض حول الارتياح، ولا يخلق شمولاً حقيقياً. الخيار (B) يعكس استنتاجاً متحيزاً وغير مبرَّر يستند فقط إلى أسلوب المشاركة لا إلى الإسهام أو الكفاءة الفعلية. الخيار (D) يضع العبء الكامل لإثارة المشكلة على الأعضاء الأقل حديثاً، الذين قد يشعرون بالفعل بارتياح أقل في الحديث - إذ ينبغي لمدير المشروع معالجة فجوات المشاركة بشكل استباقي بدلاً من انتظار من يخبره بها.",
  },
  {
    questionEn:
      "A team member has strong technical skills but struggles to prioritize their own work effectively, repeatedly asking the project manager to simply decide their daily priorities for them. What is the MOST appropriate approach for helping this team member?",
    questionAr:
      "يتمتع أحد أعضاء الفريق بمهارات تقنية قوية لكنه يواجه صعوبة في ترتيب أولويات عمله بفعالية، ويطلب باستمرار من مدير المشروع أن يحدد له أولوياته اليومية ببساطة. ما هو النهج الأنسب لمساعدة عضو الفريق هذا؟",
    options: [
      ["Enroll the team member in a formal time-management training course to build the missing skill", "تسجيل عضو الفريق في دورة تدريبية رسمية (Training) في إدارة الوقت لبناء المهارة المفقودة"],
      [
        "Use coaching - asking guided questions that help the team member reflect on and develop their own approach to prioritization",
        "استخدام التوجيه (Coaching) - طرح أسئلة موجَّهة تساعد عضو الفريق على التأمل وتطوير أسلوبه الخاص في ترتيب الأولويات",
      ],
      ["Assign the team member a long-term mentor to provide career guidance over the coming months", "تكليف عضو الفريق بمرشد (Mentor) طويل الأمد لتقديم إرشاد مهني على مدى الأشهر القادمة"],
      ["Continue setting the team member's daily priorities directly, since this is the fastest way to keep work moving", "الاستمرار في تحديد أولويات عضو الفريق اليومية مباشرة، لأن هذا أسرع طريقة لإبقاء العمل مستمراً"],
    ],
    correctIndex: 1,
    explanationEn:
      "Coaching helps someone who already has relevant capability discover and develop their own solution through guided questions and reflection - well suited here, since the issue isn't a missing hard skill but difficulty exercising independent judgment. Training (A) is appropriate for building a structured, missing skill or knowledge area, which isn't the core issue since the team member is already technically strong. Mentoring (C) typically addresses longer-term career development from someone experienced, not this specific, immediate performance behavior. Continuing to set priorities directly (D) may keep work moving short-term, but fails to build the team member's own capability and creates ongoing dependency on the project manager.",
    explanationAr:
      "يساعد التوجيه (Coaching) شخصاً يمتلك بالفعل الكفاءة اللازمة على اكتشاف وتطوير حله الخاص من خلال أسئلة موجَّهة والتأمل - وهو مناسب هنا تماماً، لأن المشكلة ليست مهارة تقنية مفقودة بل صعوبة في ممارسة الحكم المستقل. أما التدريب (Training) (A) فهو مناسب لبناء مهارة أو معرفة منظمة مفقودة، وهذا ليس جوهر المشكلة بما أن عضو الفريق قوي تقنياً بالفعل. أما الإرشاد (Mentoring) (C) فيتناول عادة التطور المهني طويل الأمد من شخص ذي خبرة، وليس هذا السلوك الأدائي المحدد والفوري. أما الاستمرار في تحديد الأولويات مباشرة (D) فقد يُبقي العمل مستمراً على المدى القصير، لكنه يفشل في بناء قدرة عضو الفريق الخاصة ويخلق اعتماداً مستمراً على مدير المشروع.",
  },
  {
    questionEn:
      "A senior team member who holds unique, critical knowledge about a key project system is scheduled to leave the project in two weeks, and no handover plan currently exists. What should the project manager do NEXT?",
    questionAr:
      "من المقرر أن يغادر أحد كبار أعضاء الفريق، الذي يمتلك معرفة فريدة وبالغة الأهمية حول نظام رئيسي في المشروع، خلال أسبوعين، ولا توجد حالياً أي خطة لنقل المعرفة (Knowledge Transfer). ماذا ينبغي لمدير المشروع أن يفعل تالياً؟",
    options: [
      ["Wait until the team member's final day to conduct a single comprehensive handover session", "الانتظار حتى اليوم الأخير لعضو الفريق لإجراء جلسة تسليم واحدة شاملة"],
      [
        "Rely on existing project documentation, assuming it sufficiently captures the team member's knowledge",
        "الاعتماد على وثائق المشروع الحالية، على افتراض أنها تغطي معرفة عضو الفريق بشكل كافٍ",
      ],
      [
        "Escalate the situation to the sponsor and request that the team member's departure be delayed indefinitely",
        "تصعيد الأمر إلى الراعي (Sponsor) وطلب تأجيل مغادرة عضو الفريق إلى أجل غير مسمى",
      ],
      [
        "Immediately establish a structured handover plan, including documentation and shadowing/knowledge-sharing sessions with the remaining or incoming team members, before the departure date",
        "إنشاء خطة تسليم منظمة فوراً، تشمل التوثيق وجلسات المرافقة/مشاركة المعرفة (Shadowing) مع الأعضاء الحاليين أو القادمين، قبل تاريخ المغادرة",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "With unique, critical knowledge concentrated in one person and a known, imminent departure, the project manager should act immediately to establish a deliberate handover plan - documentation plus hands-on knowledge-sharing such as shadowing or structured sessions - while there is still time, to preserve continuity and avoid a single point of knowledge failure. Option A postpones handover until there's no time left to absorb or clarify the knowledge, risking major gaps. Option B assumes documentation is complete without verification, which is risky when the knowledge is described as unique and critical. Option C is an escalation that may not be within the project manager's control - staffing and departure decisions often belong elsewhere - and doesn't address the immediate need to preserve knowledge regardless of whether the delay is granted.",
    explanationAr:
      "مع تركّز معرفة فريدة وبالغة الأهمية لدى شخص واحد ومغادرة معروفة ووشيكة، ينبغي لمدير المشروع التصرف فوراً لإنشاء خطة تسليم متعمدة - توثيق إضافة إلى مشاركة معرفة عملية مثل المرافقة (Shadowing) أو جلسات منظمة - طالما لا يزال هناك وقت، للحفاظ على الاستمرارية وتجنب نقطة فشل معرفية وحيدة. الخيار (A) يؤجل التسليم إلى حين عدم توفر أي وقت لاستيعاب المعرفة أو توضيحها، مما يخاطر بفجوات كبيرة. الخيار (B) يفترض اكتمال التوثيق دون التحقق منه، وهو أمر محفوف بالمخاطر عندما تُوصف المعرفة بأنها فريدة وبالغة الأهمية. الخيار (C) تصعيد قد لا يكون ضمن صلاحية مدير المشروع - فقرارات التوظيف والمغادرة غالباً ما تخص جهات أخرى - ولا يعالج الحاجة الفورية للحفاظ على المعرفة بغض النظر عن الموافقة على التأجيل من عدمها.",
  },
];
