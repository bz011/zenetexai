"use client";

import { useCallback, useEffect, useState } from "react";
import FlowStage from "@/components/flow/FlowStage";
import CoreStage from "@/components/core3d/CoreStage";
import { resolveCoreParams, type CoreParams } from "@/components/core3d/coreParam";

/**
 * The hero's visual. By default this is exactly the governed-flow figure.
 * Look-dev only: /?core=A|B|C swaps in the Intelligence Core treatments on
 * desktop widths. The server render and first client render are always the
 * default, so this can never change what visitors get on `/`.
 */
export default function HeroVisual() {
  const [core, setCore] = useState<CoreParams | null>(null);
  const failed = useCallback(() => setCore(null), []);

  useEffect(() => {
    const params = resolveCoreParams(window.location.search);
    if (params && window.matchMedia("(min-width: 1024px)").matches) setCore(params);
  }, []);

  // Look-dev composition only: a slightly narrower intro paragraph frees the
  // room the input labels need. Restored on unmount; `/` is never touched.
  useEffect(() => {
    if (!core) return;
    const p = document.querySelector<HTMLElement>("#hero-title ~ p");
    if (!p) return;
    const prev = p.style.maxWidth;
    p.style.maxWidth = "26rem";
    return () => {
      p.style.maxWidth = prev;
    };
  }, [core]);

  if (!core) return <FlowStage />;
  // keep the grid column's height; the canvas itself is absolutely positioned and bleeds right
  return (
    <div className="relative min-h-[420px] lg:min-h-[640px]">
      <CoreStage params={core} onFailed={failed} />
    </div>
  );
}
