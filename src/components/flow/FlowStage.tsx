"use client";

import { useEffect, useRef } from "react";
import GovernedFlow from "@/components/flow/GovernedFlow";
import { readFlow3DEnv, shouldEnableFlow3D } from "@/components/flow3d/capability";
import { resolveFlow3D } from "@/lib/featureFlags";

/**
 * The governed flow with its optional 3D layer. The SVG/HTML diagram is always
 * rendered and is the complete experience; the WebGL layer is an enhancement
 * that loads only when ALL of these hold: the feature flag is on, viewport
 * >= 1024px, a fine pointer, no reduced-motion preference, no data-saver, and
 * WebGL is available. It is fetched after the page's load event and an idle
 * callback, so it can never compete with LCP, and any failure (import error,
 * context loss) leaves the SVG exactly as it was.
 */
export default function FlowStage({ className = "" }: { className?: string }) {
  const figure = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!resolveFlow3D(window.location.search)) return;
    if (!shouldEnableFlow3D(readFlow3DEnv(), true)) return;

    let cancelled = false;
    let handle: { dispose: () => void } | null = null;

    const start = () => {
      import("@/components/flow3d/mountFlow3D")
        .then(({ default: mount }) => {
          if (cancelled || !figure.current) return;
          handle = mount(figure.current, () => {
            handle?.dispose();
            handle = null;
          });
        })
        .catch(() => {
          /* keep the SVG diagram */
        });
    };
    const whenIdle = () => {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
      if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 3000 });
      else setTimeout(start, 1500);
    };

    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", whenIdle);
      handle?.dispose();
    };
  }, []);

  return <GovernedFlow ref={figure} className={className} />;
}
