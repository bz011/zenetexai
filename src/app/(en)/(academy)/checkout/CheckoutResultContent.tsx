"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { CheckoutVerificationResult } from "@/features/commerce/services/checkoutService";

export default function CheckoutResultContent({ result }: { result: CheckoutVerificationResult }) {
  const { t, lang } = useLang();
  const k = t.commerce.checkout;
  const productHref = `/courses/${result.productSlug ?? "pmp-exam-simulator"}`;

  const content = (() => {
    switch (result.status) {
      case "completed":
        return {
          heading: k.success_heading,
          body: k.success_body,
          tone: "success" as const,
          extra: result.expiresAt ? (
            <p className="mt-2 text-[13px] text-slate-500">
              {k.access_until_label}: {new Date(result.expiresAt).toLocaleDateString(lang === "ar" ? "ar" : "en-US")}
            </p>
          ) : null,
          actions: (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/pmp/practice" className="btn-primary flex-1 text-center">
                {k.go_to_practice}
              </Link>
              <Link href="/pmp/mock-exam" className="btn-secondary flex-1 text-center">
                {k.go_to_mock_exam}
              </Link>
            </div>
          ),
        };
      case "pending":
        return {
          heading: k.pending_heading,
          body: k.pending_body,
          tone: "pending" as const,
          extra: null,
          actions: (
            <div className="mt-6">
              <button onClick={() => window.location.reload()} className="btn-primary px-5 py-2.5 text-[13px]">
                {k.refresh}
              </button>
            </div>
          ),
        };
      case "cancelled":
        return {
          heading: k.cancelled_heading,
          body: k.cancelled_body,
          tone: "neutral" as const,
          extra: null,
          actions: (
            <div className="mt-6">
              <Link href={productHref} className="btn-primary px-5 py-2.5 text-[13px]">
                {k.try_again}
              </Link>
            </div>
          ),
        };
      case "forbidden":
      case "not_found":
        return {
          heading: k.not_found_heading,
          body: k.not_found_body,
          tone: "neutral" as const,
          extra: null,
          actions: (
            <div className="mt-6">
              <Link href={productHref} className="btn-secondary px-5 py-2.5 text-[13px]">
                {k.back_to_product}
              </Link>
            </div>
          ),
        };
      case "failed":
      default:
        return {
          heading: k.failed_heading,
          body: k.failed_body,
          tone: "error" as const,
          extra: null,
          actions: (
            <div className="mt-6">
              <Link href={productHref} className="btn-primary px-5 py-2.5 text-[13px]">
                {k.try_again}
              </Link>
            </div>
          ),
        };
    }
  })();

  const badgeColor =
    content.tone === "success"
      ? "bg-emerald-500/[0.15] text-emerald-400"
      : content.tone === "error"
        ? "bg-red-500/[0.15] text-red-400"
        : content.tone === "pending"
          ? "bg-amber-500/[0.15] text-amber-400"
          : "bg-white/[0.06] text-slate-400";

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="relative flex min-h-screen items-center justify-center px-6 py-24">
      <div className="card w-full max-w-md p-8 text-center">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg ${badgeColor}`}>
          {content.tone === "success" ? "✓" : content.tone === "error" ? "!" : content.tone === "pending" ? "…" : "×"}
        </span>
        <h1 className="mt-4 text-xl font-bold text-white">{content.heading}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{content.body}</p>
        {content.extra}
        {content.actions}
      </div>
    </div>
  );
}
