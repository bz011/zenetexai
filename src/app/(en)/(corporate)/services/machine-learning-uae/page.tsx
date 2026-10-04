import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import MachineLearningContent from "./MachineLearningContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/structuredData";
import translations from "@/lib/translations";

const title = "Machine Learning Services | ZentexAI";
const description =
  "Practical machine learning: demand forecasting, classification and anomaly detection, checked against a clear baseline before launch.";
const PATH = "/services/machine-learning-uae";

export const metadata: Metadata = mirroredPageMetadata(PATH, "en", title, description);

export default function MachineLearningPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Machine Learning Services", path: PATH },
        ])}
      />
      <JsonLd
        data={serviceJsonLd({
          name: "Machine Learning Services",
          description: "Practical machine learning covering forecasting, classification, and anomaly detection, evaluated against a clear baseline before integration.",
          path: PATH,
        })}
      />
      <JsonLd data={faqJsonLd(translations.en.machineLearning.faq)} />
      <MachineLearningContent />
    </>
  );
}
