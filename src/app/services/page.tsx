import type { Metadata } from "next";
import ServicesContent from "./ServicesContent";

export const metadata: Metadata = { title: "Services — ZENTEXAI" };

export default function ServicesPage() {
  return <ServicesContent />;
}
