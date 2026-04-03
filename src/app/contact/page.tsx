import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = { title: "Contact — ZENETEXAI" };

export default function ContactPage() {
  return <ContactContent />;
}
