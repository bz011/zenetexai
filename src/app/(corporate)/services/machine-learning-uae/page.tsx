import type { Metadata } from "next";
import MachineLearningContent from "./MachineLearningContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/structuredData";
import translations from "@/lib/translations";

const title = "Machine Learning Services UAE | ZentexAI";
const description =
  "ZentexAI builds practical machine learning and predictive analytics for UAE businesses, including Dubai — demand forecasting, classification, and anomaly detection, evaluated against a clear baseline before anything goes live.";
const PATH = "/services/machine-learning-uae";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: PATH },
  openGraph: { title, description, url: PATH, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

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
