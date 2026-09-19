import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/structuredData";

/**
 * Server-rendered, bilingual (English + Arabic) informational block for the
 * PMP program and simulator. The site's language toggle is client-side only
 * (one URL per page, server HTML is English), so Arabic terminology that
 * Arabic-speaking searchers use ("دورة PMP بالعربي", "محاكي PMP") would
 * otherwise never appear in crawlable HTML. Both languages are always
 * visible here; nothing is hidden. Content is limited to facts already
 * stated elsewhere on the site or verifiable in the app (bilingual
 * interface/questions, Practice Mode filters, 180-question timed Mock
 * Exam) - no prices, access rules, pass-rate or outcome claims.
 */

type Variant = "course" | "simulator";

interface Block {
  id: string;
  h2En: string;
  h2Ar: string;
  pEn: string[];
  pAr: string[];
  bulletsEn: string[];
  bulletsAr: string[];
  links: { href: string; en: string; ar: string }[];
  faq: { q: string; a: string }[];
  faqAr: { q: string; a: string }[];
}

const CONTENT: Record<Variant, Block> = {
  course: {
    id: "pmp-course-arabic",
    h2En: "PMP Course in Arabic and English for Professionals in the UAE and MENA",
    h2Ar: "دورة PMP بالعربي والإنجليزي للمحترفين في الإمارات والشرق الأوسط",
    pEn: [
      "The ZentexAI PMP Mastery Program is a structured, self-paced PMP exam preparation course built around the current PMP Examination Content Outline. It is designed for working professionals in the Gulf and wider MENA region, with a bilingual, Arabic-friendly learning platform.",
    ],
    pAr: [
      "برنامج ZentexAI PMP Mastery هو دورة منظمة ذاتية الوتيرة للتحضير لاختبار PMP، مبنية على مخطط محتوى اختبار PMP الحالي. صُمم للمحترفين العاملين في الخليج ومنطقة الشرق الأوسط وشمال أفريقيا، وبمنصة تعلّم ثنائية اللغة تدعم العربية.",
    ],
    bulletsEn: [
      "Structured modules over an 8-week programme, learnable at your own pace",
      "A full practice question bank with timed exam simulations",
      "Practice questions and the learning platform available in Arabic and English",
    ],
    bulletsAr: [
      "وحدات منظمة ضمن برنامج مدته 8 أسابيع، يمكن دراستها بوتيرتك الخاصة",
      "بنك أسئلة تدريبي متكامل مع محاكاة اختبار بوقت محدد",
      "أسئلة التدريب ومنصة التعلّم متاحة بالعربية والإنجليزية",
    ],
    links: [
      { href: "/courses/pmp-mastery-program", en: "PMP Mastery Program details", ar: "تفاصيل برنامج PMP Mastery" },
      { href: "/courses/pmp-exam-simulator", en: "PMP Exam Simulator", ar: "محاكي اختبار PMP" },
      { href: "/contact", en: "Ask us a question", ar: "اسألنا" },
    ],
    faq: [
      { q: "Is there a PMP course in Arabic?", a: "The ZentexAI PMP Mastery Program is bilingual and Arabic-friendly: the learning platform and the practice questions are available in Arabic and English, and you can switch language at any time. See the program page for the current details of what is included." },
      { q: "Who is the PMP Mastery Program for?", a: "Working professionals in the UAE, the Gulf, and the wider MENA region who are preparing for the PMP exam and want a structured programme with a practice engine behind it." },
      { q: "Can I practise with a PMP exam simulator as well?", a: "Yes. The ZentexAI PMP Exam Simulator offers filterable Practice Mode and full-length timed mock exams. See the PMP Exam Simulator page for details." },
    ],
    faqAr: [
      { q: "هل توجد دورة PMP بالعربي؟", a: "برنامج ZentexAI PMP Mastery ثنائي اللغة ويدعم العربية: منصة التعلّم وأسئلة التدريب متاحة بالعربية والإنجليزية، ويمكنك تبديل اللغة في أي وقت. راجع صفحة البرنامج للاطلاع على تفاصيل ما يتضمنه حالياً." },
      { q: "لمن هذا البرنامج؟", a: "للمحترفين العاملين في الإمارات والخليج ومنطقة الشرق الأوسط وشمال أفريقيا الذين يستعدون لاختبار PMP ويريدون برنامجاً منظماً يدعمه محرك تدريب." },
      { q: "هل يمكنني التدريب باستخدام محاكي اختبار PMP أيضاً؟", a: "نعم. يوفر محاكي ZentexAI لاختبار PMP وضع تدريب قابلاً للتصفية واختبارات تجريبية كاملة بوقت محدد. راجع صفحة المحاكي للتفاصيل." },
    ],
  },
  simulator: {
    id: "pmp-simulator-arabic",
    h2En: "PMP Exam Simulator: Practice Mode and Full-Length Mock Exams in Arabic and English",
    h2Ar: "محاكي اختبار PMP بالعربي والإنجليزي: وضع التدريب واختبارات تجريبية كاملة",
    pEn: [
      "The ZentexAI PMP Exam Simulator lets you practise exam-style PMP questions and sit full-length timed mock exams, with scoring and review after each attempt. The questions and interface are available in Arabic and English, so you can prepare in the language you think in.",
    ],
    pAr: [
      "يتيح لك محاكي ZentexAI لاختبار PMP التدرب على أسئلة بأسلوب الاختبار وخوض اختبارات تجريبية كاملة بوقت محدد، مع تقييم ومراجعة بعد كل محاولة. الأسئلة والواجهة متاحة بالعربية والإنجليزية، لتستعد باللغة التي تفكر بها.",
    ],
    bulletsEn: [
      "Practice Mode: filter questions by domain, approach, or difficulty, timed or untimed, with instant scoring and review",
      "Mock Exam: a full-length 180-question timed exam in three sections with scheduled breaks",
      "Varied question formats, including exhibit-based and interactive questions",
      "Results review with a performance breakdown after each attempt",
    ],
    bulletsAr: [
      "وضع التدريب: صفِّ الأسئلة حسب المجال أو النهج أو الصعوبة، بوقت محدد أو دونه، مع تصحيح فوري ومراجعة",
      "الاختبار التجريبي: اختبار كامل من 180 سؤالاً بوقت محدد على ثلاثة أقسام مع فترات استراحة مجدولة",
      "صيغ أسئلة متنوعة، تشمل أسئلة قائمة على الصور والأسئلة التفاعلية",
      "مراجعة النتائج مع تفصيل الأداء بعد كل محاولة",
    ],
    links: [
      { href: "/courses/pmp-exam-simulator", en: "PMP Exam Simulator details", ar: "تفاصيل محاكي PMP" },
      { href: "/courses/pmp-mastery-program", en: "PMP Mastery Program", ar: "برنامج PMP Mastery" },
      { href: "/academy", en: "ZentexAI Academy", ar: "أكاديمية ZentexAI" },
    ],
    faq: [
      { q: "What is a PMP exam simulator?", a: "A PMP exam simulator is a practice tool that presents exam-style questions under realistic conditions — including timed, full-length mock exams — so you can build stamina and find weak areas before the real exam." },
      { q: "Can I practise PMP questions in Arabic?", a: "Yes. The ZentexAI simulator shows questions and answer options in Arabic or English, and you can switch language during practice." },
      { q: "What is the difference between Practice Mode and a Mock Exam?", a: "Practice Mode lets you choose filters such as domain, approach, and difficulty and review answers straight away. A Mock Exam is a full-length, timed 180-question exam sat in sections with scheduled breaks." },
      { q: "Where can I see pricing and access details?", a: "The PMP Exam Simulator page shows the current price and what access includes." },
    ],
    faqAr: [
      { q: "ما هو محاكي اختبار PMP؟", a: "محاكي اختبار PMP أداة تدريب تعرض أسئلة بأسلوب الاختبار في ظروف واقعية — بما في ذلك اختبارات تجريبية كاملة بوقت محدد — لتبني قدرة التحمل وتكتشف نقاط الضعف قبل الاختبار الفعلي." },
      { q: "هل يمكنني التدرب على أسئلة PMP بالعربي؟", a: "نعم. يعرض محاكي ZentexAI الأسئلة وخيارات الإجابة بالعربية أو الإنجليزية، ويمكنك تبديل اللغة أثناء التدريب." },
      { q: "ما الفرق بين وضع التدريب والاختبار التجريبي؟", a: "يتيح وضع التدريب اختيار مرشحات مثل المجال والنهج والصعوبة ومراجعة الإجابات فوراً. أما الاختبار التجريبي فهو اختبار كامل بوقت محدد من 180 سؤالاً على أقسام مع فترات استراحة مجدولة." },
      { q: "أين أجد الأسعار وتفاصيل الوصول؟", a: "تعرض صفحة محاكي اختبار PMP السعر الحالي وما يتضمنه الوصول." },
    ],
  },
};

