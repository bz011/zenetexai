/**
 * Privacy Policy / Terms of Service / Refund Policy - production-facing
 * content, finalized per explicit owner decisions (Master Audit Wave 0,
 * final pass, 2026-09-30).
 *
 * OWNER DECISIONS APPLIED (verbatim intent, not re-derived):
 * - Business identity: "ZentexAI" is used as the public brand/trading name
 *   throughout. ZentexAI has no trade license and no incorporated or
 *   registered legal entity today - nothing below describes it as
 *   incorporated, licensed, registered, an LLC, an FZ-LLC, or any other
 *   legal entity type, and no license number, registered company name,
 *   registered office, or physical address is stated (invented or
 *   otherwise) - those details are simply omitted, not placeholder-marked.
 * - Refund policy: the exact business rule the owner approved (see the
 *   Refund Policy's "Refund Eligibility" section) - not an invented window.
 * - Age: no minimum age is imposed or invented; see "Who This Service Is
 *   For" in the Privacy Policy for the conservative wording used instead.
 * - Contact: albadareen011@gmail.com is the monitored contact address used
 *   wherever a privacy/legal/support contact email is needed on these three
 *   pages specifically. info@zentexai.com (not a live mailbox) is not used
 *   anywhere. This address is not referenced from any other part of the
 *   site's client-side code (e.g. the contact form/API) - it appears only
 *   here, as an intentionally displayed contact address.
 *
 * NOT LEGAL ADVICE, NOT LEGALLY REVIEWED: nothing below claims a lawyer has
 * reviewed it. A few clauses that genuinely depend on jurisdiction (data-
 * protection rights, liability, governing law) are written in deliberately
 * conservative, factual, non-committal language rather than asserting a
 * specific legal conclusion this pass has no basis to make - see each
 * section. That is a narrower, honest gap, not an unresolved placeholder.
 */

export interface LegalSection {
  heading: string;
  /** Each string is one paragraph or list item, rendered in order. Prefixing an item with "- " renders it as a bullet. */
  body: string[];
}

export interface LegalDoc {
  title: string;
  updated: string;
  intro: string[];
  sections: LegalSection[];
}

const LAST_UPDATED = "September 30, 2026";
const LAST_UPDATED_AR = "30 سبتمبر 2026";
const CONTACT_EMAIL = "albadareen011@gmail.com";

// ─── Privacy Policy ─────────────────────────────────────────────────────────

