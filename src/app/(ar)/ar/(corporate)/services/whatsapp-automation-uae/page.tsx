import type { Metadata } from "next";
import WhatsappAutomationContent from "@/app/(en)/(corporate)/services/whatsapp-automation-uae/WhatsappAutomationContent";
import ArabicServiceJsonLd from "@/components/seo/ArabicServiceJsonLd";
import translations from "@/lib/translations";
import { arabicMetadata } from "@/lib/arabicSeo";

const EN_PATH = "/services/whatsapp-automation-uae";

export const metadata: Metadata = arabicMetadata(EN_PATH);

export default function Page() {
  return (
    <>
      <ArabicServiceJsonLd
        enPath={EN_PATH}
        crumbName="أتمتة واتساب في الإمارات"
        serviceName="أتمتة واتساب ووكلاء الذكاء الاصطناعي"
        serviceDescription="أتمتة واتساب ووكلاء ذكاء اصطناعي آمنة للشركات في الإمارات، تشمل تأهيل العملاء المحتملين والحجوزات وسير عمل إدارة العملاء مع تسليم بشري مضبوط."
        faq={translations.ar.whatsappAutomation.faq}
      />
      <WhatsappAutomationContent />
    </>
  );
}
