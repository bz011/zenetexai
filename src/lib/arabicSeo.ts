import type { Metadata } from "next";
import { alternatesFor, toArabicPath, type SiteLang } from "./i18nRoutes";
import { simulatorMetadataText } from "./simulatorPageCopy";

/** Arabic <title>/<meta description> for each page that has an Arabic URL. Keyed by the page's ENGLISH path. */
export const ARABIC_SEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: "ZentexAI — حلول الذكاء الاصطناعي ووكلاء الذكاء الاصطناعي والأتمتة في الإمارات",
    description:
      "تقدم ZentexAI حلول الذكاء الاصطناعي ووكلاء الذكاء الاصطناعي والأتمتة للشركات في الإمارات والشرق الأوسط، إضافة إلى استشارات إدارة المشاريع والتدريب على اختبار PMP بمحاكي عملي.",
  },
  "/academy": {
    title: "دورة PMP بالعربي ومحاكي اختبار PMP | أكاديمية ZentexAI",
    description:
      "توفر أكاديمية ZentexAI برنامج PMP Mastery بدعم العربية ومحاكي اختبار PMP للمحترفين في الإمارات والشرق الأوسط، إضافة إلى تدريب وكلاء الذكاء الاصطناعي القادم.",
  },
  "/courses": {
    title: "محاكي اختبار PMP ودورات PMP بالعربي والإنجليزي | ZentexAI",
    description:
      "تصفّح محاكي اختبار PMP وبرنامج PMP Mastery من أكاديمية ZentexAI: أسئلة تدريب بالعربية والإنجليزية، ووضع تدريب قابل للتصفية، واختبارات تجريبية كاملة بوقت محدد.",
  },
  "/courses/pmp-exam-simulator": simulatorMetadataText("ar"),
  "/services": {
    title: "حلول الذكاء الاصطناعي والأتمتة والاستشارات للشركات في الإمارات — ZentexAI",
    description:
      "وكلاء ذكاء اصطناعي عمليون وأتمتة لسير العمل واستشارات في الذكاء الاصطناعي للشركات في الإمارات ومنطقة الشرق الأوسط وشمال أفريقيا، إضافة إلى استشارات عملية في إدارة المشاريع.",
  },
  "/services/ai-agents-automation-uae": {
    title: "وكلاء الذكاء الاصطناعي وأتمتة الأعمال في الإمارات | ZentexAI",
    description:
      "تطوير وكلاء الذكاء الاصطناعي وأتمتة الأعمال للشركات في الإمارات، بما في ذلك دبي وأبوظبي، ومنطقة الشرق الأوسط: وكلاء آمنون جاهزون للإنتاج يربطون المعرفة وسير العمل وأنظمة الأعمال مع إشراف بشري مضبوط.",
  },
  "/services/whatsapp-automation-uae": {
    title: "أتمتة واتساب ووكلاء الذكاء الاصطناعي في الإمارات | ZentexAI",
    description:
      "أتمتة واتساب بالذكاء الاصطناعي للشركات في الإمارات، بما في ذلك دبي: تبني ZentexAI أتمتة واتساب ووكلاء ذكاء اصطناعي آمنة تربط محادثات العملاء بتأهيل العملاء المحتملين والحجوزات وسير عمل إدارة العملاء مع تسليم بشري مضبوط.",
  },
  "/services/machine-learning-uae": {
    title: "خدمات تعلّم الآلة والتحليلات التنبؤية في الإمارات | ZentexAI",
    description:
      "تبني ZentexAI تعلّم آلة وتحليلات تنبؤية عملية للشركات في الإمارات، بما في ذلك دبي — التنبؤ بالطلب والتصنيف واكتشاف الحالات الشاذة، مع تقييم مقابل خط أساس واضح قبل أي إطلاق.",
  },
  "/services/data-analytics-uae": {
    title: "خدمات تحليل البيانات في الإمارات | مؤشرات الأداء وذكاء الأعمال | ZentexAI",
    description:
      "خدمات تحليل البيانات وذكاء الأعمال للشركات والمؤسسات الصغيرة والمتوسطة في الإمارات: أُطر مؤشرات الأداء وتدقيق البيانات ونماذج بيانات نظيفة ولوحات معلومات وأتمتة التقارير، مبنية حول قراراتك الفعلية.",
  },
  "/services/power-bi-consulting-uae": {
    title: "استشارات Power BI في الإمارات | لوحات المعلومات ونماذج البيانات | ZentexAI",
    description:
      "استشارات Power BI للشركات في الإمارات، بما في ذلك دبي: لوحات معلومات إدارية ونماذج بيانات وتحديث مجدول وتصميم للوصول ومراجعة للتقارير الحالية وتدريب للفريق.",
  },
};

/** Metadata for the Arabic version of an English path: Arabic title/description, self-referencing /ar canonical, reciprocal hreflang. */
export function arabicMetadata(enPath: string): Metadata {
  const seo = ARABIC_SEO[enPath];
  if (!seo) throw new Error(`No Arabic SEO metadata defined for ${enPath}`);
  const url = toArabicPath(enPath);
  return {
    title: seo.title,
    description: seo.description,
    alternates: alternatesFor(enPath, "ar"),
    openGraph: { title: seo.title, description: seo.description, url, type: "website", locale: "ar_AE" },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
  };
}

export type { SiteLang };
