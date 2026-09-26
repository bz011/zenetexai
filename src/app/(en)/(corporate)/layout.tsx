import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SkipLink from "@/components/nav/SkipLink";
import WhatsAppButton from "@/components/WhatsAppButton";

/** Corporate Shell - the dark ZentexAI marketing identity (light/dark comes from design tokens). */
export default function CorporateLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" tabIndex={-1} className="pt-16 focus:outline-none">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
