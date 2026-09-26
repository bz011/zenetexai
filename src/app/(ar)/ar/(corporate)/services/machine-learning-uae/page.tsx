import type { Metadata } from "next";
import MachineLearningContent from "@/app/(en)/(corporate)/services/machine-learning-uae/MachineLearningContent";
import ArabicServiceJsonLd from "@/components/seo/ArabicServiceJsonLd";
import translations from "@/lib/translations";
import { arabicMetadata } from "@/lib/arabicSeo";

const EN_PATH = "/services/machine-learning-uae";

export const metadata: Metadata = arabicMetadata(EN_PATH);

export default function Page() {
  return (
    <>
      <ArabicServiceJsonLd
        enPath={EN_PATH}
        crumbName="خدمات تعلّم الآلة في الإمارات"
        serviceName="خدمات تعلّم الآلة"
        serviceDescription="تعلّم آلة عملي للشركات في الإمارات، يشمل التنبؤ بالطلب والتصنيف واكتشاف الحالات الشاذة، مع تقييم مقابل خط أساس واضح قبل التكامل."
        faq={translations.ar.machineLearning.faq}
      />
      <MachineLearningContent />
    </>
  );
}