const privacyEn: LegalDoc = {
  title: "Privacy Policy",
  updated: `Last updated: ${LAST_UPDATED}`,
  intro: [
    "This Privacy Policy explains what information ZentexAI collects through zentexai.com and the ZentexAI Academy, why it is collected, and who it is shared with. It covers the public marketing site, the Contact form, account registration, course and Simulator access, and certificate verification.",
  ],
  sections: [
    {
      heading: "Who We Are",
      body: ["ZentexAI is the trading name under which zentexai.com and the ZentexAI Academy are operated. Questions about this policy can be sent to the contact address at the end of this page."],
    },
    {
      heading: "Who This Service Is For",
      body: [
        "ZentexAI and ZentexAI Academy are intended for business and working-professional use - organizations exploring AI and automation, and individuals preparing for the PMP exam. This service is not directed at children. If you believe a child has provided us with personal information, contact us using the address below and we will address it.",
      ],
    },
    {
      heading: "Information We Collect",
      body: [
        "Browsing the public site (before you create an account or submit a form): we do not set any cookies, and we store nothing on our servers about your visit. The only thing stored on your own device is your language preference (English/Arabic), saved locally in your browser so the site remembers your choice on your next visit - this is never sent to us or to any third party.",
        "- Contact form: when you submit the Contact form, we collect your name, email address, company name (if provided), the type of inquiry you selected, and your message, so we can respond to you.",
        "- Creating an account: if you register for the ZentexAI Academy, we collect your email address, first and last name, and a securely hashed password (we never see or store your password in plain text - this is handled by our authentication provider).",
        "- Course activity: if you enroll in a course, we store your lesson completion status, quiz/assessment attempts and answers, and any personal notes you write against a lesson.",
        "- Purchases: if you buy access to a paid program (currently the PMP Exam Simulator and/or PMP Mastery Program), your payment is handled entirely by our payment processor - see \"Third-Party Service Providers\" below. We store a record that you purchased access (what you bought, when, and its status), but we do not receive or store your full card number.",
        "- Certificates: if you complete a course that issues a certificate, we store your name (as you provide it for the certificate), the course name, the date issued, and a unique certificate number.",
      ],
    },
    {
      heading: "How We Use Your Information",
      body: [
        "- To respond to inquiries submitted through the Contact form.",
        "- To create and maintain your account, and to let you sign in.",
        "- To track your course progress, grade quizzes and assessments, and unlock content and certificates you have earned.",
        "- To process and confirm purchases and grant access to what you paid for.",
        "- To generate and let you download your certificate, and to let anyone verify it using its certificate number (see \"Certificate Verification\" below).",
        "- To communicate with you about your account, purchases, or inquiries.",
        "We do not currently use your information for marketing communications, and we do not sell your information to anyone.",
      ],
    },
    {
      heading: "Third-Party Service Providers",
      body: [
        "We use the following service providers to operate ZentexAI. Each only receives the information it needs to perform its function, and each maintains its own security and privacy practices for the data it processes on our behalf:",
        "- Supabase: our authentication and database provider. It stores your account details, course progress, quiz/assessment data, notes, purchase records, and certificates.",
        "- Ziina: our payment processor for paid programs. Ziina handles your payment details directly; we do not receive or store your full card number.",
        "- Google (Apps Script): Contact form submissions are forwarded to a Google Sheet we use internally to track and respond to inquiries.",
        "- Video hosting: depending on the specific lesson, course videos may be delivered through Bunny.net, YouTube, or Vimeo.",
        "Some of these providers may process information in locations other than your own; we work with established providers who maintain their own security and compliance practices for cross-border data handling.",
      ],
    },
    {
      heading: "Certificate Verification",
      body: [
        "Certificates issued by ZentexAI Academy include a unique certificate number. Anyone who has that number can look up and see the certificate holder's name, the course completed, and the date of issue on our public verification page - this is intentional, so a certificate can be verified by a third party (such as an employer), and the certificate number itself is not sequential or guessable.",
      ],
    },
    {
      heading: "How Long We Keep Your Information",
      body: [
        "We keep your account, course-progress, purchase, and certificate information for as long as your account is active. If you would like your account or data deleted, contact us using the address below and we will act on your request, subject to any records we need to retain for legitimate business or legal reasons (for example, purchase records needed for accounting).",
      ],
    },
    {
      heading: "Your Rights",
      body: [
        "Depending on where you are located, you may have rights over your personal data, such as accessing, correcting, or requesting deletion of it. Contact us using the address below to exercise any of these rights, and we will respond in a reasonable time and consistent with any law that applies to you.",
      ],
    },
    {
      heading: "Changes to This Policy",
      body: ["We may update this Privacy Policy from time to time. When we do, we will update the \"Last updated\" date at the top of this page. Continuing to use ZentexAI after a change means you accept the updated policy."],
    },
    {
      heading: "Contact Us",
      body: [`For questions about this Privacy Policy, or to exercise any of the rights described above, email us at ${CONTACT_EMAIL} or use the Contact page.`],
    },
  ],
};

