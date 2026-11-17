import Link from "@/components/LocaleLink";
import JsonLd from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/structuredData";
import Accordion from "@/components/ui/Accordion";
import Section from "@/components/ui/Section";

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
 *
 * Product accuracy (audit P2-14, 2026-11-16): the two products grant
 * different capabilities (migrations/019_academy_commerce.sql):
 *   - PMP Mastery Program (course:pmp): the structured course - modules and
 *     lessons, module quizzes, progress, and a ZentexAI Certificate of
 *     Completion (certificateService.ts). Its lessons are explained in Arabic
 *     (owner-confirmed, 2026-11-17); the website and platform can be used in
 *     Arabic or English. Lessons are not called "video lessons" while lesson
 *     videos are not yet published.
 *   - PMP Exam Simulator (practice:pmp + mock_exam:pmp): Practice Mode, the
 *     180-question timed Mock Exam, the bilingual question bank, results review.
 * So the "course" block below no longer lists the question bank or timed
 * exams as Mastery Program features; it points to the Simulator for them.
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
    h2En: "PMP Course in Arabic for Working Professionals",
    h2Ar: "دورة PMP بالعربي للمحترفين",
    pEn: [
      "The ZentexAI PMP Mastery Program is a structured, self-paced PMP exam preparation course built around the current PMP Examination Content Outline. Its lessons are explained in Arabic, and the website and learning platform can be used in Arabic or English.",
    ],
    pAr: [
      "برنامج احتراف PMP من ZentexAI دورة منظمة ذاتية الوتيرة للتحضير لاختبار PMP، مبنية على مخطط محتوى اختبار PMP الحالي. الدروس مشروحة باللغة العربية، ويمكنك استخدام الموقع ومنصة التعلّم بالعربية أو الإنجليزية.",
    ],
    bulletsEn: [
      "6 modules and 61 lessons, explained in Arabic and studied at your own pace",
      "A quiz at the end of each module to check your understanding",
      "A ZentexAI Certificate of Completion when you finish the course",
      "Practice questions and timed mock exams are part of the separate PMP Exam Simulator",
    ],
    bulletsAr: [
      "6 وحدات و61 درساً مشروحة بالعربية، تدرسها بوتيرتك الخاصة",
      "اختبار في نهاية كل وحدة للتحقق من فهمك",
      "شهادة إتمام من ZentexAI عند إنهاء الدورة",
      "أسئلة التدريب والاختبارات التجريبية بوقت محدد جزء من محاكي اختبار PMP المنفصل",
    ],
    links: [
      { href: "/courses/pmp-mastery-program", en: "PMP Mastery Program details", ar: "تفاصيل برنامج احتراف PMP" },
      { href: "/courses/pmp-exam-simulator", en: "PMP Exam Simulator", ar: "محاكي اختبار PMP" },
      { href: "/contact", en: "Ask us a question", ar: "اسألنا" },
    ],
    faq: [
      { q: "Is there a PMP course in Arabic?", a: "Yes. The lessons of the ZentexAI PMP Mastery Program are explained in Arabic. The website and learning platform can be used in Arabic or English, and you can switch at any time. The separate PMP Exam Simulator offers its practice questions and mock exams in both Arabic and English." },
      { q: "Who is the PMP Mastery Program for?", a: "Working professionals preparing for the PMP exam who want a structured, self-paced course with a quiz for each module and a Certificate of Completion at the end." },
      { q: "Can I practise with a PMP exam simulator as well?", a: "Yes. The ZentexAI PMP Exam Simulator offers filterable Practice Mode and full-length timed mock exams. See the PMP Exam Simulator page for details." },
    ],
    faqAr: [
      { q: "هل توجد دورة PMP بالعربي؟", a: "نعم. دروس برنامج احتراف PMP من ZentexAI مشروحة باللغة العربية. ويمكنك استخدام الموقع ومنصة التعلّم بالعربية أو الإنجليزية والتبديل بينهما في أي وقت. أما محاكي اختبار PMP المنفصل فيقدّم أسئلة التدريب والاختبارات التجريبية بالعربية والإنجليزية." },
      { q: "لمن هذا البرنامج؟", a: "للمحترفين الذين يستعدون لاختبار PMP ويريدون دورة منظمة ذاتية الوتيرة، مع اختبار لكل وحدة وشهادة إتمام في النهاية." },
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
      { href: "/courses/pmp-mastery-program", en: "PMP Mastery Program", ar: "برنامج احتراف PMP" },
      { href: "/academy", en: "ZentexAI Academy", ar: "أكاديمية ZentexAI" },
    ],
    faq: [
      { q: "What is a PMP exam simulator?", a: "A PMP exam simulator is a practice tool that presents exam-style questions under realistic conditions — including timed, full-length mock exams — so you can build stamina and find weak areas before the real exam." },
      { q: "Can I practise PMP questions in Arabic?", a: "Yes. The ZentexAI simulator shows questions and answer options in Arabic or English, and you can switch language during practice." },
      { q: "What is the difference between Practice Mode and a Mock Exam?", a: "Practice Mode lets you choose filters such as domain, approach, and difficulty and review answers straight away. A Mock Exam is a full-length, timed 180-question exam sat in sections with scheduled breaks." },
      { q: "Is the PMP Exam Simulator free?", a: "Yes, for now. The PMP Exam Simulator is free during our launch period, and the PMP Mastery Program is free with a ZentexAI account. Any future pricing will be announced in advance." },
    ],
    faqAr: [
      { q: "ما هو محاكي اختبار PMP؟", a: "محاكي اختبار PMP أداة تدريب تعرض أسئلة بأسلوب الاختبار في ظروف واقعية — بما في ذلك اختبارات تجريبية كاملة بوقت محدد — لتبني قدرة التحمل وتكتشف نقاط الضعف قبل الاختبار الفعلي." },
      { q: "هل يمكنني التدرب على أسئلة PMP بالعربي؟", a: "نعم. يعرض محاكي ZentexAI الأسئلة وخيارات الإجابة بالعربية أو الإنجليزية، ويمكنك تبديل اللغة أثناء التدريب." },
      { q: "ما الفرق بين وضع التدريب والاختبار التجريبي؟", a: "يتيح وضع التدريب اختيار مرشحات مثل المجال والنهج والصعوبة ومراجعة الإجابات فوراً. أما الاختبار التجريبي فهو اختبار كامل بوقت محدد من 180 سؤالاً على أقسام مع فترات استراحة مجدولة." },
      { q: "هل محاكي اختبار PMP مجاني؟", a: "نعم، حالياً. محاكي اختبار PMP مجاني خلال فترة الإطلاق، وبرنامج احتراف PMP مجاني مع حساب ZentexAI. وسنعلن مسبقاً عن أي تسعير مستقبلي." },
    ],
  },
};

