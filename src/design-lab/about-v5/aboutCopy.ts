import type { CtaCopy } from "@/design-lab/home-v5/ctaCopy";

/**
 * About page (v5) copy. Every statement restates what the live site already
 * says (src/lib/translations.ts `about`, the services and Academy copy): no
 * company history, clients, team size, deployments or achievements are added.
 * Founder facts are the live site's own: name, Founder & CEO, BSc in
 * Electrical Engineering, PMP® certified, MSc in Artificial Intelligence; the
 * bio is a shortened form of the published one. The hero portrait is the
 * owner's approved transparent photograph (public/images/about), used as
 * supplied; `portraitAlt` describes it.
 */
export type AboutCopy = {
  eyebrow: string;
  title: { lead: string; highlight: string };
  sub: string;
  who: { eyebrow: string; title: string; lead: string; body: string; focus: { title: string; text: string }[] };
  think: { eyebrow: string; title: string; principles: { title: string; text: string }[] };
  founder: { eyebrow: string; name: string; role: string; portraitAlt: string; credentials: string[]; bio: string };
  cta: CtaCopy;
};

const en: AboutCopy = {
  eyebrow: "About ZentexAI",
  title: { lead: "Technology with purpose.", highlight: "Built for real work." },
  sub: "ZentexAI is an AI and technology company. We design practical AI and automation solutions for real business operations, and through ZentexAI Academy we help professionals build the project management skills they need.",
  who: {
    eyebrow: "Who we are",
    title: "Practical AI, and the skills to deliver it.",
    lead: "We help organizations apply AI where it genuinely improves the work, and help professionals grow the skills to deliver it.",
    body: "Good AI adoption and good project management share the same foundation: clear thinking, realistic scope, and follow-through. That is what we build for organizations, and what we teach through our programs.",
    focus: [
      { title: "Practical AI solutions", text: "AI agents and assistants that work from approved knowledge, within clear boundaries." },
      { title: "Business process automation", text: "Workflows that take repetitive work off your team, with people kept in the loop where it matters." },
      { title: "Data-informed decisions", text: "Clean data, clear KPIs and dashboards built around the decisions you actually make." },
      { title: "Professional education", text: "ZentexAI Academy: the PMP Mastery Program and the PMP Exam Simulator." },
    ],
  },
  think: {
    eyebrow: "How we think",
    title: "Three principles behind the work.",
    principles: [
      { title: "Start with the problem", text: "Understand the workflow before choosing technology." },
      { title: "Build responsibly", text: "Prioritize reliability, privacy, and human oversight." },
      { title: "Keep it practical", text: "Focus on solutions people can actually use and maintain." },
    ],
  },
  founder: {
    eyebrow: "Founder",
    name: "Zaid Al-Badareen",
    role: "Founder & CEO, ZentexAI",
    portraitAlt: "Portrait of Zaid Al-Badareen, Founder and CEO of ZentexAI",
    credentials: ["BSc in Electrical Engineering", "PMP® certified project management professional", "MSc in Artificial Intelligence"],
    bio: "Zaid combines engineering, project management and AI expertise to help organizations implement practical AI systems, while supporting professionals as they develop the project management skills today's workplace demands.",
  },
  cta: {
    lead: "Have a business challenge to discuss?",
    text: "Tell us about your organization or your goals, and we'll get back to you personally.",
    button: "Contact Us",
  },
};

const ar: AboutCopy = {
  eyebrow: "عن ZentexAI",
  title: { lead: "تقنية بغاية واضحة.", highlight: "مبنية للعمل الحقيقي." },
  sub: "ZentexAI شركة ذكاء اصطناعي وتقنية. نصمّم حلول ذكاء اصطناعي وأتمتة عملية تخدم عمليات الشركات الفعلية، ومن خلال أكاديمية ZentexAI نساعد المهنيين على بناء مهارات إدارة المشاريع التي يحتاجونها.",
  who: {
    eyebrow: "من نحن",
    title: "ذكاء اصطناعي عملي، ومهارات لتنفيذه.",
    lead: "نساعد المؤسسات على توظيف الذكاء الاصطناعي حيث يحسّن العمل فعلاً، ونساعد المهنيين على تطوير المهارات اللازمة لتنفيذه.",
    body: "يقوم التبنّي الناجح للذكاء الاصطناعي والإدارة الجيدة للمشاريع على الأساس نفسه: تفكير واضح، ونطاق واقعي، ومتابعة حتى النهاية. هذا ما نبنيه للمؤسسات، وما نعلّمه في برامجنا.",
    focus: [
      { title: "حلول ذكاء اصطناعي عملية", text: "وكلاء ومساعدون أذكياء يعملون وفق معرفة معتمدة وضمن حدود واضحة." },
      { title: "أتمتة العمليات", text: "سير عمل يخفّف عن فريقك المهام المتكررة، مع بقاء الإنسان في موقع القرار حيث يلزم." },
      { title: "قرارات مبنية على البيانات", text: "بيانات منظّمة ومؤشرات أداء واضحة ولوحات معلومات مصمّمة حول قراراتك الفعلية." },
      { title: "التعليم المهني", text: "أكاديمية ZentexAI: برنامج PMP Mastery Program ومحاكي اختبار PMP." },
    ],
  },
  think: {
    eyebrow: "طريقة تفكيرنا",
    title: "ثلاثة مبادئ توجّه عملنا.",
    principles: [
      { title: "نبدأ من المشكلة", text: "نفهم سير العمل قبل أن نختار التقنية." },
      { title: "نبني بمسؤولية", text: "نعطي الأولوية للموثوقية والخصوصية والإشراف البشري." },
      { title: "نُبقي الحلول عملية", text: "نركّز على حلول يستطيع الناس استخدامها وصيانتها فعلاً." },
    ],
  },
  founder: {
    eyebrow: "المؤسس",
    name: "زيد البدارين",
    role: "المؤسس والرئيس التنفيذي، ZentexAI",
    portraitAlt: "صورة زيد البدارين، مؤسس ZentexAI ورئيسها التنفيذي",
    credentials: ["بكالوريوس في الهندسة الكهربائية", "محترف معتمد في إدارة المشاريع \u2066PMP®\u2069", "ماجستير في الذكاء الاصطناعي"],
    bio: "يجمع زيد بين خبرته الهندسية وخبرته في إدارة المشاريع وتخصّصه في الذكاء الاصطناعي لمساعدة المؤسسات على تطبيق أنظمة ذكاء اصطناعي عملية، ودعم المهنيين في تطوير مهارات إدارة المشاريع التي تتطلبها بيئة العمل اليوم.",
  },
  cta: {
    lead: "هل لديك تحدٍّ في أعمالك تودّ مناقشته؟",
    text: "أخبرنا عن مؤسستك أو أهدافك، وسنعاود التواصل معك شخصياً.",
    button: "تواصل معنا",
  },
};

export const aboutCopy = { en, ar };
