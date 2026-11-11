import type { ReactNode } from "react";
import SkipLink from "@/components/nav/SkipLink";
import WhatsAppButton from "@/components/WhatsAppButton";
import SiteChrome from "@/site/SiteChrome";

/** Corporate Shell - the dark ZentexAI marketing identity (light/dark comes from design tokens). */
export default function CorporateLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <SiteChrome>{children}</SiteChrome>
      <WhatsAppButton />
    </>
  );
}