const privacyAr: LegalDoc = {
  title: "سياسة الخصوصية",
  updated: `آخر تحديث: ${LAST_UPDATED_AR}`,
  intro: [
    "توضّح سياسة الخصوصية هذه المعلومات التي تجمعها ZentexAI عبر موقع zentexai.com وأكاديمية ZentexAI، وسبب جمعها، والجهات التي تُشارَك معها. تغطي هذه السياسة الموقع التسويقي العام، ونموذج التواصل، وإنشاء الحساب، والوصول إلى الدورات والمحاكي، والتحقق من الشهادات.",
  ],
  sections: [
    {
      heading: "من نحن",
      body: ["ZentexAI هو الاسم التجاري الذي يُشغَّل تحته موقع zentexai.com وأكاديمية ZentexAI. يمكن إرسال أي استفسار حول هذه السياسة إلى عنوان التواصل في نهاية هذه الصفحة."],
    },
    {
      heading: "لمن هذه الخدمة",
      body: [
        "صُممت ZentexAI وأكاديمية ZentexAI للاستخدام التجاري والمهني — للمؤسسات التي تستكشف الذكاء الاصطناعي والأتمتة، والأفراد الذين يستعدون لامتحان PMP. هذه الخدمة غير موجهة للأطفال. إذا كنت تعتقد أن طفلاً قدّم لنا معلومات شخصية، تواصل معنا عبر العنوان أدناه وسنتعامل مع الأمر.",
      ],
    },
    {
      heading: "المعلومات التي نجمعها",
      body: [
        "عند تصفح الموقع العام (قبل إنشاء حساب أو إرسال أي نموذج): لا نضع أي ملفات تعريف ارتباط (كوكيز)، ولا نخزّن على خوادمنا أي شيء عن زيارتك. الشيء الوحيد المخزَّن على جهازك هو تفضيل اللغة (عربي/إنجليزي)، ويُحفظ محلياً في متصفحك ليتذكر الموقع اختيارك في زيارتك التالية — ولا يُرسَل هذا إلينا ولا إلى أي جهة أخرى مطلقاً.",
        "- نموذج التواصل: عند إرسال نموذج التواصل، نجمع اسمك وبريدك الإلكتروني واسم شركتك (إن ذُكر) ونوع الاستفسار الذي اخترته ورسالتك، لنتمكن من الرد عليك.",
        "- إنشاء حساب: عند التسجيل في أكاديمية ZentexAI، نجمع بريدك الإلكتروني واسمك الأول واسم عائلتك، وكلمة مرور مشفّرة بشكل آمن (لا نرى كلمة مرورك أو نخزّنها كنص صريح مطلقاً — يتولى هذا مزوّد خدمة المصادقة لدينا).",
        "- نشاط الدورة: عند التسجيل في دورة، نخزّن حالة إكمالك للدروس، ومحاولات وإجابات الاختبارات/التقييمات، وأي ملاحظات شخصية تكتبها على درس معين.",
        "- المشتريات: عند شراء الوصول إلى برنامج مدفوع (حالياً محاكي اختبار PMP و/أو برنامج احتراف PMP)، تتم معالجة دفعتك بالكامل عبر معالج الدفع لدينا — انظر \"مزوّدو الخدمة من الأطراف الثالثة\" أدناه. نحتفظ بسجل يثبت أنك اشتريت الوصول (ماذا اشتريت، ومتى، وحالته)، لكننا لا نستلم أو نخزّن رقم بطاقتك الكامل.",
        "- الشهادات: عند إكمال دورة تصدر شهادة، نخزّن اسمك (كما تقدمه للشهادة)، واسم الدورة، وتاريخ الإصدار، ورقم شهادة فريد.",
      ],
    },
    {
      heading: "كيف نستخدم معلوماتك",
      body: [
        "- للرد على الاستفسارات المرسلة عبر نموذج التواصل.",
        "- لإنشاء حسابك والحفاظ عليه، وتمكينك من تسجيل الدخول.",
        "- لتتبع تقدمك في الدورة، وتصحيح الاختبارات والتقييمات، وفتح المحتوى والشهادات التي أنجزتها.",
        "- لمعالجة المشتريات وتأكيدها ومنحك الوصول إلى ما دفعت مقابله.",
        "- لإصدار شهادتك وتمكينك من تنزيلها، وتمكين أي جهة من التحقق منها باستخدام رقم الشهادة (انظر \"التحقق من الشهادات\" أدناه).",
        "- للتواصل معك بخصوص حسابك أو مشترياتك أو استفساراتك.",
        "لا نستخدم معلوماتك حالياً لأي تواصل تسويقي، ولا نبيع معلوماتك لأي جهة.",
      ],
    },
    {
      heading: "مزوّدو الخدمة من الأطراف الثالثة",
      body: [
        "نستخدم مزوّدي الخدمة التالين لتشغيل ZentexAI. يستلم كل منهم فقط المعلومات اللازمة لأداء وظيفته، ويحتفظ كل منهم بممارساته الخاصة في الأمان والخصوصية للبيانات التي يعالجها نيابة عنا:",
        "- Supabase: مزوّد المصادقة وقاعدة البيانات لدينا. يخزّن تفاصيل حسابك، وتقدمك في الدورة، وبيانات الاختبارات/التقييمات، وملاحظاتك، وسجلات مشترياتك، وشهاداتك.",
        "- Ziina: معالج الدفع لدينا للبرامج المدفوعة. تتولى Ziina تفاصيل دفعتك مباشرة؛ ولا نستلم أو نخزّن رقم بطاقتك الكامل.",
        "- Google (Apps Script): تُحال طلبات نموذج التواصل إلى جدول بيانات Google نستخدمه داخلياً لمتابعة الاستفسارات والرد عليها.",
        "- استضافة الفيديو: بحسب الدرس المحدد، قد تُقدَّم فيديوهات الدورة عبر Bunny.net أو YouTube أو Vimeo.",
        "قد يعالج بعض هذه المزوّدين المعلومات في مواقع غير موقعك؛ ونتعامل مع مزوّدين معتمدين يحافظون على ممارساتهم الخاصة في الأمان والامتثال لمعالجة البيانات عبر الحدود.",
      ],
    },
    {
      heading: "التحقق من الشهادات",
      body: [
        "تتضمن الشهادات الصادرة عن أكاديمية ZentexAI رقم شهادة فريداً. يمكن لأي شخص يملك هذا الرقم البحث عن الشهادة ورؤية اسم حاملها والدورة التي أكملها وتاريخ إصدارها عبر صفحة التحقق العامة لدينا — وهذا متعمد، ليتمكن طرف ثالث (كجهة توظيف) من التحقق من الشهادة، ورقم الشهادة نفسه غير تسلسلي أو قابل للتخمين.",
      ],
    },
    {
      heading: "مدة الاحتفاظ بمعلوماتك",
      body: [
        "نحتفظ بمعلومات حسابك وتقدمك في الدورة ومشترياتك وشهاداتك طوال مدة نشاط حسابك. إذا رغبت في حذف حسابك أو بياناتك، تواصل معنا عبر العنوان أدناه وسنتصرف بناءً على طلبك، مع مراعاة أي سجلات يجب الاحتفاظ بها لأسباب تجارية أو قانونية مشروعة (مثل سجلات المشتريات اللازمة للمحاسبة).",
      ],
    },
    {
      heading: "حقوقك",
      body: [
        "بحسب موقعك، قد يكون لديك حقوق على بياناتك الشخصية، مثل الوصول إليها أو تصحيحها أو طلب حذفها. تواصل معنا عبر العنوان أدناه لممارسة أي من هذه الحقوق، وسنستجيب خلال مدة معقولة وبما يتوافق مع أي قانون ينطبق عليك.",
      ],
    },
    {
      heading: "التغييرات على هذه السياسة",
      body: ["قد نحدّث سياسة الخصوصية هذه من وقت لآخر. عند القيام بذلك، سنحدّث تاريخ \"آخر تحديث\" أعلى هذه الصفحة. استمرارك في استخدام ZentexAI بعد أي تغيير يعني موافقتك على السياسة المحدَّثة."],
    },
    {
      heading: "تواصل معنا",
      body: [`لأي استفسار حول سياسة الخصوصية هذه، أو لممارسة أي من الحقوق الموضحة أعلاه، راسلنا على ${CONTACT_EMAIL} أو عبر صفحة التواصل.`],
    },
  ],
};

