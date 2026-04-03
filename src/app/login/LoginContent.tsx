"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

export default function LoginContent() {
  const { t } = useLang();
  const lg = t.login;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[18px] font-bold text-white">
            ZENETEX<span className="text-indigo-400">AI</span>
          </Link>
          <p className="mt-2 text-[14px] text-slate-500">{lg.tagline}</p>
        </div>

        <div className="card p-7">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{lg.email}</label>
              <input type="email" placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-400">{lg.password}</label>
              <input type="password" placeholder="••••••••" className={inputCls} />
            </div>
            <button type="button" className="btn-primary w-full py-3 text-[14px]">
              {lg.btn}
            </button>
          </div>

          <div className="mt-6 border-t border-white/[0.06] pt-5 text-center">
            <p className="text-[12px] text-slate-600">{lg.note}</p>
          </div>
        </div>

        <p className="mt-5 text-center text-[13px] text-slate-500">
          {lg.not_member}{" "}
          <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            {lg.get_in_touch}
          </Link>
        </p>
      </div>
    </div>
  );
}
