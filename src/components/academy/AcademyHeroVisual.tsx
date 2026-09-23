interface Props {
  className?: string;
}

/**
 * The Academy hero's product visual: a large, minimal browser-style frame
 * (thin top bar, no fake URL text) around the real lesson-player screenshot
 * (public/academy/lesson-player.webp - an owner-provided, authentic capture
 * of /courses/[slug]/lessons/[lessonId]). No device bezel eating into the
 * image, no invented UI - the real interface is the visual.
 */
export default function AcademyHeroVisual({ className = "" }: Props) {
  return (
    <div className={`mx-auto w-full max-w-5xl ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_40px_80px_-40px_rgba(15,23,42,0.3)]">
        <div aria-hidden="true" className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="aspect-[16/10] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/academy/lesson-player.webp"
            alt="The ZentexAI Academy lesson player, showing a PMP Mastery Program video lesson and the course curriculum sidebar"
            width={1400}
            height={875}
            decoding="async"
            className="h-full w-full object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}