// ─── Terms of Service ───────────────────────────────────────────────────────

const termsEn: LegalDoc = {
  title: "Terms of Service",
  updated: `Last updated: ${LAST_UPDATED}`,
  intro: [
    "These Terms of Service govern your use of zentexai.com and the ZentexAI Academy, including the Contact form, account registration, paid programs (the PMP Exam Simulator and PMP Mastery Program), and certificates. \"ZentexAI\", \"we\", and \"us\" refer to the individual(s) operating ZentexAI.",
  ],
  sections: [
    {
      heading: "Acceptance of Terms",
      body: ["By using zentexai.com or creating an account with ZentexAI Academy, you agree to these Terms of Service and to our Privacy Policy and Refund Policy."],
    },
    {
      heading: "Description of Service",
      body: [
        "ZentexAI provides: (a) AI solutions, AI consulting, and project management consulting services, engaged through the Contact form; and (b) ZentexAI Academy, offering the PMP Mastery Program course and PMP Exam Simulator, which include lessons, practice questions, timed mock exams, progress tracking, and a Certificate of Completion for the Mastery Program.",
        "The Certificate of Completion recognizes completion of ZentexAI Academy's own PMP Mastery Program. It is not a PMP® or PMI® certification and does not represent PMI-issued credentials or exam eligibility - PMP® and PMI® are marks of the Project Management Institute, and ZentexAI is not affiliated with, endorsed by, or acting on behalf of PMI.",
      ],
    },
    {
      heading: "Accounts",
      body: [
        "You must provide accurate information when creating an account and are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. This service is intended for business and working-professional use and is not directed at children.",
      ],
    },
    {
      heading: "Purchases and Payment",
      body: [
        "Paid programs are purchased through Ziina, our third-party payment processor. The price shown at checkout is the amount you will be charged. Purchasing access to the PMP Exam Simulator and/or PMP Mastery Program grants you access to that program for the period stated at purchase.",
      ],
    },
    {
      heading: "Refunds",
      body: ["Refunds are governed by our Refund Policy."],
    },
    {
      heading: "Acceptable Use",
      body: [
        "- Do not attempt to access another user's account, course content, or certificate.",
        "- Do not attempt to circumvent access controls on paid content.",
        "- Do not misrepresent your affiliation with ZentexAI or misuse the Certificate of Completion or certificate verification system.",
        "- Do not share your account or resell access to purchased content.",
      ],
    },
    {
      heading: "Intellectual Property",
      body: [
        "Course content, lesson videos, practice questions, and the ZentexAI name and logo belong to ZentexAI or its licensors. Your enrollment grants you a personal, non-transferable right to access the content you purchased for your own learning - it does not grant you rights to copy, redistribute, or resell it.",
      ],
    },
    {
      heading: "Disclaimers",
      body: [
        "The PMP Exam Simulator and PMP Mastery Program are prepared by ZentexAI to support exam preparation; they are not published or endorsed by the Project Management Institute (PMI), and ZentexAI does not guarantee passing the actual PMP® exam or any particular business outcome from its AI or consulting services. Our services are provided based on our professional judgment and current understanding of the subject matter, without a guarantee of specific results.",
      ],
    },
    {
      heading: "Limitation of Liability",
      body: [
        "To the extent permitted by applicable law, ZentexAI's total responsibility for any claim relating to these Terms or the service is limited to the amount you paid for the specific program giving rise to the claim. Nothing in these Terms limits any right you have under applicable law that cannot be limited by agreement.",
      ],
    },
    {
      heading: "Resolving Disagreements",
      body: ["If you have a concern about these Terms or our service, contact us first at the address below - we aim to resolve any disagreement directly and in good faith."],
    },
    {
      heading: "Changes to These Terms",
      body: ["We may update these Terms from time to time. When we do, we will update the \"Last updated\" date at the top of this page. Continuing to use ZentexAI after a change means you accept the updated Terms."],
    },
    {
      heading: "Contact Us",
      body: [`For questions about these Terms, email us at ${CONTACT_EMAIL} or use the Contact page.`],
    },
  ],
};

