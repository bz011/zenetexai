import type { ReactNode } from "react";
import SkipLink from "@/components/nav/SkipLink";
import AuthFrame from "@/site/auth/AuthFrame";

/**
 * Account screens (/login, /signup, /forgot-password, /reset-password,
 * /verify-email). A route group only: URLs are unchanged. They use the
 * approved Teal Flow frame instead of the marketing header and footer.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <AuthFrame>{children}</AuthFrame>
    </>
  );
}
