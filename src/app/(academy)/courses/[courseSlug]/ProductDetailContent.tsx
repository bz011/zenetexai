"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { ProductWithPricing } from "@/features/commerce/types/commerce";
import type { PublicCurriculumModule } from "@/features/courses/services/courseService";
import { formatMoney } from "@/features/commerce/utils/money";
import EnrollFreeButton from "@/features/commerce/components/EnrollFreeButton";

interface Props {
  product: ProductWithPricing;
  courseSlug: string | null;
  curriculum: PublicCurriculumModule[];
  isAuthenticated: boolean;
  alreadyOwned: boolean;
}

export default function ProductDetailContent({ product, courseSlug, curriculum, isAuthenticated, alreadyOwned }: Props) {
  const { t, lang } = useLang();
  const p = t.commerce.product;
  const c = t.commerce.card;

  const title = lang === "ar" && product.title_ar ? product.title_ar : product.title_en;
  const description = lang === "ar" && product.description_ar ? product.description_ar : product.description_en;
  const price = product.price;
  const isFreeNow = !!price && price.isPromotionActive && price.effectiveAmountMinorUnits === 0;

  const hasCourse = product.capabilities.includes("course:pmp");
  const hasPractice = product.capabilities.includes("practice:pmp");
  const hasMockExam = product.capabilities.includes("mock_exam:pmp");

  const capabilityLabels = [
    hasCourse ? p.capability_course : null,
    hasPractice ? p.capability_practice : null,
    hasMockExam ? p.capability_mock_exam : null,
  ].filter((v): v is string => !!v);

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[100px]" />

      <div className="container-page relative max-w-3xl">
        <span className="label">{product.type}</span>
        <h1 className="mt-3 text-3xl font-bold text-white">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-400">{description}</p>}

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {description && (
              <section>
                <h2 className="text-[15px] font-semibold text-white">{p.overview_heading}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{description}</p>
              </section>
            )}

            {capabilityLabels.length > 0 && (
              <section>
                <h2 className="text-[15px] font-semibold text-white">{p.included_heading}</h2>
                <ul className="mt-3 space-y-2">
                  {capabilityLabels.map((label) => (
                    <li key={label} className="flex items-center gap-2 text-[13px] text-slate-300">
                      <span className="text-emerald-400">✓</span> {label}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {courseSlug && (
              <section>
                <h2 className="text-[15px] font-semibold text-white">{p.curriculum_heading}</h2>
                {curriculum.length === 0 ? (
                  <p className="mt-3 text-[13px] text-slate-500">{p.curriculum_empty}</p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {curriculum.map((mod, mi) => (
                      <div key={mod.id} className="card p-5">
                        <h3 className="text-[14px] font-semibold text-white">
                          {mi + 1}. {lang === "ar" && mod.titleAr ? mod.titleAr : mod.titleEn}
                        </h3>
                        <ul className="mt-2 space-y-1">
                          {mod.lessons.map((lesson) =>
                            alreadyOwned && courseSlug ? (
                              <li key={lesson.id}>
                                <Link
                                  href={`/courses/${courseSlug}/lessons/${lesson.id}`}
                                  className="block text-[13px] text-indigo-400 hover:text-indigo-300"
                                >
                                  {lang === "ar" && lesson.titleAr ? lesson.titleAr : lesson.titleEn}
                                </Link>
                              </li>
                            ) : (
                              <li key={lesson.id} className="text-[13px] text-slate-500">
                                {lang === "ar" && lesson.titleAr ? lesson.titleAr : lesson.titleEn}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="card h-fit space-y-5 p-6">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-400">{p.pricing_heading}</h2>
              {price ? (
                isFreeNow ? (
                  <div className="mt-2">
                    {price.regularAmountMinorUnits !== null && (
                      <p className="text-[13px] text-slate-500 line-through">
                        {p.regular_price_label}: {formatMoney(price.regularAmountMinorUnits, price.currency)}
                      </p>
                    )}
                    <p className="mt-1 text-2xl font-bold text-emerald-400">{c.free_badge}</p>
                    {price.promotionValidUntil && (
                      <p className="mt-1 text-[12px] text-slate-500">
                        {p.promo_ends_label}: {new Date(price.promotionValidUntil).toLocaleDateString(lang === "ar" ? "ar" : "en-US")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-2xl font-bold text-white">{formatMoney(price.effectiveAmountMinorUnits, price.currency)}</p>
                )
              ) : (
                <p className="mt-2 text-[13px] text-slate-500">—</p>
              )}
              {price?.accessDurationDays && (
                <p className="mt-1 text-[12px] text-slate-500">
                  {c.access_duration.replace("{n}", String(Math.round(price.accessDurationDays / 30)))}
                </p>
              )}
            </div>

            <div className="border-t border-white/[0.06] pt-5">
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-[13px] text-slate-400">{p.login_prompt}</p>
                  <div className="flex gap-3">
                    <Link href={`/login?redirectTo=/courses/${product.slug}`} className="btn-primary flex-1 text-center">
                      {p.login_cta}
                    </Link>
                    <Link href="/signup" className="btn-secondary flex-1 text-center">
                      {p.signup_cta}
                    </Link>
                  </div>
                </div>
              ) : alreadyOwned ? (
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-emerald-400">{c.owned_badge} ✓</p>
                  {hasCourse && courseSlug && curriculum.length > 0 && (
                    <Link
                      href={`/courses/${courseSlug}/lessons/${curriculum[0].lessons[0].id}`}
                      className="btn-primary block px-5 py-2.5 text-center text-[13px]"
                    >
                      {c.continue_learning}
                    </Link>
                  )}
                  {hasPractice && (
                    <Link href="/pmp/practice" className="btn-secondary block px-5 py-2.5 text-center text-[13px]">
                      {t.commerce.dashboard.open_practice}
                    </Link>
                  )}
                  {hasMockExam && (
                    <Link href="/pmp/mock-exam" className="btn-secondary block px-5 py-2.5 text-center text-[13px]">
                      {t.commerce.dashboard.open_mock_exam}
                    </Link>
                  )}
                </div>
              ) : isFreeNow ? (
                <EnrollFreeButton productSlug={product.slug} />
              ) : (
                <p className="text-[13px] text-slate-400">{c.opening_soon}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
