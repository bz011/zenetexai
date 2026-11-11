import type { Metadata } from "next";
import "@/design-lab/base.css";
import { labFontVariables } from "@/design-lab/fonts";
import { manrope } from "@/lib/fonts";

// Isolated root layout for the local design lab (ar). It does not load the
// site's globals.css, Providers or structured data, and is never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function LabRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${labFontVariables} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
