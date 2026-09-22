"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { useLang } from "@/lib/LanguageContext";
import { heroCopy } from "@/lib/heroCopy";

// Desktop: the scene is the hero background, edge to edge, so it needs no mask. Phones get a still of the same scene whose
// edges dissolve into the page (fade classes below, switched off from lg up).
const MOBILE_FADE =
  "[mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent),linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)] [mask-composite:intersect] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent),linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)] [-webkit-mask-composite:source-in] lg:[mask-image:none] lg:[-webkit-mask-image:none]";

type SaveDataNav = Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };

/**
 * The hero's background scene: a pre-rendered, looping, muted video of the approved
 * brain and pedestal over a full-width city skyline, laid edge to edge behind the
 * real HTML text. Phones get a still of the same scene. The video is only fetched
 * on desktop-sized screens without reduced motion or data-saver.
 */
export default function HeroMedia() {
  const { lang } = useLang();
  const copy = heroCopy[lang];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [videoOn, setVideoOn] = useState(false);
  const [started, setStarted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  // React only sets `muted` as a property, never as the HTML attribute; browsers' autoplay checks want the attribute too.
  const setVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.defaultMuted = true;
      el.muted = true;
      el.playsInline = true;
    }
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const conn = (navigator as SaveDataNav).connection;
    const lean = () => !!conn && (conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType ?? ""));
    const idle = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let handle: number | undefined;
    let viaIdle = false;
    let cancelled = false;
    const clear = () => {
      if (handle === undefined) return;
      if (viaIdle) idle.cancelIdleCallback?.(handle);
      else window.clearTimeout(handle);
      handle = undefined;
    };
    const evaluate = () => {
      clear();
      if (desktop.matches && !reduce.matches && !lean()) {
        viaIdle = typeof idle.requestIdleCallback === "function";
        const run = () => { if (!cancelled) setVideoOn(true); };
        handle = viaIdle ? idle.requestIdleCallback!(run, { timeout: 600 }) : window.setTimeout(run, 100);
      } else {
        setVideoOn(false);
        setStarted(false);
        setBlocked(false);
      }
    };
    evaluate();
    desktop.addEventListener("change", evaluate);
    reduce.addEventListener("change", evaluate);
    return () => {
      cancelled = true;
      clear();
      desktop.removeEventListener("change", evaluate);
      reduce.removeEventListener("change", evaluate);
    };
  }, []);

  // Start playback (muted, inline), pause while off-screen / in a hidden tab / paused by the visitor.
  // If the browser refuses (NotAllowedError, or nothing starts within 3 s) the still poster simply stays;
  // the first real gesture (click, key, touch) then gets one more try.
  useEffect(() => {
    const v = videoRef.current;
    const stage = stageRef.current;
    if (!videoOn || !v || !stage) return;
    let visible = true;
    let gone = false;
    const attempt = () => {
      if (gone || userPaused || !visible || document.hidden) return;
      const result = v.play();
      if (result) {
        result.then(() => setBlocked(false)).catch((err: unknown) => {
          if (!gone && (err as { name?: string })?.name === "NotAllowedError") setBlocked(true);
        });
      }
    };
    const sync = () => {
      if (visible && !userPaused && !document.hidden) attempt();
      else v.pause();
    };
    const onStarted = () => { setStarted(true); setBlocked(false); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.05 });
    io.observe(stage);
    v.addEventListener("playing", onStarted);
    v.addEventListener("canplay", attempt);
    document.addEventListener("visibilitychange", sync);
    const gestures = ["pointerdown", "keydown", "touchend"] as const;
    const retry = () => { if (v.paused) attempt(); };
    gestures.forEach((g) => window.addEventListener(g, retry, { passive: true }));
    const watchdog = window.setTimeout(() => { if (!gone && v.paused && !userPaused && !document.hidden) setBlocked(true); }, 3000);
    sync();
    return () => {
      gone = true;
      window.clearTimeout(watchdog);
      io.disconnect();
      v.removeEventListener("playing", onStarted);
      v.removeEventListener("canplay", attempt);
      document.removeEventListener("visibilitychange", sync);
      gestures.forEach((g) => window.removeEventListener(g, retry));
    };
  }, [videoOn, userPaused]);

  const state = blocked && !started ? "blocked" : !videoOn ? "still" : !started ? "loading" : userPaused ? "paused" : "playing";

  return (
    <div
      ref={stageRef}
      className="pointer-events-none relative mx-auto mt-4 aspect-[800/514] w-full max-w-[600px] lg:absolute lg:inset-0 lg:mx-0 lg:mt-0 lg:aspect-auto lg:max-w-none"
      data-hero-state={state}
      data-hero-media
    >
      <div className={`absolute inset-0 rtl:-scale-x-100 ${MOBILE_FADE}`} data-hero-art>
       <div className="absolute inset-0 lg:origin-[0%_12%] xl:scale-[1.2]">
        <picture>
          <source media="(min-width: 1024px)" srcSet="/hero/brain-scene-poster.webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/brain-scene-poster-sm.webp" alt="" width={800} height={514} decoding="async" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover lg:object-[0%_35%] xl:object-[60%_35%]" data-hero-poster />
        </picture>
        {videoOn && (
          <video
            ref={setVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover lg:object-[0%_35%] xl:object-[60%_35%] transition-opacity duration-500 ${started ? "opacity-100" : "opacity-0"}`}
            data-hero-video
          >
            <source src="/hero/brain-scene.webm" type='video/webm; codecs="vp9"' />
            <source src="/hero/brain-scene.mp4" type="video/mp4" />
          </video>
        )}
       </div>
      </div>

      {/* Soft dark wash behind the text column (desktop): keeps the copy readable while the towers stay visible through it. */}
      <div aria-hidden="true" className="absolute inset-y-0 hidden w-[66%] bg-[linear-gradient(to_right,rgba(6,11,24,.44),rgba(6,11,24,.35)_46%,rgba(6,11,24,.1)_74%,transparent)] [inset-inline-start:0] rtl:bg-[linear-gradient(to_left,rgba(6,11,24,.44),rgba(6,11,24,.35)_46%,rgba(6,11,24,.1)_74%,transparent)] lg:block" />

      {videoOn && started && (
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          aria-label={userPaused ? copy.playLabel : copy.pauseLabel}
          aria-pressed={userPaused}
          className="pointer-events-auto absolute bottom-48 z-20 hidden h-8 w-8 items-center justify-center rounded-full border border-sky-300/20 bg-slate-950/40 text-sky-100/70 opacity-0 backdrop-blur-sm transition-opacity duration-200 [inset-inline-end:1.5rem] hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 group-hover/hero:opacity-70 group-hover/hero:hover:opacity-100 lg:flex"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
            {userPaused ? <path d="M6 4l10 6-10 6V4z" /> : <path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" />}
          </svg>
        </button>
      )}
    </div>
  );
}
