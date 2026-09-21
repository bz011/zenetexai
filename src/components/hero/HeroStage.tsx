"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import LocaleLink from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import { HERO_CARD_POSITIONS, heroCopy, type HeroCardId } from "@/lib/heroCopy";

const ICONS: Record<HeroCardId, ReactElement> = {
  pmp: <path d="M3 9l9-4 9 4-9 4-9-4zm4 2.5V16c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5M21 9v5" />,
  simulator: <path d="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18zM9 1h6" />,
  agents: <path d="M12 3v3M7 8h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2zm2.5 5h.01M14.5 13h.01M9 21h6" />,
  data: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  ml: <path d="M6 7a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4zM12 21a2 2 0 100-4 2 2 0 000 4zM6 7l6 10M18 7l-6 10M6 5h12" />,
};

// The clip's own border is near-black navy, a few levels off the page colour. This eased fade makes that border fully transparent, and "lighten" blending then lets the page show through with no visible rectangle.
const EDGE_FADE = `linear-gradient(to right, transparent, rgba(0,0,0,.12) 4%, rgba(0,0,0,.4) 8%, rgba(0,0,0,.75) 12.5%, rgba(0,0,0,.95) 16%, #000 19%, #000 81%, rgba(0,0,0,.95) 84%, rgba(0,0,0,.75) 87.5%, rgba(0,0,0,.4) 92%, rgba(0,0,0,.12) 96%, transparent), linear-gradient(to bottom, transparent, rgba(0,0,0,.2) 4%, rgba(0,0,0,.6) 8%, rgba(0,0,0,.92) 12%, #000 15%, #000 93%, rgba(0,0,0,.4) 97%, transparent)`;
const MEDIA_STYLE = { maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in", mixBlendMode: "lighten" } as const;

type SaveDataNav = Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };

/**
 * The hero's right-hand stage: the approved cinematic brain (a pre-rendered,
 * looping, muted video) with the five service cards as real HTML links around
 * it. The poster image is what every visitor sees first; the video is only
 * fetched on desktop-sized screens, without a reduced-motion preference and
 * without data-saver, so phones and reduced-motion users never download it.
 */
export default function HeroStage() {
  const { lang } = useLang();
  const copy = heroCopy[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [videoOn, setVideoOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const conn = (navigator as SaveDataNav).connection;
    const lean = () => !!conn && (conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType ?? ""));
    let timer: number | undefined;
    let cancelled = false;
    const evaluate = () => {
      window.clearTimeout(timer);
      if (desktop.matches && !reduce.matches && !lean()) {
        timer = window.setTimeout(() => { if (!cancelled) setVideoOn(true); }, 200);
      } else {
        setVideoOn(false);
        setPlaying(false);
      }
    };
    if (document.readyState === "complete") evaluate();
    else window.addEventListener("load", evaluate, { once: true });
    desktop.addEventListener("change", evaluate);
    reduce.addEventListener("change", evaluate);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("load", evaluate);
      desktop.removeEventListener("change", evaluate);
      reduce.removeEventListener("change", evaluate);
    };
  }, []);

  // Pause while off-screen or when the visitor pauses it; resume otherwise.
  useEffect(() => {
    const v = videoRef.current;
    const stage = stageRef.current;
    if (!videoOn || !v || !stage) return;
    v.muted = true;
    let visible = true;
    const sync = () => {
      if (visible && !userPaused && !document.hidden) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.05 });
    io.observe(stage);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, [videoOn, userPaused]);

  return (
    <div ref={stageRef} className="relative w-full lg:aspect-[10/9]">
      {/* Stage art: a small still on phones, a larger still on desktop, and (desktop only) the looping video above it. */}
      <div className="pointer-events-none relative mx-auto mb-6 aspect-[1240/1040] w-full max-w-[420px] lg:absolute lg:inset-x-0 lg:bottom-0 lg:mb-0 lg:max-w-none" style={MEDIA_STYLE} data-hero-media>
        <picture>
          <source media="(min-width: 1024px)" srcSet="/hero/brain-poster.webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/brain-poster-sm.webp" alt="" width={620} height={520} decoding="async" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" data-hero-poster />
        </picture>
        {videoOn && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            aria-hidden="true"
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${playing ? "opacity-100" : "opacity-0"}`}
            data-hero-video
          >
            <source src="/hero/brain-loop.webm" type="video/webm" />
            <source src="/hero/brain-loop.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      <ul aria-label={copy.cardsLabel} className="relative grid gap-3 sm:grid-cols-2 lg:absolute lg:inset-0 lg:block">
        {copy.cards.map((card) => {
          const pos = HERO_CARD_POSITIONS[card.id];
          return (
            <li
              key={card.id}
              className={`last:sm:col-span-2 lg:absolute ${card.id === "pmp" ? "lg:w-[36%] lg:min-w-[13rem]" : "lg:w-[25%] lg:min-w-[10rem]"} lg:-translate-x-1/2 lg:-translate-y-1/2 lg:[inset-inline-start:var(--x)] lg:top-[var(--y)] lg:rtl:translate-x-1/2 lg:last:col-span-1`}
              style={{ ["--x" as string]: `${pos.x}%`, ["--y" as string]: `${pos.y}%` }}
            >
              <LocaleLink
                href={card.href}
                className="group relative flex h-full items-start gap-2 min-[1360px]:gap-2.5 rounded-2xl border border-sky-300/20 bg-gradient-to-br from-slate-900/85 to-slate-950/75 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(2,6,23,0.55)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/55 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_32px_rgba(56,189,248,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span aria-hidden="true" className="flex h-7 w-7 min-[1360px]:h-8 min-[1360px]:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400/35 to-indigo-500/25 text-sky-100 ring-1 ring-sky-300/30 shadow-[0_0_14px_rgba(56,189,248,0.35)]">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICONS[card.id]}</svg>
                </span>
                <span className="min-w-0 flex-1 pe-3 min-[1360px]:pe-4">
                  <span className="block text-small font-semibold leading-snug text-white">{card.title}</span>
                  <span className="mt-0.5 block text-small leading-snug text-slate-300 lg:hidden min-[1360px]:block">{card.desc}</span>
                </span>
                <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="absolute end-2.5 top-3 shrink-0 text-sky-200 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none">
                  <path d="M4 10h11m-4-4l4 4-4 4" />
                </svg>
              </LocaleLink>
            </li>
          );
        })}
      </ul>

      {videoOn && (
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          aria-label={userPaused ? copy.playLabel : copy.pauseLabel}
          aria-pressed={userPaused}
          className="absolute bottom-2 end-2 z-20 hidden h-9 w-9 items-center justify-center rounded-full border border-sky-300/25 bg-slate-950/60 text-sky-100/80 backdrop-blur transition hover:border-sky-300/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 lg:flex"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
            {userPaused ? <path d="M6 4l10 6-10 6V4z" /> : <path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" />}
          </svg>
        </button>
      )}
    </div>
  );
}
