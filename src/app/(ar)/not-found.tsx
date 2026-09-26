import Link from "next/link";
import Logo from "@/components/brand/Logo";

/** Arabic 404 - the Arabic root layout (lang="ar" dir="rtl") has its own not-found boundary. */
export default function ArabicNotFound() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <Link href="/ar" className="mb-10 inline-flex" aria-label="ZentexAI - الرئيسية">
        <Logo variant="primary" />
      </Link>

      <p className="label">404</p>
      <h1 className="mt-3 text-h1 text-ink">الصفحة غير موجودة</h1>
      <p className="mx-auto mt-4 max-w-md text-body text-ink-2">
        الصفحة التي تبحث عنها غير موجودة أو ربما نُقلت. جرّب إحدى الوجهات التالية.
      </p>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/ar" className="btn-primary">
          الصفحة الرئيسية
        </Link>
        <Link href="/ar/services" className="btn-secondary">
          حلول الذكاء الاصطناعي
        </Link>
        <Link href="/ar/academy" className="btn-secondary">
          أكاديمية PMP
        </Link>
      </div>
    </main>
  );
}
