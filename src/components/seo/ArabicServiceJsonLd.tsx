import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/structuredData";
import { toArabicPath } from "@/lib/i18nRoutes";

/** Arabic-page structured data: breadcrumb + Service + FAQPage, all from the same Arabic text rendered on the page. */
export default function ArabicServiceJsonLd({
  enPath,
  crumbName,
  serviceName,
  serviceDescription,
  faq,
}: {
  enPath: string;
  crumbName: string;
  serviceName: string;
  serviceDescription: string;
  faq: { q: string; a: string }[];
}) {
  const path = toArabicPath(enPath);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "الرئيسية", path: "/ar" },
          { name: "الخدمات", path: "/ar/services" },
          { name: crumbName, path },
        ])}
      />
      <JsonLd data={serviceJsonLd({ name: serviceName, description: serviceDescription, path, areaServed: ["United Arab Emirates"] })} />
      <JsonLd data={faqJsonLd(faq, "ar")} />
    </>
  );
}
