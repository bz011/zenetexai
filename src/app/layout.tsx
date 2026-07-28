import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { BRAND } from "@/lib/branding";

const title = `${BRAND.name} — AI Solutions, Consulting & Professional Learning`;
const description = `${BRAND.tagline} Featuring the PMP Mastery Program.`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://zenetexai.com"),
  title,
  description,
  openGraph: { title, description, siteName: BRAND.name, type: "website" },
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
