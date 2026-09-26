"use client";

import { useEffect, ReactNode } from "react";
import { LanguageProvider, useLang } from "@/lib/LanguageContext";
import { AuthProvider } from "@/features/auth/hooks/useAuth";

/**
 * Global context providers only - no Header/Footer/nav here. Every shell
 * (Corporate, Academy, and the bare Exam runner) needs language/auth state,
 * but only Corporate and Academy render surrounding chrome - that choice
 * lives in each route group's own layout.tsx (see (corporate)/layout.tsx
 * and (academy)/layout.tsx), not here.
 */
function LangSync({ children }: { children: ReactNode }) {
  const { lang, isRTL } = useLang();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [lang, isRTL]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <LangSync>{children}</LangSync>
      </AuthProvider>
    </LanguageProvider>
  );
}
