"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { useLang } from "@/lib/LanguageContext";
import { heroCopy } from "@/lib/heroCopy";

// The clip's own border is near-black navy with blue city haze, a few levels off the page colour. Wide, eased fades on the
// sides and top (and a short one on the dark floor at the bottom) make every edge fully transparent, so nothing reads as a
// box, while the brain and the pedestal stay in the solid core; "lighten" blending lets the page show through the dark parts.
const EDGE_FADE = "linear-gradient(to right, transparent, rgba(0,0,0,.12) 4%, rgba(0,0,0,.4) 9%, rgba(0,0,0,.75) 14%, rgba(0,0,0,.95) 19%, #000 24%, #000 80%, rgba(0,0,0,.95) 84%, rgba(0,0,0,.75) 88%, rgba(0,0,0,.4) 92%, rgba(0,0,0,.12) 96%, transparent), linear-gradient(to bottom, transparent, rgba(0,0,0,.2) 4%, rgba(0,0,0,.6) 8%, rgba(0,0,0,.92) 13%, #000 18%, #000 92%, rgba(0,0,0,.5) 96.5%, transparent)";
const MEDIA_STYLE = { maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in", mixBlendMode: "lighten" } as const;

type SaveDataNav = Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };

/**
 * The hero's cinematic brain: a pre-rendered, looping, muted video laid into the
 * hero background (no box: an elliptical fade and lighten blending). The poster image is what every visitor sees first; the video is only
 * fetched on desktop-sized screens, without a reduced-motion preference and
 * without data-saver, so phones and reduced-motion users never download it.
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
      className="group pointer-events-none relative mx-auto mt-2 aspect-[1240/1040] w-full max-w-[440px] lg:pointer-events-auto lg:mx-0 lg:mt-0 lg:ms-auto lg:-me-[6%] lg:w-[min(118%,calc((100svh-15rem)*1.19))] lg:min-w-[34rem] lg:max-w-none"
      data-hero-state={state}
      data-hero-media
    >
      <div className="pointer-events-none absolute inset-0" style={MEDIA_STYLE}>
        <picture>
          <source media="(min-width: 1024px)" srcSet="/hero/brain-poster.webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/brain-poster-sm.webp" alt="" width={620} height={520} decoding="async" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" data-hero-poster />
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
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${started ? "opacity-100" : "opacity-0"}`}
            data-hero-video
          >
            <source src="/hero/brain-loop.webm" type='video/webm; codecs="vp9"' />
            <source src="/hero/brain-loop.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {videoOn && started && (
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          aria-label={userPaused ? copy.playLabel : copy.pauseLabel}
          aria-pressed={userPaused}
          className="pointer-events-auto absolute bottom-[7%] end-[10%] z-20 hidden h-8 w-8 items-center justify-center rounded-full border border-sky-300/20 bg-slate-950/40 text-sky-100/70 opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 group-hover:opacity-70 group-hover:hover:opacity-100 lg:flex"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
            {userPaused ? <path d="M6 4l10 6-10 6V4z" /> : <path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" />}
          </svg>
        </button>
      )}
    </div>
  );
}
