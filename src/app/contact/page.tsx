import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = { title: "Contact — ZENTEXAI" };

export default function ContactPage() {
  return <ContactContent />;
}
