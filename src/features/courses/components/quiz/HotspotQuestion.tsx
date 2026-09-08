"use client";

import { useRef, useState } from "react";
import type { QuizQuestion, QuizSubmitAnswer } from "@/features/courses/types/course";
import { getQuestionImagePublicUrl } from "@/lib/supabase/imageUrls";

interface Props {
  question: QuizQuestion;
  value?: QuizSubmitAnswer;
  onChange: (partial: Partial<QuizSubmitAnswer>) => void;
}

/**
 * Captures a click as a percentage of the image's rendered bounding box
 * (0-100 on each axis). Since the image is never stretched (only
 * height-constrained, aspect ratio preserved), this is equivalent to a
 * percentage of the image's natural dimensions — the same convention
 * hotspot coordinates are authored in (see migrations/007, hotspots table).
 * The correct region itself is never sent to the client — only the image.
 */
export default function HotspotQuestion({ question, value, onChange }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [marker, setMarker] = useState<{ xPct: number; yPct: number } | null>(value?.hotspotClick ?? null);

  function handleClick(e: React.MouseEvent<HTMLImageElement>) {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const click = {
      xPct: ((e.clientX - rect.left) / rect.width) * 100,
      yPct: ((e.clientY - rect.top) / rect.height) * 100,
    };
    setMarker(click);
    onChange({ hotspotClick: click });
  }

  const image = question.images[0];
  if (!image) {
    return <p className="text-[13px] text-slate-500">No image available for this question.</p>;
  }

  return (
    // A fixed-width block box, not `inline-block`: percentages (the image's
    // `w-full`, the marker's left/top) need a real containing-block width to
    // resolve against. `inline-block` has none of its own (it shrinks to
    // its content), which silently breaks `max-width: 100%` on the image -
    // the image then falls back to sizing itself purely from `max-height` x
    // its own natural aspect ratio, completely ignoring the actual
    // card/viewport width. Confirmed via direct measurement: the chart
    // rendered at a fixed ~728px regardless of a 360-412px mobile viewport,
    // overflowing the page - exactly the "thin sliver of a much wider image"
    // bug reported. `max-w-2xl` keeps desktop sizing close to the previous
    // `max-h-96` cap without an explicit height (which would either distort
    // the image at odd container widths or require JS to preserve aspect
    // ratio); `w-full` on the image makes it exactly fill this box at any
    // width, mobile included, with `h-auto` preserving its aspect ratio.
    <div className="relative w-full max-w-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={getQuestionImagePublicUrl(image.imagePath)}
        alt={image.altEn ?? ""}
        onClick={handleClick}
        className="h-auto w-full cursor-crosshair rounded-xl border border-white/[0.08]"
      />
      {marker && (
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-400 bg-indigo-500/40"
          style={{ left: `${marker.xPct}%`, top: `${marker.yPct}%` }}
        />
      )}
    </div>
  );
}
