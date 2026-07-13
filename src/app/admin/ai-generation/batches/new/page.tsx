import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import NewBatchForm from "./NewBatchForm";

export const metadata: Metadata = { title: "Admin — New Generation Batch" };
export const dynamic = "force-dynamic";

export default async function NewBatchPage() {
  await requireRole(["admin", "instructor"], { loginRedirectTo: "/admin/ai-generation/batches/new" });

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-2xl">
        <Link href="/admin/ai-generation" className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
          ← AI Generation
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">Create Generation Batch</h1>
        <p className="mt-2 text-[13px] text-slate-500">
          Maximum 100 questions per batch. Creating a batch only configures it (status: draft) - an operator must
          run it via <code>npm run generate:questions -- --batch-id &lt;id&gt;</code> to actually execute it (a
          multi-question batch can take minutes, which is not safe to run inline from this page).
        </p>

        <NewBatchForm />
      </div>
    </div>
  );
}