const termsAr: LegalDoc = {
  title: "شروط الخدمة",
  updated: `آخر تحديث: ${LAST_UPDATED_AR}`,
  intro: [
    "تحكم شروط الخدمة هذه استخدامك لموقع zentexai.com وأكاديمية ZentexAI، بما يشمل نموذج التواصل، وإنشاء الحساب، والبرامج المدفوعة (محاكي اختبار PMP وبرنامج احتراف PMP)، والشهادات. تشير عبارات \"ZentexAI\" و\"نحن\" إلى الجهة/الأفراد الذين يُشغّلون ZentexAI.",
  ],
  sections: [
    {
      heading: "قبول الشروط",
      body: ["باستخدامك لموقع zentexai.com أو إنشاء حساب في أكاديمية ZentexAI، فإنك توافق على شروط الخدمة هذه وعلى سياسة الخصوصية وسياسة الاسترداد الخاصتين بنا."],
    },
    {
      heading: "وصف الخدمة",
      body: [
        "تقدّم ZentexAI: (أ) حلول واستشارات الذكاء الاصطناعي، واستشارات إدارة المشاريع، التي يتم التواصل بشأنها عبر نموذج التواصل؛ و(ب) أكاديمية ZentexAI، التي تقدّم دورة برنامج احتراف PMP ومحاكي اختبار PMP، وتشمل دروساً وأسئلة تدريبية ومحاكاة امتحانات مؤقتة وتتبعاً للتقدم وشهادة إتمام لبرنامج الاحتراف.",
        "تُقرّ شهادة الإتمام بإكمال برنامج احتراف PMP الخاص بأكاديمية ZentexAI فقط. وهي ليست شهادة PMP® أو PMI®، ولا تمثل اعتماداً صادراً عن PMI أو أهلية لخوض الامتحان — علامتا PMP® وPMI® مملوكتان لمعهد إدارة المشاريع (PMI)، وZentexAI ليست تابعة له أو معتمدة منه أو تعمل نيابة عنه.",
      ],
    },
    {
      heading: "الحسابات",
      body: [
        "يجب عليك تقديم معلومات دقيقة عند إنشاء حسابك، وأنت مسؤول عن الحفاظ على سرية بيانات تسجيل دخولك وعن أي نشاط يتم عبر حسابك. صُممت هذه الخدمة للاستخدام التجاري والمهني وهي غير موجهة للأطفال.",
      ],
    },
    {
      heading: "المشتريات والدفع",
      body: [
        "تتم عملية شراء البرامج المدفوعة عبر Ziina، معالج الدفع من الطرف الثالث لدينا. السعر المعروض عند الدفع هو المبلغ الذي سيُخصم منك. يمنحك شراء الوصول إلى محاكي اختبار PMP و/أو برنامج احتراف PMP إمكانية الوصول إلى ذلك البرنامج للمدة المذكورة وقت الشراء.",
      ],
    },
    {
      heading: "الاسترداد",
      body: ["يخضع الاسترداد لسياسة الاسترداد الخاصة بنا."],
    },
    {
      heading: "الاستخدام المقبول",
      body: [
        "- عدم محاولة الوصول إلى حساب مستخدم آخر أو محتوى دورته أو شهادته.",
        "- عدم محاولة تجاوز ضوابط الوصول إلى المحتوى المدفوع.",
        "- عدم تحريف انتسابك إلى ZentexAI أو إساءة استخدام شهادة الإتمام أو نظام التحقق من الشهادات.",
        "- عدم مشاركة حسابك أو إعادة بيع الوصول إلى المحتوى المشترى.",
      ],
    },
    {
      heading: "الملكية الفكرية",
      body: [
        "محتوى الدورات وفيديوهات الدروس والأسئلة التدريبية واسم ZentexAI وشعارها ملك لـ ZentexAI أو الجهات المرخِّصة لها. يمنحك تسجيلك حقاً شخصياً غير قابل للتحويل للوصول إلى المحتوى الذي اشتريته لأغراض تعلمك الخاص — ولا يمنحك حق نسخه أو إعادة توزيعه أو إعادة بيعه.",
      ],
    },
    {
      heading: "إخلاء المسؤولية",
      body: [
        "أُعدّ محاكي اختبار PMP وبرنامج احتراف PMP من قِبل ZentexAI لدعم التحضير للامتحان؛ ولم يُنشرا أو يُعتمدا من قِبل معهد إدارة المشاريع (PMI)، ولا تضمن ZentexAI اجتياز امتحان PMP® الفعلي أو تحقيق أي نتيجة تجارية معينة من خدماتها في الذكاء الاصطناعي أو الاستشارات. تُقدَّم خدماتنا بناءً على تقديرنا المهني وفهمنا الحالي للموضوع، دون ضمان نتائج محددة.",
      ],
    },
    {
      heading: "تحديد المسؤولية",
      body: [
        "في الحدود التي يسمح بها القانون المعمول به، تقتصر مسؤولية ZentexAI الكاملة عن أي مطالبة تتعلق بهذه الشروط أو بالخدمة على المبلغ الذي دفعته مقابل البرنامج المحدد الذي نشأت عنه المطالبة. لا شيء في هذه الشروط يحد من أي حق تملكه بموجب القانون المعمول به لا يجوز تقييده بالاتفاق.",
      ],
    },
    {
      heading: "تسوية الخلافات",
      body: ["إذا كان لديك أي تحفظ بخصوص هذه الشروط أو خدمتنا، تواصل معنا أولاً عبر العنوان أدناه — نسعى لتسوية أي خلاف بشكل مباشر وبحسن نية."],
    },
    {
      heading: "التغييرات على هذه الشروط",
      body: ["قد نحدّث هذه الشروط من وقت لآخر. عند القيام بذلك، سنحدّث تاريخ \"آخر تحديث\" أعلى هذه الصفحة. استمرارك في استخدام ZentexAI بعد أي تغيير يعني موافقتك على الشروط المحدَّثة."],
    },
    {
      heading: "تواصل معنا",
      body: [`لأي استفسار حول هذه الشروط، راسلنا على ${CONTACT_EMAIL} أو عبر صفحة التواصل.`],
    },
  ],
};

