import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structuredData";
import { BRAND } from "@/lib/branding";

const title = `${BRAND.name} — AI Solutions, Consulting & Professional Learning`;
const description = `${BRAND.tagline} Featuring the PMP Mastery Program.`;

// Canonical production origin. NEXT_PUBLIC_APP_URL is the actual configured
// env var used everywhere else in this app (Ziina/certificate links) - a
// previous version of this file read NEXT_PUBLIC_SITE_URL, which is never
// set anywhere, silently falling back to a misspelled default domain
// ("zenetexai.com") for metadataBase/canonical/OG URLs on every page.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zentexai.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, siteName: BRAND.name, type: "website", url: "/" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body style={{ backgroundColor: "var(--bg)" }} className="text-slate-200 antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