/**
 * Default renders both languages side by side (kept for callers that want it);
 * `englishOnly` / `arabicOnly` render a single language, with its own FAQ
 * structured data, links and disclaimer. Each language's page uses its own
 * single-language mode, since both languages now have their own URL.
 */
export default function PmpDiscoverabilitySection({ variant, arabicOnly = false, englishOnly = false }: { variant: Variant; arabicOnly?: boolean; englishOnly?: boolean }) {
  const c = CONTENT[variant];
  const showEn = !arabicOnly;
  const showAr = !englishOnly;
  const both = showEn && showAr;
  // Native <details> accordion: every answer stays in the DOM, so crawlers and
  // AI retrieval read the full text, while people get a scannable page.
  const items = (faq: { q: string; a: string }[], prefix: string) => faq.map((f, i) => ({ id: `${prefix}-${i}`, question: f.q, answer: f.a }));
  return (
    <Section id={c.id} bordered>
      {showEn && <JsonLd data={faqJsonLd(c.faq, "en")} />}
      {showAr && <JsonLd data={faqJsonLd(c.faqAr, "ar")} />}
      <div className={`grid gap-12 ${both ? "lg:grid-cols-2" : ""}`}>
        {showEn && (
          <div lang="en" dir="ltr" className="max-w-3xl">
            <h2 className="text-h2 text-ink">{c.h2En}</h2>
            {c.pEn.map((p) => (
              <p key={p} className="mt-4 text-body text-ink-2">{p}</p>
            ))}
            <ul className="mt-5 list-disc space-y-2 ps-5 text-body text-ink-2">
              {c.bulletsEn.map((b) => <li key={b}>{b}</li>)}
            </ul>
            <Accordion className="mt-8" items={items(c.faq, `${c.id}-en`)} />
          </div>
        )}

        {showAr && (
          <div lang="ar" dir="rtl" className="max-w-3xl">
            <h2 className="text-h2 text-ink">{c.h2Ar}</h2>
            {c.pAr.map((p) => (
              <p key={p} className="mt-4 text-body text-ink-2">{p}</p>
            ))}
            <ul className="mt-5 list-disc space-y-2 ps-5 text-body text-ink-2">
              {c.bulletsAr.map((b) => <li key={b}>{b}</li>)}
            </ul>
            <Accordion className="mt-8" items={items(c.faqAr, `${c.id}-ar`)} />
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-center">
          {c.links.map((l) => (
            <Link key={l.href} href={l.href} className="btn-ghost">
              {englishOnly ? l.en : arabicOnly ? <span lang="ar">{l.ar}</span> : <>{l.en} · <span lang="ar">{l.ar}</span></>}
            </Link>
          ))}
        </div>
        <p className="mt-6 text-center text-caption text-ink-3">
          {showEn && "PMP is a registered mark of Project Management Institute, Inc. ZentexAI is an independent training provider."}
          {both && " · "}
          {showAr && <span lang="ar">PMP علامة مسجلة لمعهد إدارة المشاريع (PMI). ZentexAI جهة تدريب مستقلة.</span>}
        </p>
      </div>
    </Section>
  );
}
