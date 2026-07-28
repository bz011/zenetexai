import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ZENTEXAI Academy — PMP Certification Exam Prep",
  description: "Prepare for the PMP exam with structured lessons, a full practice question bank, timed exam simulations, and progress tracking.",
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
