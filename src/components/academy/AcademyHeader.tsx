"use client";

import SiteHeader from "@/components/nav/SiteHeader";
import { useLang } from "@/lib/LanguageContext";

/**
 * Header for the ZentexAI Academy shell: the same component as the corporate
 * header on light token values (see SiteHeader), with learning-focused
 * navigation and an Enroll action.
 */
export default function AcademyHeader() {
  const { t } = useLang();
  return (
    <SiteHeader
      position="sticky"
      logoTone="light"
      navFrom="md"
      anonymousActions="login-enroll"
      enrollHref="/courses"
      enrollLabel={t.academyNav.enroll}
      navLinks={[
        { href: "/courses", label: t.academyNav.courses },
        { href: "/pmp/practice", label: t.academyNav.practice },
        { href: "/pmp/mock-exam", label: t.academyNav.mockExam },
      ]}
    />
  );
}
