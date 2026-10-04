import type { Metadata } from "next";
import type { SiteLang } from "./i18nRoutes";
import { mirroredPageMetadata } from "./seo";
import { simulatorMetadataText } from "./simulatorPageCopy";

/** Arabic <title>/<meta description> for each page that has an Arabic URL. Keyed by the page's ENGLISH path. */
export const ARABIC_SEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: "ZentexAI — حلول الذكاء الاصطناعي والأتمتة",
    description:
      "وكلاء ذكاء اصطناعي وتحليل بيانات وتعلّم آلة لعمليات الأعمال الحقيقية، إضافة إلى استشارات إدارة المشاريع والتدريب على اختبار PMP بمحاكي عملي.",
  },
  "/academy": {
    title: "دورة PMP بالعربي ومحاكي اختبار PMP | أكاديمية ZentexAI",
    description:
      "أكاديمية ZentexAI: برنامج PMP Mastery بدعم العربية ومحاكي اختبار PMP للمحترفين.",
  },
  "/courses": {
    title: "محاكي اختبار PMP ودورات PMP بالعربي | ZentexAI",
    description:
      "محاكي اختبار PMP وبرنامج PMP Mastery من أكاديمية ZentexAI: أسئلة تدريب بالعربية والإنجليزية، ووضع تدريب قابل للتصفية، واختبارات تجريبية بوقت محدد.",
  },
  "/courses/pmp-exam-simulator": simulatorMetadataText("ar"),
  "/services": {
    title: "وكلاء الذكاء الاصطناعي، تحليل البيانات، تعلّم الآلة | ZentexAI",
    description:
      "وكلاء ذكاء اصطناعي وأتمتة، وتحليل بيانات، وتعلّم آلة، إضافة إلى استشارات الذكاء الاصطناعي وإدارة المشاريع — مبنية لعمليات الأعمال الحقيقية.",
  },
  "/services/ai-agents-automation-uae": {
    title: "وكلاء الذكاء الاصطناعي وأتمتة الأعمال | ZentexAI",
    description:
      "تطوير وكلاء الذكاء الاصطناعي وأتمتة الأعمال: وكلاء آمنون يربطون المعرفة وسير العمل وأنظمة الأعمال مع إشراف بشري مضبوط.",
  },
  "/services/whatsapp-automation-uae": {
    title: "أتمتة واتساب ووكلاء الذكاء الاصطناعي | ZentexAI",
    description:
      "أتمتة واتساب بالذكاء الاصطناعي: ربط محادثات العملاء بتأهيل العملاء المحتملين والحجوزات وسير عمل إدارة العملاء مع تسليم بشري مضبوط.",
  },
  "/services/machine-learning-uae": {
    title: "خدمات تعلّم الآلة والتحليلات التنبؤية | ZentexAI",
    description:
      "تعلّم آلة وتحليلات تنبؤية عملية: التنبؤ بالطلب والتصنيف واكتشاف الحالات الشاذة، مع تقييم مقابل خط أساس واضح قبل أي إطلاق.",
  },
  "/services/data-analytics-uae": {
    title: "خدمات تحليل البيانات | ZentexAI",
    description:
      "تحليل البيانات وذكاء الأعمال: أُطر مؤشرات الأداء وتدقيق البيانات ونماذج نظيفة ولوحات معلومات وأتمتة التقارير.",
  },
  "/services/power-bi-consulting-uae": {
    title: "استشارات Power BI | ZentexAI",
    description:
      "استشارات Power BI: لوحات معلومات إدارية ونماذج بيانات وتحديث مجدول وتصميم للوصول ومراجعة للتقارير وتدريب للفريق.",
  },
};

/** Metadata for the Arabic version of an English path: Arabic title/description, self-referencing /ar canonical, reciprocal hreflang. */
export function arabicMetadata(enPath: string): Metadata {
  const seo = ARABIC_SEO[enPath];
  if (!seo) throw new Error(`No Arabic SEO metadata defined for ${enPath}`);
  return mirroredPageMetadata(enPath, "ar", seo.title, seo.description);
}

export type { SiteLang };
