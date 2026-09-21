import type { Metadata } from "next";
import "../globals.css";
import Providers from "@/components/Providers";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structuredData";
import { BRAND } from "@/lib/branding";
import { arabicFont } from "@/lib/fonts";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zentexai.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: { siteName: BRAND.name, type: "website", locale: "ar_AE" },
};

/**
 * Root layout for every /ar/... URL. A separate root layout (rather than
 * one shared <html>) is what lets the server send lang="ar" dir="rtl" in
 * the initial HTML; the language of the page body itself comes from the URL
 * (see LanguageContext), so no client-side toggle is involved.
 */
export default function ArabicRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ backgroundColor: "var(--bg)" }} className={`${arabicFont.variable} text-slate-200 antialiased`}>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