// ─── Refund Policy ──────────────────────────────────────────────────────────

const refundEn: LegalDoc = {
  title: "Refund Policy",
  updated: `Last updated: ${LAST_UPDATED}`,
  intro: [
    "This Refund Policy covers paid, digital access purchased through ZentexAI Academy: the PMP Exam Simulator and the PMP Mastery Program. It does not cover the AI/consulting services engaged through the Contact page, which are scoped and agreed individually.",
  ],
  sections: [
    {
      heading: "What You Are Purchasing",
      body: ["A purchase grants digital access to course content, practice questions, and/or the exam simulator for the period stated at checkout. No physical goods are shipped."],
    },
    {
      heading: "Refund Eligibility",
      body: [
        "- If your paid access was never successfully activated (for example, a failed or incomplete purchase where you were charged but never received access), you are eligible for a full refund.",
        "- If your access was successfully activated and you have begun using it, purchases are generally non-refundable, with two exceptions:",
        "- Duplicate charge: if you were charged more than once for the same access, the duplicate charge is refunded.",
        "- Verified technical failure: if a technical failure on our side prevents you from accessing the content you paid for, and we cannot reasonably resolve it, you are eligible for a refund.",
        "This policy describes when a refund is available; it does not limit any right you may separately have under applicable consumer-protection law.",
      ],
    },
    {
      heading: "How to Request a Refund",
      body: [`To request a refund, email us at ${CONTACT_EMAIL} with your order details and the reason for your request. We will review it against the eligibility rules above and respond directly.`],
    },
    {
      heading: "Processing",
      body: ["An approved refund is returned to the original Ziina payment method used for the purchase."],
    },
    {
      heading: "Changes to This Policy",
      body: ["We may update this Refund Policy from time to time. When we do, we will update the \"Last updated\" date at the top of this page."],
    },
    {
      heading: "Contact Us",
      body: [`For refund questions, email us at ${CONTACT_EMAIL} or use the Contact page.`],
    },
  ],
};

