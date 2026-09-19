import type { Metadata } from "next";
import ServiceLandingContent from "@/components/ServiceLandingContent";
import ArabicServiceJsonLd from "@/components/seo/ArabicServiceJsonLd";
import translations from "@/lib/translations";
import { arabicMetadata } from "@/lib/arabicSeo";

const EN_PATH = "/services/data-analytics-uae";

export const metadata: Metadata = arabicMetadata(EN_PATH);

export default function Page() {
  return (
    <>
      <ArabicServiceJsonLd
        enPath={EN_PATH}
        crumbName="خدمات تحليل البيانات في الإمارات"
        serviceName="خدمات تحليل البيانات"
        serviceDescription="أُطر مؤشرات الأداء وتدقيق البيانات ونمذجتها ولوحات المعلومات وأتمتة التقارير للشركات في الإمارات."
        faq={translations.ar.dataAnalytics.faq}
      />
      <ServiceLandingContent copyKey="dataAnalytics" />
    </>
  );
}
