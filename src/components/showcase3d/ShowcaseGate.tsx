"use client";

import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { readFlow3DEnv } from "@/components/flow3d/capability";
import { resolveShowcaseParams, type ShowcaseParams, type ShowcaseServiceId } from "./showcaseParam";

interface HeroProps {
  initial: ShowcaseServiceId;
  onFailed: () => void;
}

/**
 * Look-dev switch for the homepage hero. Children ARE the default hero and are
 * what the server and the first client render always show. Only when the URL
 * asks (?showcase=1), the viewport is desktop-wide and WebGL exists does this
 * swap in the showcase (loaded on demand, so it adds nothing to the route's
 * initial JavaScript). Any failure returns to the default hero.
 */
export default function ShowcaseGate({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [active, setActive] = useState<{ Hero: ComponentType<HeroProps>; params: ShowcaseParams } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const params = resolveShowcaseParams(window.location.search);
    if (!params) return;
    if (!window.matchMedia("(min-width: 1024px)").matches || !readFlow3DEnv().webgl) return;
    let cancelled = false;
    import("./ShowcaseHero").then((m) => {
      if (!cancelled) setActive({ Hero: m.default, params });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const failed = useCallback(() => setActive(null), []);

  if (!active) return <>{children}</>;
  return <active.Hero initial={active.params.scene} onFailed={failed} />;
}
