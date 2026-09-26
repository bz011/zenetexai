-- ============================================================================
-- MIGRATION 010: Active Study Time Tracking (Sprint 6 follow-up)
-- ============================================================================
-- Replaces the placeholder "Total Study Time" metric (which summed lessons'
-- authored duration_minutes - a nominal video length, not measured
-- engagement) with real active-time tracking based on client-observed user
-- activity (mouse/keyboard/scroll/touch on the page, plus real video
-- play-state via the provider's postMessage API - see
-- useActiveStudyTracker.ts and VideoEmbed.tsx), gated by a client-side
-- inactivity timeout so idle tabs don't accumulate time.
--
-- One row per (student, calendar day), incremented in small heartbeat
-- amounts rather than replaced, so a page refresh or multiple tabs never
-- lose or double-count time the way a single "session end" write would.
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_study_time (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  active_seconds INT NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, study_date)
);

CREATE INDEX IF NOT EXISTS idx_student_study_time_user ON student_study_time(user_id);

DROP TRIGGER IF EXISTS set_student_study_time_updated_at ON student_study_time;
CREATE TRIGGER set_student_study_time_updated_at
  BEFORE UPDATE ON student_study_time
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE student_study_time ENABLE ROW LEVEL SECURITY;

-- Owner-only, same as student_lesson_notes - no admin/instructor bypass.
-- Reads happen through this policy directly (the dashboard uses the normal
-- RLS-respecting client); writes only ever happen through the RPC below.
DROP POLICY IF EXISTS "Users view own study time" ON student_study_time;
CREATE POLICY "Users view own study time"
  ON student_study_time FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- RPC: increment_study_time(p_seconds)
-- ============================================================================
-- The ONLY write path for this table. Unlike every other RPC in this
-- project, this one IS callable directly by an authenticated student's own
-- RLS-respecting session (not service-role-only) - it's safe to expose
-- because it takes no user_id parameter at all (always auth.uid()) and
-- clamps the per-call increment to a small sane bound matching the
-- client's heartbeat cadence, so even a malicious client repeating this
-- call in a loop can only ever inflate their OWN stats, not anyone else's,
-- and not by an unbounded amount per call. This is a UX telemetry metric,
-- not a security- or grading-sensitive value - the bound is a sanity clamp,
-- not an anti-cheat guarantee.
CREATE OR REPLACE FUNCTION increment_study_time(p_seconds INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF p_seconds IS NULL OR p_seconds <= 0 OR p_seconds > 120 THEN
    RETURN;
  END IF;

  INSERT INTO student_study_time (user_id, study_date, active_seconds)
  VALUES (auth.uid(), CURRENT_DATE, p_seconds)
  ON CONFLICT (user_id, study_date) DO UPDATE
    SET active_seconds = student_study_time.active_seconds + EXCLUDED.active_seconds;
END;
$$;

REVOKE ALL ON FUNCTION increment_study_time(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_study_time(INT) TO authenticated;

-- ============================================================================
-- END OF MIGRATION 010
-- ============================================================================
