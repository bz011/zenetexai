import Logo from "@/components/brand/Logo";

interface Props {
  caption: string;
  className?: string;
}

/**
 * The Academy hero's product visual: a plain laptop mockup (CSS chrome, no
 * photo asset) framing a placeholder screen - the ZentexAI mark on a soft
 * brand gradient, plus the real course name as a caption.
 *
 * This is a placeholder, not an invented product screenshot: no fabricated
 * sidebar, video player, or course UI is drawn inside the screen. Swap the
 * screen's contents for a real screenshot of the lesson player
 * (/courses/[slug]/lessons/[lessonId]) once one exists - see the
 * accompanying report for exactly what to capture.
 */
export default function AcademyHeroVisual({ caption, className = "" }: Props) {
  return (
    <div className={`relative mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[560px] ${className}`}>
      <div aria-hidden="true" className="absolute inset-0 -z-10 scale-125 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.16),transparent_70%)] blur-2xl" />

      {/* Screen */}
      <div className="relative rounded-[7%] bg-gradient-to-b from-slate-700 to-slate-800 p-[3%] shadow-[0_35px_70px_-25px_rgba(15,23,42,0.35)]">
        <div aria-hidden="true" className="absolute left-1/2 top-[1.6%] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-slate-600" />
        <div className="aspect-[16/10] w-full overflow-hidden rounded-[4%] bg-gradient-to-br from-indigo-50 via-white to-sky-50">
          <div className="flex h-full flex-col items-center justify-center gap-4 p-[8%] text-center">
            <Logo variant="icon" tone="light" className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14" />
            <span className="text-[11px] font-medium text-slate-500 sm:text-[13px]">{caption}</span>
          </div>
        </div>
      </div>

      {/* Base / hinge - plain flow, directly under the bezel (no absolute positioning to fight). */}
      <div aria-hidden="true" className="mx-auto -mt-px h-3 w-[92%] rounded-b-xl bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_10px_24px_-8px_rgba(15,23,42,0.28)]" />
      <div aria-hidden="true" className="mx-auto mt-[3px] h-[5px] w-[34%] rounded-b-full bg-slate-400/70" />
    </div>
  );
}
