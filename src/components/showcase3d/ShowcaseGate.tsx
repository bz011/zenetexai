"use client";

import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { readFlow3DEnv } from "@/components/flow3d/capability";
import { resolveShowcaseParams, type ShowcaseParams, type ShowcaseServiceId } from "./showcaseParam";

interface HeroProps {
  initial: ShowcaseServiceId;
  onFailed: () => void;
}

/**
 * Homepage hero switch. Children ARE the pre-showcase hero and are what the
 * server and the first client render always show, so there's no layout shift
 * or SSR mismatch before the effect below runs. On mount, unless the URL opts
 * out (?showcase=0) and provided WebGL exists, this swaps in the showcase
 * (loaded on demand, so it adds nothing to the route's initial JavaScript), at
 * every screen size - portrait screens get their own framing. Any failure -
 * WebGL missing, the dynamic import rejecting, or the showcase itself calling
 * onFailed() after a mount error - falls back to the children automatically.
 */
export default function ShowcaseGate({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [active, setActive] = useState<{ Hero: ComponentType<HeroProps>; params: ShowcaseParams } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const params = resolveShowcaseParams(window.location.search);
    if (!params) return;
    if (!readFlow3DEnv().webgl) return;
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
