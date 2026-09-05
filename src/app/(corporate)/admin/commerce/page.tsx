import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireRole";
import {
  getAdminProducts,
  updateProductFlags,
  updateRegularPrice,
  upsertPromoPrice,
  deactivatePromoPrice,
  adminGrantEntitlement,
} from "@/features/commerce/services/productAdminService";
import { formatMoney } from "@/features/commerce/utils/money";

export const metadata: Metadata = { title: "Admin — Commerce" };
export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  // <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm", no timezone/seconds.
  return new Date(iso).toISOString().slice(0, 16);
}

export default async function AdminCommercePage() {
  await requireAdmin({ loginRedirectTo: "/admin/commerce" });
  const products = await getAdminProducts();

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <span className="label">Admin</span>
        <h1 className="mt-3 text-2xl font-bold text-white">Commerce</h1>
        <p className="mt-2 text-[13px] text-slate-500">
          Product visibility, pricing, and launch-promotion configuration. No payment provider is connected yet —
          this only controls what the public storefront shows and who gets a free entitlement.
        </p>

        <div className="mt-8 space-y-6">
          {products.map((product) => {
            const updateFlagsWithId = updateProductFlags.bind(null, product.id);
            const updateRegularWithId = product.regularPrice
              ? updateRegularPrice.bind(null, product.id, product.regularPrice.id)
              : null;
            const upsertPromoWithId = upsertPromoPrice.bind(null, product.id, product.promoPrice?.id ?? null);
            const grantWithSlug = adminGrantEntitlement.bind(null, product.slug);

            return (
              <div key={product.id} className="card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-white">{product.title_en}</p>
                    <p className="text-[12px] text-slate-500">/{product.slug} · {product.type}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      product.is_published ? "bg-emerald-500/[0.12] text-emerald-400" : "bg-white/[0.07] text-slate-400"
                    }`}
                  >
                    {product.is_published ? "Published" : "Draft"}
                  </span>
                </div>

                <form action={updateFlagsWithId} className="mt-4 flex flex-wrap items-center gap-5 border-t border-white/[0.06] pt-4">
                  <label className="flex items-center gap-2 text-[13px] text-slate-400">
                    <input type="checkbox" name="is_active" defaultChecked={product.is_active} className="accent-indigo-500" />
                    Active (purchasable)
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-slate-400">
                    <input type="checkbox" name="is_published" defaultChecked={product.is_published} className="accent-indigo-500" />
                    Published (visible on storefront)
                  </label>
                  <button type="submit" className="btn-ghost px-4 py-2 text-[12px]">
                    Save
                  </button>
                </form>

                {product.regularPrice && (
                  <form action={updateRegularWithId!} className="mt-4 flex items-end gap-3 border-t border-white/[0.06] pt-4">
                    <div>
                      <label className="block text-[11px] text-slate-500">
                        Regular price (minor units, {product.regularPrice.currency})
                      </label>
                      <input
                        name="amount_minor_units"
                        type="number"
                        min={0}
                        defaultValue={product.regularPrice.amount_minor_units}
                        className={`${inputCls} mt-1 w-48`}
                      />
                    </div>
                    <p className="pb-2.5 text-[12px] text-slate-500">
                      = {formatMoney(product.regularPrice.amount_minor_units, product.regularPrice.currency)}
                    </p>
                    <button type="submit" className="btn-ghost px-4 py-2 text-[12px]">
                      Save
                    </button>
                  </form>
                )}

                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <p className="text-[12px] font-semibold text-slate-400">Launch promotion</p>
                  {product.promoPrice && (
                    <p className="mt-1 text-[12px] text-slate-500">
                      Currently configured: {formatMoney(product.promoPrice.amount_minor_units, product.promoPrice.currency)}
                      {" · "}
                      {product.promoPrice.is_active ? "active" : "inactive"}
                      {" · "}
                      {product.promoPrice.valid_from && product.promoPrice.valid_until
                        ? `${new Date(product.promoPrice.valid_from).toLocaleString()} → ${new Date(product.promoPrice.valid_until).toLocaleString()}`
                        : "no window set"}
                    </p>
                  )}
                  <form action={upsertPromoWithId} className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] text-slate-500">Promo price (minor units — 0 = free)</label>
                      <input
                        name="amount_minor_units"
                        type="number"
                        min={0}
                        defaultValue={product.promoPrice?.amount_minor_units ?? 0}
                        className={`${inputCls} mt-1`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">Valid from</label>
                      <input
                        name="valid_from"
                        type="datetime-local"
                        defaultValue={toDatetimeLocalValue(product.promoPrice?.valid_from ?? null)}
                        className={`${inputCls} mt-1`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">Valid until</label>
                      <input
                        name="valid_until"
                        type="datetime-local"
                        defaultValue={toDatetimeLocalValue(product.promoPrice?.valid_until ?? null)}
                        className={`${inputCls} mt-1`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">Access duration (days — blank = same as regular price)</label>
                      <input
                        name="access_duration_days"
                        type="number"
                        min={1}
                        defaultValue={product.promoPrice?.access_duration_days ?? product.regularPrice?.access_duration_days ?? ""}
                        className={`${inputCls} mt-1`}
                      />
                    </div>
                    <label className="flex items-center gap-2 self-end pb-2.5 text-[13px] text-slate-400">
                      <input type="checkbox" name="is_active" defaultChecked={product.promoPrice?.is_active ?? true} className="accent-indigo-500" />
                      Active
                    </label>
                    <button type="submit" className="btn-primary px-4 py-2 text-[12px] sm:col-span-2">
                      Save promotion
                    </button>
                  </form>
                  {product.promoPrice?.is_active && (
                    <form action={deactivatePromoPrice.bind(null, product.promoPrice.id)} className="mt-2">
                      <button type="submit" className="text-[12px] text-red-400 hover:text-red-300">
                        Deactivate promotion
                      </button>
                    </form>
                  )}
                </div>

                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <p className="text-[12px] font-semibold text-slate-400">Manual entitlement grant</p>
                  <form action={grantWithSlug} className="mt-2 flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500">User email</label>
                      <input name="email" type="email" required className={`${inputCls} mt-1 w-64`} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">Duration (days, blank = lifetime)</label>
                      <input name="duration_days" type="number" min={1} className={`${inputCls} mt-1 w-40`} />
                    </div>
                    <button type="submit" className="btn-ghost px-4 py-2 text-[12px]">
                      Grant access
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
