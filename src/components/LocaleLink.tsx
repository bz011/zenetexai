"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLang } from "@/lib/LanguageContext";
import { localizeHref } from "@/lib/i18nRoutes";

/**
 * Drop-in replacement for next/link on pages that render in both languages:
 * for Arabic readers, a link to a page that has an Arabic version points at
 * that Arabic URL; every other link is passed through unchanged.
 */
export default function LocaleLink({ href, ...rest }: ComponentProps<typeof Link>) {
  const { lang } = useLang();
  const resolved = typeof href === "string" ? localizeHref(href, lang) : href;
  return <Link href={resolved} {...rest} />;
}
