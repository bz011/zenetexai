import type { Metadata } from "next";
import MachineLearningContent from "./MachineLearningContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structuredData";

const title = "Machine Learning Services UAE | ZentexAI";
const description =
  "ZentexAI builds practical machine learning for UAE businesses — demand forecasting, classification, anomaly detection, and predictive analytics, evaluated against a clear baseline before anything goes live.";
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
        })}
      />
      <MachineLearningContent />
    </>
  );
}