export default function PmpDiscoverabilitySection({ variant }: { variant: Variant }) {
  const c = CONTENT[variant];
  return (
    <section id={c.id} className="border-t border-white/[0.06] px-6 py-20">
      <JsonLd data={faqJsonLd(c.faq, "en")} />
      <JsonLd data={faqJsonLd(c.faqAr, "ar")} />
      <div className="container-page grid gap-10 lg:grid-cols-2">
        <div lang="en" dir="ltr">
          <h2 className="text-2xl font-bold text-white md:text-3xl">{c.h2En}</h2>
          {c.pEn.map((p) => (
            <p key={p} className="mt-4 text-[15px] leading-relaxed text-slate-400">{p}</p>
          ))}
          <ul className="mt-5 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-slate-400">
            {c.bulletsEn.map((b) => <li key={b}>{b}</li>)}
          </ul>
          <div className="mt-8 space-y-5">
            {c.faq.map((f) => (
              <div key={f.q}>
                <h3 className="text-[15px] font-semibold text-white">{f.q}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-slate-400">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div lang="ar" dir="rtl">
          <h2 className="text-2xl font-bold text-white md:text-3xl">{c.h2Ar}</h2>
          {c.pAr.map((p) => (
            <p key={p} className="mt-4 text-[15px] leading-relaxed text-slate-400">{p}</p>
          ))}
          <ul className="mt-5 list-disc space-y-2 pr-5 text-[14px] leading-relaxed text-slate-400">
            {c.bulletsAr.map((b) => <li key={b}>{b}</li>)}
          </ul>
          <div className="mt-8 space-y-5">
            {c.faqAr.map((f) => (
              <div key={f.q}>
                <h3 className="text-[15px] font-semibold text-white">{f.q}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-slate-400">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page mt-10">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          {c.links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[13px] font-medium text-indigo-400 transition-colors hover:text-indigo-300">
              {l.en} · <span lang="ar">{l.ar}</span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-center text-[11px] text-slate-600">
          PMP is a registered mark of Project Management Institute, Inc. ZentexAI is an independent training provider. · PMP علامة مسجلة لمعهد إدارة المشاريع (PMI). ZentexAI جهة تدريب مستقلة.
        </p>
      </div>
    </section>
  );
}
