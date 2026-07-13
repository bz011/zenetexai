"use client";

import { useEffect, useRef } from "react";
import type { VideoProvider } from "@/features/courses/types/course";

interface Props {
  provider: VideoProvider;
  url: string | null;
  placeholderLabel: string;
  /** Called repeatedly while the video is actively playing, so a passive-watching student (no mouse/keyboard input) still registers as active study time. */
  onActivity?: () => void;
}

const PLAYING_PING_MS = 10_000;

function withJsApiEnabled(provider: VideoProvider, url: string): string {
  try {
    const parsed = new URL(url);
    if (provider === "youtube" && !parsed.searchParams.has("enablejsapi")) {
      parsed.searchParams.set("enablejsapi", "1");
    }
    if (provider === "vimeo" && !parsed.searchParams.has("api")) {
      parsed.searchParams.set("api", "1");
    }
    return parsed.toString();
  } catch {
    return url; // malformed URL - fall back to the raw value, same as before this feature existed
  }
}

/**
 * Detects real play state via each provider's postMessage API (works
 * cross-origin, unlike DOM events which never bubble out of an iframe) and
 * calls onActivity while playing. Best-effort: if a provider ever changes
 * its undocumented postMessage shape, this silently stops pinging rather
 * than throwing - passive video time would then only count via whatever
 * mouse/keyboard activity the student also happens to generate, matching
 * pre-existing behavior, not a regression.
 */
export default function VideoEmbed({ provider, url, placeholderLabel, onActivity }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (provider === "none" || !url || !onActivity) return;

    function startPinging() {
      if (pingIntervalRef.current) return;
      onActivity?.();
      pingIntervalRef.current = setInterval(() => onActivity?.(), PLAYING_PING_MS);
    }
    function stopPinging() {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    }

    function handleMessage(event: MessageEvent) {
      if (typeof event.data !== "string") return;
      let payload: { event?: string; info?: unknown } | null = null;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!payload || typeof payload !== "object") return;

      if (provider === "youtube") {
        const state = typeof payload.info === "number" ? payload.info : (payload.info as { playerState?: number } | undefined)?.playerState;
        if (state === 1) startPinging(); // 1 = playing
        else if (state === 2 || state === 0) stopPinging(); // 2 = paused, 0 = ended
      }
      if (provider === "vimeo") {
        if (payload.event === "play") startPinging();
        if (payload.event === "pause" || payload.event === "ended") stopPinging();
      }
    }

    window.addEventListener("message", handleMessage);

    // Vimeo requires an explicit subscription handshake before it emits play/pause events.
    if (provider === "vimeo") {
      const iframe = iframeRef.current;
      const subscribe = () => {
        iframe?.contentWindow?.postMessage(JSON.stringify({ method: "addEventListener", value: "play" }), "*");
        iframe?.contentWindow?.postMessage(JSON.stringify({ method: "addEventListener", value: "pause" }), "*");
      };
      iframe?.addEventListener("load", subscribe);
      return () => {
        iframe?.removeEventListener("load", subscribe);
        window.removeEventListener("message", handleMessage);
        stopPinging();
      };
    }

    return () => {
      window.removeEventListener("message", handleMessage);
      stopPinging();
    };
  }, [provider, url, onActivity]);

  if (provider === "none" || !url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
        <p className="text-[13px] text-slate-500">{placeholderLabel}</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/[0.06] bg-black">
      <iframe
        ref={iframeRef}
        src={withJsApiEnabled(provider, url)}
        title="Lesson video"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
