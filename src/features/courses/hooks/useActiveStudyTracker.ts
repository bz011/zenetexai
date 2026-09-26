"use client";

/**
 * Real active-time tracking, not page-open duration. Accumulates wall-clock
 * time only while the tab is visible AND there has been a qualifying
 * activity signal within INACTIVITY_TIMEOUT_MS - mouse movement, keyboard
 * input, scrolling, touch, or an explicit external signal (video playback,
 * quiz interaction) via the returned `markActive()` function. Flushes
 * accumulated whole seconds to the server periodically and on unmount/tab
 * hide, via the increment_study_time RPC (see studyTimeService.ts).
 *
 * Mouse/keyboard/scroll listeners already capture quiz interaction for free
 * (selecting an option, dragging a reorder button, typing in a matching
 * select are themselves mouse/keyboard events on this page). Video playback
 * is the one activity source that does NOT reach these listeners on its
 * own - a cross-origin YouTube/Vimeo iframe is a separate browsing context,
 * so clicks inside it never bubble to this document. VideoEmbed.tsx
 * integrates each provider's postMessage player API and calls the
 * `markActive` this hook returns whenever the video is actively playing,
 * so passive video-watching (no mouse movement for the timeout window)
 * still counts as active study time.
 */

import { useEffect, useRef, useCallback } from "react";
import { recordStudyTime } from "@/features/courses/services/studyTimeService";

const INACTIVITY_TIMEOUT_MS = 60_000;
const SAMPLE_INTERVAL_MS = 5_000;
const FLUSH_INTERVAL_MS = 30_000;

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;

export function useActiveStudyTracker() {
  const lastActivityRef = useRef(Date.now());
  const accumulatedMsRef = useRef(0);
  const lastSampleRef = useRef(Date.now());

  const markActive = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    function flush() {
      const seconds = Math.floor(accumulatedMsRef.current / 1000);
      if (seconds > 0) {
        accumulatedMsRef.current -= seconds * 1000;
        void recordStudyTime(seconds);
      }
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

    const sampleInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastSampleRef.current;
      lastSampleRef.current = now;

      const isActive = document.visibilityState === "visible" && now - lastActivityRef.current < INACTIVITY_TIMEOUT_MS;
      if (isActive) {
        accumulatedMsRef.current += elapsed;
      }
    }, SAMPLE_INTERVAL_MS);

    const flushInterval = setInterval(flush, FLUSH_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
      else lastSampleRef.current = Date.now();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
      clearInterval(sampleInterval);
      clearInterval(flushInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flush();
    };
  }, [markActive]);

  return { markActive };
}
