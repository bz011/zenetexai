"use client";

import SiteHeader from "@/components/nav/SiteHeader";
import { useLang } from "@/lib/LanguageContext";

/** Corporate (dark) header. The full navigation needs the `lg` breakpoint - at 768px it overflowed by ~26px. */
export default function Header() {
  const { t } = useLang();
  return (
    <SiteHeader
      position="fixed"
      logoTone="dark"
      navFrom="lg"
      anonymousActions="login"
      navLinks={[
        { href: "/services", label: t.nav.services },
        { href: "/academy", label: t.nav.academy },
        { href: "/resources", label: t.nav.resources },
        { href: "/blog", label: t.nav.blog },
        { href: "/about", label: t.nav.about },
        { href: "/contact", label: t.nav.contact },
      ]}
    />
  );
}
