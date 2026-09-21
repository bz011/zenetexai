import type { Metadata } from "next";
import ServiceLandingContent from "@/components/ServiceLandingContent";
import ArabicServiceJsonLd from "@/components/seo/ArabicServiceJsonLd";
import translations from "@/lib/translations";
import { arabicMetadata } from "@/lib/arabicSeo";

const EN_PATH = "/services/power-bi-consulting-uae";

export const metadata: Metadata = arabicMetadata(EN_PATH);

export default function Page() {
  return (
    <>
      <ArabicServiceJsonLd
        enPath={EN_PATH}
        crumbName="استشارات Power BI في الإمارات"
        serviceName="استشارات Power BI"
        serviceDescription="لوحات معلومات ونماذج بيانات Power BI وإعداد التحديث والوصول ومراجعة التقارير والتدريب للشركات في الإمارات."
        faq={translations.ar.powerBi.faq}
      />
      <ServiceLandingContent copyKey="powerBi" visual="dashboardSketch" />
    </>
  );
}
