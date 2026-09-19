import type { Metadata } from "next";
import AiAgentsAutomationContent from "@/app/(en)/(corporate)/services/ai-agents-automation-uae/AiAgentsAutomationContent";
import ArabicServiceJsonLd from "@/components/seo/ArabicServiceJsonLd";
import translations from "@/lib/translations";
import { arabicMetadata } from "@/lib/arabicSeo";

const EN_PATH = "/services/ai-agents-automation-uae";

export const metadata: Metadata = arabicMetadata(EN_PATH);

export default function Page() {
  return (
    <>
      <ArabicServiceJsonLd
        enPath={EN_PATH}
        crumbName="وكلاء الذكاء الاصطناعي والأتمتة في الإمارات"
        serviceName="وكلاء الذكاء الاصطناعي وأتمتة الأعمال"
        serviceDescription="وكلاء ذكاء اصطناعي وأتمتة أعمال آمنة وجاهزة للإنتاج للشركات في الإمارات، تربط المعرفة وسير العمل وأنظمة الأعمال مع إشراف بشري مضبوط."
        faq={translations.ar.aiAgentsAutomation.faq}
      />
      <AiAgentsAutomationContent />
    </>
  );
}
