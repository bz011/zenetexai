"use client";

import { useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LanguageProvider, useLang } from "@/lib/LanguageContext";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

// Matches only the active Mock Exam runner route (/pmp/mock-exam/<attemptId>)
// - not the start page, not /history, not /<attemptId>/results - so the
// marketing chrome (Header/Footer/WhatsApp button) is suppressed only while
// a candidate is actually taking the exam (item 9's distraction-free
// requirement), and reappears everywhere else including Mock Exam results.
const DISTRACTION_FREE_ROUTE = /^\/pmp\/mock-exam\/(?!history$)[^/]+$/;

// Inner component — has access to context
function ShellInner({ children }: { children: ReactNode }) {
  const { lang, isRTL } = useLang();
  const pathname = usePathname();
  const distractionFree = DISTRACTION_FREE_ROUTE.test(pathname ?? "");

  // Sync <html> attributes with selected language
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [lang, isRTL]);

  if (distractionFree) {
    return <>{children}</>;
  }

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
      <AuthProvider>
        <ShellInner>{children}</ShellInner>
      </AuthProvider>
    </LanguageProvider>
  );
}
