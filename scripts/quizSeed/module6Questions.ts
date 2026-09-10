import type { QuizQuestionSeed } from "./types";

/** Module 6 - Business Environment. FINAL APPROVED (Q6 Option B + explanation precision-corrected; correct answer A unchanged). */
export const module6Questions: QuizQuestionSeed[] = [
  {
    questionEn:
      "While resolving a technical issue, a project manager identifies that the necessary fix requires additional spending that exceeds the project manager's delegated financial authority as defined in the project's governance framework. What should the project manager do?",
    questionAr:
      "أثناء حل مشكلة تقنية، يكتشف مدير المشروع أن الإصلاح اللازم يتطلب إنفاقاً إضافياً يتجاوز صلاحيته المالية المفوَّضة (Delegated Authority) كما هي محددة في إطار حوكمة المشروع. ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      ["Approve the additional spending directly, since delaying the fix would harm the project schedule", "الموافقة على الإنفاق الإضافي مباشرة، لأن تأخير الإصلاح سيضر بالجدول الزمني للمشروع"],
      [
        "Escalate the decision through the defined governance/escalation path to the appropriate authority for approval, since the spending exceeds the project manager's delegated threshold",
        "تصعيد القرار عبر مسار الحوكمة/التصعيد المحدد (Escalation Path) إلى الجهة المخوَّلة للموافقة، لأن الإنفاق يتجاوز الحد المفوَّض لمدير المشروع",
      ],
      [
        "Quietly reallocate funds from another budget line to cover the cost without formally raising it, to avoid slowing down the fix",
        "إعادة تخصيص الأموال بهدوء من بند ميزانية آخر لتغطية التكلفة دون طرح الأمر رسمياً، لتجنب إبطاء الإصلاح",
      ],
      [
        "Postpone the decision indefinitely until the issue resolves itself, to avoid needing authority the project manager doesn't have",
        "تأجيل القرار إلى أجل غير مسمى حتى تُحل المشكلة من تلقاء نفسها، لتجنب الحاجة إلى صلاحية لا يملكها مدير المشروع",
      ],
    ],
    correctIndex: 1,
    explanationEn:
      "Governance frameworks define specific decision authority and escalation thresholds; when a decision exceeds the project manager's delegated authority, the correct action is to escalate through the defined path to the accountable authority - not to act unilaterally regardless of urgency, and not to bypass governance informally. Option A oversteps delegated authority despite good intentions about the schedule. Option C bypasses governance entirely through an informal workaround, undermining accountability and financial controls even though it avoids delay. Option D fails to act at all, leaving a real problem unresolved out of avoidance rather than following the proper process - which is different from responsibly escalating it.",
    explanationAr:
      "تحدد أطر الحوكمة (Governance) صلاحيات قرار وحدود تصعيد (Escalation Threshold) محددة؛ وعندما يتجاوز القرار الصلاحية المفوَّضة لمدير المشروع، فإن الإجراء الصحيح هو التصعيد عبر المسار المحدد (Escalation Path) إلى الجهة المسؤولة - لا التصرف من جانب واحد بغض النظر عن الإلحاح، ولا تجاوز الحوكمة بشكل غير رسمي. الخيار (A) يتجاوز الصلاحية المفوَّضة رغم النية الحسنة المتعلقة بالجدول الزمني. الخيار (C) يتجاوز الحوكمة كلياً عبر حل غير رسمي، مما يقوّض المساءلة والضوابط المالية حتى لو تجنب التأخير. الخيار (D) يفشل في اتخاذ أي إجراء، تاركاً مشكلة حقيقية دون حل بدافع التجنب لا اتباع العملية الصحيحة - وهذا مختلف عن التصعيد المسؤول لها.",
  },
  {
    questionEn:
      "Ahead of an upcoming funding renewal vote, a sponsor asks the project manager to report the project as \"on track\" in the steering committee status report, even though the project manager's own forecast shows a material risk of missing the next milestone. The sponsor says raising this now could jeopardize the funding renewal. What should the project manager do?",
    questionAr:
      "قبيل تصويت متوقع على تجديد التمويل، يطلب الراعي (Sponsor) من مدير المشروع أن يُبلغ في تقرير حالة لجنة التوجيه بأن المشروع \"على المسار الصحيح\"، رغم أن توقع مدير المشروع الخاص يُظهر مخاطرة جوهرية بتفويت المعلم القادم. يقول الراعي إن إثارة هذا الأمر الآن قد يهدد تجديد التمويل. ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      ["Report the project as \"on track\" as the sponsor requested, since the forecast is not yet a confirmed outcome", "الإبلاغ عن المشروع بأنه \"على المسار الصحيح\" كما طلب الراعي، لأن التوقع ليس نتيجة مؤكدة بعد"],
      [
        "Report the forecasted risk only to the sponsor privately, while telling the steering committee the project is on track",
        "الإبلاغ عن المخاطرة المتوقعة للراعي فقط بشكل خاص، مع إخبار لجنة التوجيه بأن المشروع على المسار الصحيح",
      ],
      ["Refuse to submit any status report until after the funding vote, to avoid the conflict entirely", "رفض تقديم أي تقرير حالة حتى بعد التصويت على التمويل، لتجنب الخلاف كلياً"],
      [
        "Report the status accurately, including the forecasted risk, and discuss the concern and its implications directly with the sponsor and/or the appropriate governance body",
        "الإبلاغ عن الحالة بدقة، بما في ذلك المخاطرة المتوقعة، ومناقشة القلق وتداعياته مباشرة مع الراعي و/أو الجهة الحوكمية المعنية",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "Accurate, transparent reporting to governance bodies is a core professional responsibility; a materially significant forecasted risk is decision-relevant information the steering committee needs, regardless of how it might affect an unrelated funding vote. The project manager should report it honestly and raise the underlying tension directly, rather than misrepresenting status or avoiding the report altogether. Option A misrepresents known, material information to the body responsible for oversight - a professional and ethical breach that undermines governance's ability to make informed decisions. Option B selectively tells the truth to only one audience while deceiving the formal governance body, which is essentially the same ethical problem in a different form. Option C avoids the immediate conflict but fails to fulfill the basic reporting obligation to governance, leaving the committee to make its decision without any current information at all.",
    explanationAr:
      "الإبلاغ الدقيق والشفاف لجهات الحوكمة مسؤولية مهنية أساسية؛ فالمخاطرة المتوقعة ذات الأهمية الجوهرية معلومة ذات صلة بالقرار تحتاجها لجنة التوجيه، بغض النظر عن تأثيرها المحتمل على تصويت تمويل غير مرتبط مباشرة. ينبغي لمدير المشروع الإبلاغ عنها بصدق وإثارة التوتر الكامن مباشرة، بدلاً من تشويه الحالة أو تجنب التقرير كلياً. الخيار (A) يشوّه معلومة معروفة وجوهرية أمام الجهة المسؤولة عن الرقابة - وهو انتهاك مهني وأخلاقي يقوّض قدرة الحوكمة على اتخاذ قرارات مستنيرة. الخيار (B) يخبر بالحقيقة بشكل انتقائي لجهة واحدة فقط بينما يخدع الجهة الحوكمية الرسمية، وهي نفس المشكلة الأخلاقية بشكل مختلف. الخيار (C) يتجنب الخلاف الفوري لكنه يفشل في الوفاء بالتزام الإبلاغ الأساسي تجاه الحوكمة، تاركاً اللجنة تتخذ قرارها دون أي معلومة حالية إطلاقاً.",
  },
  {
    questionEn:
      "A project's security team flags that the system being built handles customer data in a way that may not meet a mandatory data-security requirement. Implementing full compliance would require additional development time and cost. What should the project manager do?",
    questionAr:
      "يشير فريق الأمن في المشروع إلى أن النظام قيد البناء يتعامل مع بيانات العملاء بطريقة قد لا تستوفي متطلباً إلزامياً لأمن البيانات (Security). تنفيذ الامتثال الكامل سيتطلب وقت تطوير وتكلفة إضافيين. ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      [
        "Work with the qualified security specialists to assess the actual compliance gap and its impact, then address it through the appropriate process rather than treating it as optional",
        "العمل مع متخصصي الأمن المؤهلين لتقييم فجوة الامتثال الفعلية وأثرها، ثم معالجتها عبر العملية المناسبة بدلاً من اعتبارها اختيارية",
      ],
      [
        "Proceed with the current design as planned, since the additional cost and schedule impact were not part of the approved budget",
        "المضي قدماً بالتصميم الحالي كما هو مخطط له، لأن التكلفة الإضافية وتأثيرها على الجدول لم يكونا جزءاً من الميزانية المعتمدة",
      ],
      [
        "Personally review the security requirement's legal text and decide whether the current design is acceptable, since the project manager is accountable for the project's outcomes",
        "مراجعة النص القانوني لمتطلب الأمن شخصياً وتحديد ما إذا كان التصميم الحالي مقبولاً، لأن مدير المشروع مسؤول عن نتائج المشروع",
      ],
      ["Postpone addressing the requirement until closer to release, since security reviews are typically handled at the end of a project", "تأجيل معالجة المتطلب إلى ما قبل الإطلاق مباشرة، لأن مراجعات الأمن تُجرى عادة في نهاية المشروع"],
    ],
    correctIndex: 0,
    explanationEn:
      "Mandatory compliance and security requirements (Compliance, Security) are not optional based on cost or schedule impact, and assessing whether and how they apply requires qualified subject-matter expertise, not the project manager's own interpretation. The project manager's role is to engage the right specialists, understand the actual gap and its impact, and then address it through the appropriate process. Option B treats a mandatory requirement as optional purely because addressing it costs money - not a valid basis for skipping compliance. Option C has the project manager personally interpret specialized security requirements without the necessary expertise, risking a wrong call on a matter with real consequences. Option D delays a mandatory requirement without justification, increasing risk and potentially requiring more costly late rework.",
    explanationAr:
      "متطلبات الامتثال والأمن الإلزامية (Compliance, Security) ليست اختيارية بناءً على تأثيرها على التكلفة أو الجدول، وتقييم انطباقها وكيفيته يتطلب خبرة متخصصة مؤهلة، لا تفسير مدير المشروع الشخصي. دور مدير المشروع هو إشراك المتخصصين المناسبين، وفهم الفجوة الفعلية وأثرها، ثم معالجتها عبر العملية المناسبة. الخيار (B) يعامل متطلباً إلزامياً كأنه اختياري لمجرد أن معالجته مكلفة - وهذا ليس أساساً مقبولاً لتجاوز الامتثال. الخيار (C) يجعل مدير المشروع يفسّر متطلبات أمنية متخصصة شخصياً دون الخبرة اللازمة، مما يخاطر باتخاذ قرار خاطئ في مسألة ذات عواقب حقيقية. الخيار (D) يؤجل متطلباً إلزامياً دون مبرر، مما يزيد المخاطرة وقد يتطلب إعادة عمل أكثر تكلفة لاحقاً.",
  },
  {
    questionEn:
      "A senior stakeholder requests a mid-project change to add a new system integration. The requested change is significant enough that it falls outside the project manager's delegated change-approval authority. A team member suggests starting the work immediately since the stakeholder is influential and the request seems reasonable. What should the project manager do?",
    questionAr:
      "يطلب أحد كبار أصحاب المصلحة تغييراً في منتصف المشروع لإضافة تكامل نظام جديد. الطلب كبير بما يكفي ليتجاوز صلاحية مدير المشروع المفوَّضة للموافقة على التغييرات (Change Control). يقترح أحد أعضاء الفريق البدء بالعمل فوراً لأن صاحب المصلحة مؤثر والطلب يبدو معقولاً. ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      [
        "Approve the change directly and have the team begin work immediately, given the stakeholder's seniority and the reasonableness of the request",
        "الموافقة على التغيير مباشرة وتكليف الفريق بالبدء بالعمل فوراً، نظراً لمكانة صاحب المصلحة ومعقولية الطلب",
      ],
      ["Decline the request outright, since accepting any change outside the original baseline creates unnecessary risk", "رفض الطلب فوراً، لأن قبول أي تغيير خارج خط الأساس الأصلي يخلق مخاطرة غير ضرورية"],
      [
        "Assess the change's impact on scope, schedule, cost, and other constraints, and route it through the defined change-control governance process for a decision by the appropriate authority before any work begins",
        "تقييم أثر التغيير على النطاق والجدول الزمني والتكلفة والقيود الأخرى، وتوجيهه عبر عملية حوكمة ضبط التغيير (Change Control) المحددة لاتخاذ قرار من الجهة المخوَّلة قبل بدء أي عمل",
      ],
      [
        "Have the team begin preliminary work on the integration while the formal change request is being evaluated, to avoid delaying the stakeholder",
        "تكليف الفريق ببدء عمل أولي على التكامل أثناء تقييم طلب التغيير الرسمي، لتجنب تأخير صاحب المصلحة",
      ],
    ],
    correctIndex: 2,
    explanationEn:
      "Change control requires understanding a change's impact before a decision is made, and since this change exceeds the project manager's delegated authority, the decision itself belongs to whoever holds that authority under the governance framework - not the project manager alone, regardless of the requester's seniority. Option A approves a change beyond the project manager's own authority, exactly the boundary the scenario says has been crossed. Option B rejects the request without an impact assessment, which is premature and not itself change control. Option D starts real work on an unapproved, out-of-authority change merely to avoid delay, creating rework risk and undermining the very control the process exists to provide.",
    explanationAr:
      "يتطلب ضبط التغيير (Change Control) فهم أثر التغيير قبل اتخاذ القرار، وبما أن هذا التغيير يتجاوز صلاحية مدير المشروع المفوَّضة، فإن القرار نفسه يعود إلى الجهة المخوَّلة بموجب إطار الحوكمة - لا مدير المشروع وحده، بغض النظر عن مكانة الطالب. الخيار (A) يوافق على تغيير يتجاوز صلاحية مدير المشروع نفسه، وهو بالضبط الحد الذي تجاوزه السيناريو. الخيار (B) يرفض الطلب دون تقييم أثر، وهو أمر سابق لأوانه وليس ضبطاً للتغيير بحد ذاته. الخيار (D) يبدأ عملاً فعلياً على تغيير غير معتمد وخارج نطاق الصلاحية لمجرد تجنب التأخير، مما يخلق مخاطرة إعادة العمل ويقوّض الضبط الذي وُجدت العملية من أجله.",
  },
  {
    questionEn:
      "A process change has already been formally approved through the project's change-control process. On the day the change takes effect, the affected team members are confused about why the change was made and hesitant to follow the new process. What does this situation call for?",
    questionAr:
      "تمت الموافقة رسمياً بالفعل على تغيير في العملية عبر عملية ضبط التغيير (Change Control) الخاصة بالمشروع. في يوم دخول التغيير حيّز التنفيذ، يشعر أعضاء الفريق المتأثرون بالارتباك حول سبب إجراء التغيير ويترددون في اتباع العملية الجديدة. ما الذي يتطلبه هذا الموقف؟",
    options: [
      [
        "Reopening the change-control process, since visible resistance suggests the change was not actually approved correctly",
        "إعادة فتح عملية ضبط التغيير، لأن المقاومة الظاهرة تشير إلى أن التغيير لم يُعتمد بشكل صحيح فعلياً",
      ],
      [
        "Change management activities such as clear communication of the reason for the change, addressing concerns, and supporting the team through adoption",
        "أنشطة إدارة التغيير (Change Management) مثل التواصل الواضح حول سبب التغيير، ومعالجة المخاوف، ودعم الفريق خلال تبنّي (Adoption) التغيير",
      ],
      [
        "A formal impact analysis of the change on scope, schedule, and cost, since that step was evidently skipped",
        "تحليل أثر رسمي للتغيير على النطاق والجدول الزمني والتكلفة، لأن هذه الخطوة تم تخطيها على ما يبدو",
      ],
      [
        "Escalating the resistance to the governance body that approved the change, since only they can address how people respond to it",
        "تصعيد المقاومة إلى الجهة الحوكمية التي اعتمدت التغيير، لأنها وحدها القادرة على معالجة استجابة الأشخاص له",
      ],
    ],
    correctIndex: 1,
    explanationEn:
      "This is a change management gap, not a change control gap - the change itself was already properly approved (its scope, impact, and approval are not in question), but the people affected haven't been prepared to understand, accept, and adopt it. That calls for change management activities (communication, addressing concerns, support) - distinct from the change-control steps of deciding whether and how a change is approved. Option A misdiagnoses adoption resistance as an approval problem, when the approval already happened correctly. Option C repeats a change-control step that isn't what's missing here; the gap is in people's readiness and understanding, not in the technical/project impact assessment. Option D escalates a normal adoption challenge to the governance body, when helping people through the change is the project team's role, not something only the approving authority can address.",
    explanationAr:
      "هذا نقص في إدارة التغيير (Change Management)، لا في ضبط التغيير (Change Control) - فالتغيير نفسه اعتُمد بشكل صحيح بالفعل (نطاقه وأثره واعتماده ليست موضع شك)، لكن الأشخاص المتأثرين لم يُهيَّأوا لفهم التغيير وقبوله وتبنّيه. وهذا يتطلب أنشطة إدارة التغيير (التواصل، معالجة المخاوف، الدعم) - وهي مختلفة عن خطوات ضبط التغيير المتعلقة بتحديد ما إذا كان التغيير يُعتمد وكيف. الخيار (A) يسيء تشخيص مقاومة التبنّي باعتبارها مشكلة اعتماد، بينما الاعتماد قد تم بشكل صحيح بالفعل. الخيار (C) يكرر خطوة من ضبط التغيير ليست هي الناقصة هنا؛ فالفجوة في جاهزية الأشخاص وفهمهم، لا في تقييم الأثر التقني/المشروعي. الخيار (D) يصعّد تحدياً طبيعياً في التبنّي إلى الجهة الحوكمية، بينما مساعدة الأشخاص خلال التغيير هي دور فريق المشروع، وليست أمراً تنفرد الجهة المعتمِدة بمعالجته.",
  },
  {
    // Q6: Option B + explanation precision-corrected per Zaid's feedback - correct answer A unchanged.
    questionEn:
      "Several weeks ago, the project team identified and logged a risk that the primary payment gateway vendor might experience capacity problems during the upcoming peak season. That capacity problem has now actually occurred, disrupting transactions today. In this week's status report, the project manager still lists it in the risk register and describes it to stakeholders as \"a risk the team is monitoring.\" What is the most important correction the project manager should make?",
    questionAr:
      "قبل عدة أسابيع، حدد فريق المشروع وسجّل مخاطرة (Risk) مفادها أن مزوّد بوابة الدفع الرئيسي قد يواجه مشكلات في السعة خلال موسم الذروة القادم. وقد وقعت مشكلة السعة تلك فعلياً الآن، مما يعطّل المعاملات اليوم. في تقرير حالة هذا الأسبوع، لا يزال مدير المشروع يدرجها في سجل المخاطر ويصفها لأصحاب المصلحة بأنها \"مخاطرة يراقبها الفريق\". ما هو أهم تصحيح ينبغي لمدير المشروع إجراؤه؟",
    options: [
      [
        "Recognize that the risk has occurred and is now an issue, and manage it through the issue-management process - including immediate response - rather than continuing to describe it only as something being monitored",
        "إدراك أن المخاطرة قد وقعت وأصبحت الآن مشكلة (Issue)، وإدارتها عبر عملية إدارة المشكلات - بما في ذلك استجابة فورية - بدلاً من الاستمرار في وصفها بأنها مجرد أمر تحت المراقبة",
      ],
      [
        "Close the risk record and take no further action, since the uncertainty no longer exists",
        "إغلاق سجل المخاطرة وعدم اتخاذ أي إجراء إضافي، لأن حالة عدم اليقين لم تعد موجودة",
      ],
      ["Keep describing it as a risk in stakeholder communications, since it originated from the risk management process", "الاستمرار في وصفه كمخاطرة في التواصل مع أصحاب المصلحة، لأنه نشأ من عملية إدارة المخاطر"],
      [
        "Escalate the situation immediately to executive management before taking any direct action to address the disruption",
        "تصعيد الموقف فوراً إلى الإدارة التنفيذية قبل اتخاذ أي إجراء مباشر لمعالجة الانقطاع",
      ],
    ],
    correctIndex: 0,
    explanationEn:
      "A risk (Risk) is an uncertain future event; once it occurs, the uncertainty ends, and the event should be managed as an issue (Issue) - with active response - not continue to be described as something merely being \"monitored,\" which understates its current, active impact and can delay urgent action. Option B is correct that the uncertainty itself has ended, but incorrectly treats that as the end of the matter: the event has materialized and is actively disrupting transactions today, so it now requires active issue management, not closure with no further action. (How the original risk record itself is updated, closed, or retained is a matter of the project's own risk-management process - the point being tested here is not the record-keeping mechanics, but that the occurred event must now be managed as an issue, not treated as if nothing further is required.) Option C continues the exact mischaracterization the scenario is testing - calling an occurred event a risk misleads stakeholders about its urgency and current status. Option D escalates before taking any direct action, when an active, ongoing disruption typically calls for immediate response, and nothing in this scenario indicates the needed response is actually beyond the project manager's authority.",
    explanationAr:
      "المخاطرة (Risk) هي حدث مستقبلي غير مؤكد؛ وعند وقوعها، تنتفي حالة عدم اليقين، وينبغي عندها إدارة الحدث كمشكلة (Issue) - باستجابة فعّالة - لا الاستمرار في وصفه بأنه مجرد أمر \"تحت المراقبة\"، وهو ما يقلل من أهمية تأثيره الفعلي الحالي وقد يؤخر إجراءً عاجلاً. الخيار (B) محق في أن حالة عدم اليقين نفسها قد انتهت، لكنه يعامل ذلك خطأً على أنه نهاية الأمر: فالحدث قد تحقق فعلياً ويسبب انقطاعاً فعلياً في المعاملات اليوم، لذا فهو يتطلب الآن إدارة فعّالة كمشكلة، لا إغلاقاً دون اتخاذ أي إجراء إضافي. (أما كيفية تحديث سجل المخاطرة الأصلي أو إغلاقه أو الاحتفاظ به فهي مسألة تخص عملية إدارة المخاطر الخاصة بالمشروع نفسه - والنقطة التي يختبرها هذا السؤال ليست آلية حفظ السجلات، بل أن الحدث الذي وقع يجب إدارته الآن كمشكلة، لا معاملته وكأن لا حاجة لأي إجراء إضافي.) الخيار (C) يستمر في نفس التوصيف الخاطئ الذي يختبره السيناريو - فتسمية حدث وقع فعلاً بأنه مخاطرة يضلل أصحاب المصلحة حول إلحاحه وحالته الحالية. الخيار (D) يصعّد قبل اتخاذ أي إجراء مباشر، بينما الانقطاع النشط والمستمر يستدعي عادة استجابة فورية، ولا يوجد في هذا السيناريو ما يشير إلى أن الاستجابة اللازمة تتجاوز فعلياً صلاحية مدير المشروع.",
  },
  {
    questionEn:
      "The team had previously identified a risk that a critical open-source library the product depends on might become unmaintained, and defined a response plan to migrate to an alternative if that happened. A developer now notices that the library's public development activity has dropped sharply over the past two months, which may be an early trigger for this risk. What should the project manager do?",
    questionAr:
      "حدد الفريق سابقاً مخاطرة (Risk) مفادها أن مكتبة مفتوحة المصدر بالغة الأهمية يعتمد عليها المنتج قد يتوقف صيانتها، ووضع خطة استجابة للانتقال إلى بديل في حال حدث ذلك. يلاحظ أحد المطورين الآن أن نشاط التطوير العلني للمكتبة قد انخفض بشكل حاد خلال الشهرين الماضيين، وقد يكون ذلك مؤشراً مبكراً لتفعيل (Trigger) هذه المخاطرة. ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      ["Immediately begin the full migration to the alternative library, since the trigger appears to be occurring", "البدء فوراً في الانتقال الكامل إلى المكتبة البديلة، لأن المؤشر يبدو أنه يتحقق"],
      [
        "Remove the item from the risk register, since a drop in development activity does not guarantee the library will become unmaintained",
        "إزالة البند من سجل المخاطر، لأن انخفاض نشاط التطوير لا يضمن توقف صيانة المكتبة",
      ],
      [
        "Wait until the library is fully unmaintained and causing an actual problem before taking any action, since the response plan was only meant for that point",
        "الانتظار حتى تتوقف صيانة المكتبة بالكامل وتسبب مشكلة فعلية قبل اتخاذ أي إجراء، لأن خطة الاستجابة كانت مخصصة لتلك المرحلة فقط",
      ],
      [
        "Verify the observed signal against the risk's defined trigger condition and gather more information before deciding whether to initiate the planned migration response",
        "التحقق من المؤشر الملاحَظ مقابل شرط التفعيل (Trigger) المحدد للمخاطرة، وجمع مزيد من المعلومات قبل تحديد ما إذا كان سيتم البدء بخطة استجابة الانتقال المخطط لها",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "Risk monitoring involves recognizing early signals and checking them against the risk's defined trigger condition, then validating with enough information before committing to a potentially costly planned response - jumping straight to executing a major response on a single early signal risks an unnecessary, disruptive action if the signal turns out to be a false alarm or temporary. Option A executes the full response (Risk Response) prematurely, without confirming it actually reflects the defined trigger condition. Option B dismisses a genuine early warning sign entirely, which contradicts active risk monitoring - the appropriate response is investigation, not removal. Option C waits for the risk to fully materialize into an issue before acting at all, defeating the purpose of having a proactive, trigger-based response plan meant to act before the risk fully occurs.",
    explanationAr:
      "تتضمن مراقبة المخاطر التعرف على المؤشرات المبكرة والتحقق منها مقابل شرط التفعيل (Trigger) المحدد للمخاطرة، ثم التحقق بمعلومات كافية قبل الالتزام باستجابة مخطط لها قد تكون مكلفة - فالانتقال المباشر لتنفيذ استجابة رئيسية بناءً على مؤشر مبكر واحد يحمل خطر اتخاذ إجراء غير ضروري ومعطّل إذا تبيّن أن المؤشر كان إنذاراً كاذباً أو مؤقتاً. الخيار (A) ينفذ الاستجابة الكاملة (Risk Response) قبل الأوان، دون التأكد من أنها تعكس فعلياً شرط التفعيل المحدد. الخيار (B) يتجاهل إشارة إنذار مبكر حقيقية كلياً، مما يتعارض مع المراقبة الفعّالة للمخاطر - فالاستجابة المناسبة هي التحقيق، لا الإزالة. الخيار (C) ينتظر تحقق المخاطرة بالكامل وتحوّلها إلى مشكلة قبل اتخاذ أي إجراء، مما يفوّت الغرض من وجود خطة استجابة استباقية قائمة على مؤشر تفعيل تهدف للتصرف قبل وقوع المخاطرة بالكامل.",
  },
  {
    questionEn:
      "The same category of deployment failure has recurred across the last three release cycles. Each time, the team applies a quick fix and documents the incident in the lessons-learned log, but the underlying cause is never addressed, and the same failure happens again in the next cycle. What is missing from the team's approach to continuous improvement?",
    questionAr:
      "تكررت نفس فئة فشل النشر عبر آخر ثلاث دورات إصدار. في كل مرة، يطبّق الفريق إصلاحاً سريعاً ويوثّق الحادثة في سجل الدروس المستفادة (Lessons Learned)، لكن السبب الأساسي لا تتم معالجته أبداً، ويتكرر الفشل نفسه في الدورة التالية. ما الذي ينقص نهج الفريق في التحسين المستمر (Continuous Improvement)؟",
    options: [
      ["Documenting the incidents in more detail each time so future teams have a more complete historical record", "توثيق الحوادث بتفصيل أكبر في كل مرة ليكون لدى الفرق المستقبلية سجل تاريخي أكثر اكتمالاً"],
      ["Assigning a different team member to apply the quick fix each time, to distribute the workload more evenly", "تكليف عضو فريق مختلف بتطبيق الإصلاح السريع في كل مرة، لتوزيع عبء العمل بشكل أكثر توازناً"],
      [
        "Using the recurring pattern to identify the true root cause and actually changing the relevant process or practice to prevent recurrence, not just documenting each incident",
        "استخدام النمط المتكرر لتحديد السبب الجذري الحقيقي وتغيير العملية أو الممارسة ذات الصلة فعلياً لمنع تكراره، لا الاكتفاء بتوثيق كل حادثة",
      ],
      ["Waiting until the project's final closure phase to conduct a comprehensive lessons-learned review covering all recurring issues", "الانتظار حتى مرحلة إغلاق المشروع النهائية لإجراء مراجعة شاملة للدروس المستفادة تغطي جميع المشكلات المتكررة"],
    ],
    correctIndex: 2,
    explanationEn:
      "Continuous improvement and organizational learning mean using lessons learned to actually change practices and prevent recurrence - not merely recording incidents. A recurring pattern across multiple cycles is a strong signal to investigate the true root cause and change the relevant process, rather than repeating the same quick fix and documentation cycle indefinitely. Option A improves documentation quality but does nothing to change the practice or prevent recurrence - the core failure of the current approach. Option B redistributes effort without addressing why the problem keeps happening. Option D defers all learning to project closure, when the recurring pattern is visible now and should be addressed during the project, not just recorded for a future retrospective.",
    explanationAr:
      "يعني التحسين المستمر والتعلم المؤسسي (Continuous Improvement) استخدام الدروس المستفادة لتغيير الممارسات فعلياً ومنع تكرار المشكلة - لا مجرد تسجيل الحوادث. النمط المتكرر عبر عدة دورات مؤشر قوي على ضرورة التحقيق في السبب الجذري الحقيقي وتغيير العملية ذات الصلة، بدلاً من تكرار نفس دورة الإصلاح السريع والتوثيق إلى أجل غير مسمى. الخيار (A) يحسّن جودة التوثيق لكنه لا يغيّر الممارسة أو يمنع التكرار - وهو الفشل الجوهري في النهج الحالي. الخيار (B) يعيد توزيع الجهد دون معالجة سبب استمرار حدوث المشكلة. الخيار (D) يؤجل كل التعلم إلى إغلاق المشروع، بينما النمط المتكرر ظاهر الآن وينبغي معالجته خلال المشروع، لا تسجيله فقط لمراجعة مستقبلية.",
  },
  {
    questionEn:
      "A new system has been fully built, tested, and formally approved for rollout. However, many affected employees are resistant to using it because they do not understand why the change is happening or how it will affect their day-to-day work. What should the project team do?",
    questionAr:
      "تم بناء نظام جديد بالكامل واختباره واعتماده رسمياً للطرح. لكن العديد من الموظفين المتأثرين يقاومون استخدامه لأنهم لا يفهمون سبب حدوث التغيير أو كيفية تأثيره على عملهم اليومي. ماذا ينبغي لفريق المشروع أن يفعل؟",
    options: [
      [
        "Proceed with the rollout as scheduled, since the system has already been technically approved and employee understanding is a separate concern",
        "المضي قدماً بالطرح كما هو مجدول، لأن النظام اعتُمد تقنياً بالفعل وفهم الموظفين مسألة منفصلة",
      ],
      [
        "Engage in deliberate organizational change activities - communicating the reasons for the change, addressing concerns, involving sponsors, and providing training and support - to build readiness and adoption before and during rollout",
        "القيام بأنشطة تغيير مؤسسي (Organizational Change) متعمدة - التواصل حول أسباب التغيير، ومعالجة المخاوف، وإشراك الرعاة، وتوفير التدريب والدعم - لبناء الجاهزية والتبنّي (Adoption) قبل الطرح وأثناءه",
      ],
      ["Delay the rollout indefinitely until every employee independently expresses support for the change", "تأجيل الطرح إلى أجل غير مسمى حتى يعبّر كل موظف بشكل مستقل عن دعمه للتغيير"],
      [
        "Mandate immediate use of the new system and treat continued resistance as a performance issue to be handled through disciplinary action",
        "فرض الاستخدام الفوري للنظام الجديد ومعاملة استمرار المقاومة كمشكلة أداء تُعالَج عبر إجراء تأديبي",
      ],
    ],
    correctIndex: 1,
    explanationEn:
      "Technical readiness and organizational readiness are different things; a system being built, tested, and approved does not mean the people affected are prepared to adopt it. Deliberate organizational change activities - clear communication of the \"why,\" addressing concerns, visible sponsorship, and adequate training/support - build the understanding and readiness needed for real adoption. Option A treats employee understanding as irrelevant to rollout success, when it is actually central to whether the change is sustained. Option C sets an unrealistic bar (universal independent support) that would indefinitely stall virtually any organizational change. Option D uses discipline to force compliance without addressing the underlying lack of understanding, risking superficial compliance without genuine adoption and damaging trust.",
    explanationAr:
      "الجاهزية التقنية والجاهزية المؤسسية أمران مختلفان؛ فبناء النظام واختباره واعتماده لا يعني أن الأشخاص المتأثرين مستعدون لتبنّيه. أنشطة التغيير المؤسسي (Organizational Change) المتعمدة - التواصل الواضح حول \"السبب\"، ومعالجة المخاوف، والرعاية الظاهرة، والتدريب والدعم الكافيين - تبني الفهم والجاهزية اللازمين للتبنّي الحقيقي. الخيار (A) يعامل فهم الموظفين وكأنه غير ذي صلة بنجاح الطرح، بينما هو في الواقع محوري لاستمرارية التغيير. الخيار (C) يضع معياراً غير واقعي (دعم مستقل شامل) من شأنه تعطيل أي تغيير مؤسسي تقريباً إلى أجل غير مسمى. الخيار (D) يستخدم الإجراء التأديبي لفرض الامتثال دون معالجة نقص الفهم الأساسي، مما يخاطر بامتثال سطحي دون تبنّي حقيقي ويضر بالثقة.",
  },
  {
    questionEn:
      "Partway through development, a competitor unexpectedly launches a free product that offers similar core functionality to what the project is building. This significantly changes the market assumptions the project's business case was based on. What should the project manager do?",
    questionAr:
      "في منتصف مرحلة التطوير، يطلق أحد المنافسين بشكل غير متوقع منتجاً مجانياً يقدّم وظائف أساسية مشابهة لما يبنيه المشروع. يغيّر هذا بشكل كبير افتراضات السوق التي استندت إليها حالة العمل (Business Case) للمشروع. ماذا ينبغي لمدير المشروع أن يفعل؟",
    options: [
      ["Continue executing the original plan unchanged, since the project was already approved and formally authorized", "الاستمرار في تنفيذ الخطة الأصلية دون تغيير، لأن المشروع اعتُمد وفُوِّض رسمياً بالفعل"],
      [
        "Unilaterally cancel the project immediately, since continuing to build a product with reduced competitive advantage is not worthwhile",
        "إلغاء المشروع من جانب واحد فوراً، لأن الاستمرار في بناء منتج بميزة تنافسية متراجعة غير مجدٍ",
      ],
      [
        "Unilaterally redesign the product's scope and strategy to directly compete with the new competitor offering, without further validation",
        "إعادة تصميم نطاق المنتج واستراتيجيته من جانب واحد لمنافسة عرض المنافس الجديد مباشرة، دون مزيد من التحقق",
      ],
      [
        "Work with the appropriate stakeholders and business/market experts to assess the actual impact on the project's value and assumptions, then proceed through governance for any resulting decision",
        "العمل مع أصحاب المصلحة المعنيين وخبراء الأعمال/السوق لتقييم الأثر الفعلي على قيمة المشروع وافتراضاته، ثم المضي عبر الحوكمة (Governance) لأي قرار ناتج",
      ],
    ],
    correctIndex: 3,
    explanationEn:
      "A material change in the external business environment (External Business Environment) can affect a project's underlying value, assumptions, and strategic fit, and the appropriate response starts with understanding and assessing that impact with the right stakeholders and expertise - not blindly continuing the original plan, and not making a unilateral major decision without going through governance, since decisions of that magnitude are typically beyond the project manager's individual authority. Option A ignores a real external change that may materially affect whether the project still makes sense as planned. Option B jumps to cancellation without proper assessment or authority, which may not be justified. Option C commits to a significant strategic pivot without validating it or securing the necessary approval, also outside the project manager's likely authority.",
    explanationAr:
      "يمكن لتغيّر جوهري في بيئة الأعمال الخارجية (External Business Environment) أن يؤثر على قيمة المشروع وافتراضاته وملاءمته الاستراتيجية، والاستجابة المناسبة تبدأ بفهم وتقييم هذا الأثر مع أصحاب المصلحة والخبرة المناسبين - لا الاستمرار الأعمى في الخطة الأصلية، ولا اتخاذ قرار رئيسي من جانب واحد دون المرور بالحوكمة، لأن قرارات بهذا الحجم عادة ما تتجاوز صلاحية مدير المشروع الفردية. الخيار (A) يتجاهل تغيّراً خارجياً حقيقياً قد يؤثر جوهرياً على ما إذا كان المشروع لا يزال منطقياً كما هو مخطط له. الخيار (B) يقفز إلى الإلغاء دون تقييم أو صلاحية مناسبين، وقد لا يكون مبرراً. الخيار (C) يلتزم بتحوّل استراتيجي كبير دون التحقق منه أو تأمين الموافقة اللازمة، وهو أيضاً خارج نطاق صلاحية مدير المشروع على الأرجح.",
  },
];
