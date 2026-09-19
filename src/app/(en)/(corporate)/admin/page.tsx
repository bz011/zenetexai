import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireRole";
import AdminContent from "./AdminContent";

export const metadata: Metadata = { title: "Admin — ZENTEXAI", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { profile } = await requireAdmin({ loginRedirectTo: "/admin" });

  return <AdminContent firstName={profile.first_name} />;
}
