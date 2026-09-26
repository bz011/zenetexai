/**
 * Homepage v2 copy (EN + AR). Every claim here restates something the site
 * already publishes on a service page, the About page or the AI Agents page
 * (region, languages, human oversight + audit logging, defined scope, the
 * controls listed in the AI Agents security section, the service page
 * descriptions). Nothing is a customer, metric, result or credential claim.
 * Founder, featured-program and article copy is reused from translations.ts.
 */

export interface HomeService {
  href: string;
  name: string;
  line: string;
  /** The mechanism of this service, in the same flow -> gate -> decision language as the hero. */
  flow: string;
}

export interface HomeCopy {
  hero: {
    eyebrow: string;
    title: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    facts: { k: string; v: string }[];
  };
  what: { eyebrow: string; title: string; items: { term: string; body: string }[] };
  services: {
    eyebrow: string;
    title: string;
    sub: string;
    build: HomeService[];
    advisoryTitle: string;
    advisory: { name: string; line: string }[];
    allServices: string;
  };
  principles: { eyebrow: string; title: string; items: { title: string; body: string }[] };
}

export const homeCopy: { en: HomeCopy; ar: HomeCopy } = {
  en: {
    hero: {
      eyebrow: "AI solutions · Consulting · Professional learning",
      title: "AI systems that do real work — inside boundaries you set.",
      sub: "ZentexAI builds AI agents, automation and machine-learning solutions for businesses in the UAE and MENA, backed by project management consulting and professional learning — including our PMP Mastery Program.",
      ctaPrimary: "Talk to our team",
      ctaSecondary: "Explore services",
      facts: [
        { k: "Serves", v: "The UAE and the wider MENA region" },
        { k: "Languages", v: "Arabic and English" },
        { k: "Every agent", v: "Human oversight and an audit trail" },
      ],
    },
    what: {
      eyebrow: "What we do",
      title: "AI applied to real processes, with the controls a business needs.",
      items: [
        {
          term: "What ZentexAI does",
          body: "ZentexAI is an AI solutions, consulting and professional-learning company. We build AI agents and workflow automation, machine-learning and analytics solutions, and provide project management consulting and PMP exam training.",
        },
        {
          term: "Who it is for",
          body: "Organizations in the UAE and wider MENA region that want AI applied to real work — customer enquiries, bookings, documents, reporting and forecasting — and professionals preparing for the PMP exam.",
        },
        {
          term: "How we implement",
          body: "Every engagement starts with a defined scope, timeline and deliverable. Agents use only approved knowledge and systems, work within set permissions, hand anything else to your team, and log every decision.",
        },
      ],
    },
    services: {
      eyebrow: "Services",
      title: "What we build and advise on",
      sub: "Five build areas, each with its own page, supported by advisory work in AI adoption and project delivery.",
      build: [
        {
          href: "/services/ai-agents-automation-uae",
          name: "AI agents & automation",
          line: "Agents that connect your approved knowledge, workflows and systems, with human oversight.",
          flow: "Request → Understand → Decide → Act → Verify",
        },
        {
          href: "/services/whatsapp-automation-uae",
          name: "WhatsApp automation",
          line: "Customer conversations connected to lead qualification, booking and CRM workflows.",
          flow: "Conversation → Qualify → Book → Hand off",
        },
        {
          href: "/services/machine-learning-uae",
          name: "Machine learning",
          line: "Forecasting, classification and anomaly detection, checked against a baseline before launch.",
          flow: "Data → Baseline → Candidate → Evaluation → Decision",
        },
        {
          href: "/services/data-analytics-uae",
          name: "Data analytics",
          line: "KPI frameworks, clean data models and reporting built around your real decisions.",
          flow: "Sources → Validation → Analysis → Insight → Decision",
        },
        {
          href: "/services/power-bi-consulting-uae",
          name: "Power BI consulting",
          line: "Management dashboards, data models and scheduled refresh.",
          flow: "Sources → Model → Measures → Report → Refresh",
        },
      ],
      advisoryTitle: "Advisory",
      advisory: [
        { name: "AI consulting", line: "Readiness assessment, strategy, adoption and governance." },
        { name: "Project management consulting", line: "PMO setup, agile and hybrid delivery, project recovery and risk management." },
      ],
      allServices: "All services",
    },
    principles: {
      eyebrow: "How we work",
      title: "Working principles",
      items: [
        { title: "Scope before software", body: "Every engagement starts with a defined scope, timeline and deliverable — no vague retainers." },
        { title: "Delivery discipline", body: "Our approach to AI adoption is grounded in real project management practice, not technical enthusiasm alone." },
        { title: "Controls by design", body: "Approved knowledge only, least-privilege access, validation before action, human approval where it matters, and full logging." },
        { title: "Arabic and English, natively", body: "We work in both languages. Our solutions are built for the MENA market, not translated for it." },
      ],
    },
  },
  ar: {
    hero: {
      eyebrow: "حلول الذكاء الاصطناعي · الاستشارات · التعلّم المهني",
      title: "أنظمة ذكاء اصطناعي تنجز عملاً حقيقياً — ضمن حدود تضعها أنت.",
      sub: "تبني ZentexAI وكلاء ذكاء اصطناعي وأتمتة وحلول تعلّم آلة للشركات في الإمارات والشرق الأوسط، مدعومة باستشارات إدارة المشاريع والتعلّم المهني — ومنها برنامج PMP Mastery Program.",
      ctaPrimary: "تحدث إلى فريقنا",
      ctaSecondary: "استكشف الخدمات",
      facts: [
        { k: "نخدم", v: "دولة الإمارات ومنطقة الشرق الأوسط وشمال أفريقيا" },
        { k: "اللغات", v: "العربية والإنجليزية" },
        { k: "كل وكيل", v: "إشراف بشري وسجل تدقيق" },
      ],
    },
    what: {
      eyebrow: "ما نقدمه",
      title: "ذكاء اصطناعي مطبّق على عمليات حقيقية، بالضوابط التي تحتاجها الأعمال.",
      items: [
        {
          term: "ما الذي تقدمه ZentexAI",
          body: "ZentexAI شركة حلول ذكاء اصطناعي واستشارات وتعلّم مهني. نبني وكلاء ذكاء اصطناعي وأتمتة لسير العمل وحلول تعلّم آلة وتحليلات، ونقدم استشارات إدارة المشاريع والتدريب على اختبار PMP.",
        },
        {
          term: "لمن هي",
          body: "المؤسسات في الإمارات ومنطقة الشرق الأوسط التي تريد تطبيق الذكاء الاصطناعي على أعمال حقيقية — استفسارات العملاء والحجوزات والمستندات وإعداد التقارير والتنبؤ — والمهنيين الذين يستعدون لاختبار PMP.",
        },
        {
          term: "كيف ننفّذ",
          body: "يبدأ كل مشروع بنطاق وجدول زمني ومخرجات محددة. يستخدم الوكلاء المعرفة والأنظمة المعتمدة فقط، ويعملون ضمن صلاحيات محددة، ويحيلون ما عداها إلى فريقك، ويسجّلون كل قرار.",
        },
      ],
    },
    services: {
      eyebrow: "الخدمات",
      title: "ما نبنيه وما نستشير فيه",
      sub: "خمسة مجالات للبناء، لكل منها صفحته، تدعمها استشارات في تبنّي الذكاء الاصطناعي وتنفيذ المشاريع.",
      build: [
        {
          href: "/services/ai-agents-automation-uae",
          name: "وكلاء الذكاء الاصطناعي والأتمتة",
          line: "وكلاء يربطون معرفتك المعتمدة وسير عملك وأنظمتك، مع إشراف بشري.",
          flow: "الطلب ← الفهم ← القرار ← التنفيذ ← التحقق",
        },
        {
          href: "/services/whatsapp-automation-uae",
          name: "أتمتة واتساب",
          line: "ربط محادثات العملاء بتأهيل العملاء المحتملين والحجوزات وسير عمل إدارة العملاء.",
          flow: "المحادثة ← التأهيل ← الحجز ← التسليم البشري",
        },
        {
          href: "/services/machine-learning-uae",
          name: "تعلّم الآلة",
          line: "تنبؤ وتصنيف واكتشاف للحالات الشاذة، مع فحصها مقابل خط أساس قبل الإطلاق.",
          flow: "البيانات ← خط الأساس ← النموذج المرشح ← التقييم ← القرار",
        },
        {
          href: "/services/data-analytics-uae",
          name: "تحليل البيانات",
          line: "أُطر مؤشرات الأداء ونماذج بيانات نظيفة وتقارير مبنية حول قراراتك الفعلية.",
          flow: "المصادر ← التحقق ← التحليل ← الاستنتاج ← القرار",
        },
        {
          href: "/services/power-bi-consulting-uae",
          name: "استشارات Power BI",
          line: "لوحات معلومات إدارية ونماذج بيانات وتحديث مجدول.",
          flow: "المصادر ← النموذج ← المقاييس ← التقرير ← التحديث",
        },
      ],
      advisoryTitle: "الاستشارات",
      advisory: [
        { name: "استشارات الذكاء الاصطناعي", line: "تقييم الجاهزية والاستراتيجية والتبنّي والحوكمة." },
        { name: "استشارات إدارة المشاريع", line: "إنشاء مكتب إدارة المشاريع، والتسليم الرشيق والهجين، وإنقاذ المشاريع المتعثرة، وإدارة المخاطر." },
      ],
      allServices: "جميع الخدمات",
    },
    principles: {
      eyebrow: "كيف نعمل",
      title: "مبادئ العمل",
      items: [
        { title: "النطاق قبل البرمجيات", body: "يبدأ كل مشروع بنطاق وجدول زمني ومخرجات محددة — بلا عقود مفتوحة غامضة." },
        { title: "انضباط التسليم", body: "يستند نهجنا في تبنّي الذكاء الاصطناعي إلى ممارسة حقيقية في إدارة المشاريع، لا إلى الحماس التقني وحده." },
        { title: "ضوابط بالتصميم", body: "معرفة معتمدة فقط، وصلاحيات بأقل قدر لازم، وتحقق قبل التنفيذ، وموافقة بشرية حيث يلزم، وتسجيل كامل." },
        { title: "العربية والإنجليزية بالأصل", body: "نعمل باللغتين. حلولنا مبنية لسوق المنطقة، لا مترجمة إليه." },
      ],
    },
  },
};
