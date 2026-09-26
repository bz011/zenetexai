import type { Metadata } from "next";
import type { SiteLang } from "./i18nRoutes";
import { mirroredPageMetadata } from "./seo";
import { simulatorMetadataText } from "./simulatorPageCopy";

/** Arabic <title>/<meta description> for each page that has an Arabic URL. Keyed by the page's ENGLISH path. */
export const ARABIC_SEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: "ZentexAI — حلول الذكاء الاصطناعي والأتمتة في الإمارات",
    description:
      "وكلاء الذكاء الاصطناعي والأتمتة للشركات في الإمارات والشرق الأوسط، إضافة إلى استشارات إدارة المشاريع والتدريب على اختبار PMP بمحاكي عملي.",
  },
  "/academy": {
    title: "دورة PMP بالعربي ومحاكي اختبار PMP | أكاديمية ZentexAI",
    description:
      "أكاديمية ZentexAI: برنامج PMP Mastery بدعم العربية ومحاكي اختبار PMP للمحترفين في الإمارات والشرق الأوسط.",
  },
  "/courses": {
    title: "محاكي اختبار PMP ودورات PMP بالعربي | ZentexAI",
    description:
      "محاكي اختبار PMP وبرنامج PMP Mastery من أكاديمية ZentexAI: أسئلة تدريب بالعربية والإنجليزية، ووضع تدريب قابل للتصفية، واختبارات تجريبية بوقت محدد.",
  },
  "/courses/pmp-exam-simulator": simulatorMetadataText("ar"),
  "/services": {
    title: "حلول الذكاء الاصطناعي والأتمتة والاستشارات | ZentexAI",
    description:
      "وكلاء ذكاء اصطناعي وأتمتة واستشارات للشركات في الإمارات والشرق الأوسط، إضافة إلى استشارات عملية في إدارة المشاريع.",
  },
  "/services/ai-agents-automation-uae": {
    title: "وكلاء الذكاء الاصطناعي وأتمتة الأعمال في الإمارات | ZentexAI",
    description:
      "تطوير وكلاء الذكاء الاصطناعي وأتمتة الأعمال للشركات في الإمارات: وكلاء آمنون يربطون المعرفة وسير العمل وأنظمة الأعمال مع إشراف بشري مضبوط.",
  },
  "/services/whatsapp-automation-uae": {
    title: "أتمتة واتساب ووكلاء الذكاء الاصطناعي في الإمارات | ZentexAI",
    description:
      "أتمتة واتساب بالذكاء الاصطناعي للشركات في الإمارات: ربط محادثات العملاء بتأهيل العملاء المحتملين والحجوزات وسير عمل إدارة العملاء مع تسليم بشري مضبوط.",
  },
  "/services/machine-learning-uae": {
    title: "خدمات تعلّم الآلة والتحليلات التنبؤية في الإمارات | ZentexAI",
    description:
      "تعلّم آلة وتحليلات تنبؤية عملية للشركات في الإمارات: التنبؤ بالطلب والتصنيف واكتشاف الحالات الشاذة، مع تقييم مقابل خط أساس واضح قبل أي إطلاق.",
  },
  "/services/data-analytics-uae": {
    title: "خدمات تحليل البيانات في الإمارات | ZentexAI",
    description:
      "تحليل البيانات وذكاء الأعمال للشركات في الإمارات: أُطر مؤشرات الأداء وتدقيق البيانات ونماذج نظيفة ولوحات معلومات وأتمتة التقارير.",
  },
  "/services/power-bi-consulting-uae": {
    title: "استشارات Power BI في الإمارات | ZentexAI",
    description:
      "استشارات Power BI للشركات في الإمارات: لوحات معلومات إدارية ونماذج بيانات وتحديث مجدول وتصميم للوصول ومراجعة للتقارير وتدريب للفريق.",
  },
};

/** Metadata for the Arabic version of an English path: Arabic title/description, self-referencing /ar canonical, reciprocal hreflang. */
export function arabicMetadata(enPath: string): Metadata {
  const seo = ARABIC_SEO[enPath];
  if (!seo) throw new Error(`No Arabic SEO metadata defined for ${enPath}`);
  return mirroredPageMetadata(enPath, "ar", seo.title, seo.description);
}

export type { SiteLang };
