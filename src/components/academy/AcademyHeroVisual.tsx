interface Props {
  caption: string;
  className?: string;
}

/**
 * The Academy hero's product visual: a plain laptop mockup (CSS chrome, no
 * photo asset for the laptop itself) framing a real screenshot of the
 * lesson player (public/academy/lesson-player.webp) - an owner-provided,
 * authentic capture of /courses/[slug]/lessons/[lessonId], cropped to the
 * screen's 16:10 shape without stretching. Not a fabricated interface.
 */
export default function AcademyHeroVisual({ className = "" }: Props) {
  return (
    <div className={`relative mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[560px] ${className}`}>
      <div aria-hidden="true" className="absolute inset-0 -z-10 scale-125 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.16),transparent_70%)] blur-2xl" />

      {/* Screen */}
      <div className="relative rounded-[7%] bg-gradient-to-b from-slate-700 to-slate-800 p-[3%] shadow-[0_35px_70px_-25px_rgba(15,23,42,0.35)]">
        <div aria-hidden="true" className="absolute left-1/2 top-[1.6%] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-slate-600" />
        <div className="aspect-[16/10] w-full overflow-hidden rounded-[4%] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/academy/lesson-player.webp"
            alt=""
            aria-hidden="true"
            width={1400}
            height={875}
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Base / hinge - plain flow, directly under the bezel (no absolute positioning to fight). */}
      <div aria-hidden="true" className="mx-auto -mt-px h-3 w-[92%] rounded-b-xl bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_10px_24px_-8px_rgba(15,23,42,0.28)]" />
      <div aria-hidden="true" className="mx-auto mt-[3px] h-[5px] w-[34%] rounded-b-full bg-slate-400/70" />
    </div>
  );
}