const refundAr: LegalDoc = {
  title: "سياسة الاسترداد",
  updated: `آخر تحديث: ${LAST_UPDATED_AR}`,
  intro: [
    "تغطي سياسة الاسترداد هذه الوصول الرقمي المدفوع المُشترى عبر أكاديمية ZentexAI: محاكي اختبار PMP وبرنامج احتراف PMP. ولا تغطي خدمات الذكاء الاصطناعي/الاستشارات التي يتم التواصل بشأنها عبر صفحة التواصل، والتي يُحدَّد نطاقها ويُتفق عليها بشكل فردي.",
  ],
  sections: [
    {
      heading: "ما الذي تشتريه",
      body: ["يمنحك الشراء وصولاً رقمياً إلى محتوى الدورة والأسئلة التدريبية و/أو محاكي الامتحان للمدة المذكورة عند الدفع. لا يتم شحن أي سلع مادية."],
    },
    {
      heading: "أهلية الاسترداد",
      body: [
        "- إذا لم يُفعَّل وصولك المدفوع مطلقاً (مثلاً عملية شراء فاشلة أو غير مكتملة خُصم فيها المبلغ منك دون أن تحصل على الوصول)، فأنت مؤهل لاسترداد كامل.",
        "- إذا فُعِّل وصولك بنجاح وبدأت باستخدامه، فإن عمليات الشراء غير قابلة للاسترداد عموماً، مع استثناءين:",
        "- الخصم المكرر: إذا خُصم منك المبلغ أكثر من مرة للوصول نفسه، يُسترد المبلغ المكرر.",
        "- عطل تقني موثّق: إذا منعك عطل تقني من جهتنا من الوصول إلى المحتوى الذي دفعت مقابله، ولم نتمكن من حله بشكل معقول، فأنت مؤهل للاسترداد.",
        "توضّح هذه السياسة متى يتوفر الاسترداد؛ ولا تحد من أي حق قد يكون لديك بشكل منفصل بموجب قانون حماية المستهلك المعمول به.",
      ],
    },
    {
      heading: "كيفية طلب الاسترداد",
      body: [`لطلب استرداد، راسلنا على ${CONTACT_EMAIL} مع تفاصيل طلبك وسبب الطلب. سنراجعه وفق قواعد الأهلية أعلاه ونرد عليك مباشرة.`],
    },
    {
      heading: "المعالجة",
      body: ["يُعاد أي استرداد مُوافَق عليه إلى وسيلة الدفع الأصلية عبر Ziina المستخدمة في الشراء."],
    },
    {
      heading: "التغييرات على هذه السياسة",
      body: ["قد نحدّث سياسة الاسترداد هذه من وقت لآخر. عند القيام بذلك، سنحدّث تاريخ \"آخر تحديث\" أعلى هذه الصفحة."],
    },
    {
      heading: "تواصل معنا",
      body: [`لأي استفسار حول الاسترداد، راسلنا على ${CONTACT_EMAIL} أو عبر صفحة التواصل.`],
    },
  ],
};

export const privacyCopy = { en: privacyEn, ar: privacyAr };
export const termsCopy = { en: termsEn, ar: termsAr };
export const refundCopy = { en: refundEn, ar: refundAr };
