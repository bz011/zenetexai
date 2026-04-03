"use client";

import { useEffect, ReactNode } from "react";
import { LanguageProvider, useLang } from "@/lib/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

// Inner component — has access to context
function ShellInner({ children }: { children: ReactNode }) {
  const { lang, isRTL } = useLang();

  // Sync <html> attributes with selected language
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [lang, isRTL]);

  return (
    <>
      <Header />
      <main className="pt-16">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

// Exported wrapper used in layout
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ShellInner>{children}</ShellInner>
    </LanguageProvider>
  );
}
