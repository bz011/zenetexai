import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import MachineLearningContent from "./MachineLearningContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/structuredData";
import translations from "@/lib/translations";

const title = "Machine Learning Services UAE | ZentexAI";
const description =
  "Practical machine learning for UAE businesses: demand forecasting, classification and anomaly detection, checked against a clear baseline before launch.";
const PATH = "/services/machine-learning-uae";

export const metadata: Metadata = mirroredPageMetadata(PATH, "en", title, description);

export default function MachineLearningPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Machine Learning Services UAE", path: PATH },
        ])}
      />
      <JsonLd
        data={serviceJsonLd({
          name: "Machine Learning Services",
          description: "Practical machine learning for UAE businesses, covering forecasting, classification, and anomaly detection, evaluated against a clear baseline before integration.",
          path: PATH,
          areaServed: ["United Arab Emirates"],
        })}
      />
      <JsonLd data={faqJsonLd(translations.en.machineLearning.faq)} />
      <MachineLearningContent />
    </>
  );
}
