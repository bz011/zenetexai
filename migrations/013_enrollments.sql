-- ============================================================================
-- MIGRATION 013: Enrollments (Sprint 7.5 — Alpha Polish & Launch Readiness)
-- ============================================================================
-- Replaces the "Contact Us to enroll" flow with a real, self-service
-- enrollment record per (user, course).
--
-- Deliberately NOT a paywall: migration 006 already made published
-- courses/modules/lessons visible to any authenticated user ("no paywall
-- yet, per Sprint 3 scope") and that has not changed here. This table
-- exists to track enrollment intent/status so there is a real record
-- instead of an email, and so a future Stripe integration has somewhere to
-- write to — it does not gate content access.
--
-- Payment integration is explicitly deferred (per Sprint 7.5 scope), so
-- status defaults straight to 'active' on insert: an alpha user who clicks
-- Enroll gets immediate confirmation, matching how course access already
-- works. When Stripe is added, the insert path changes to create a
-- 'pending' row that a webhook flips to 'active' after payment succeeds —
-- the shape below (status enum + nullable payment columns) is already
-- ready for that without a further migration.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('pending', 'active', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  status enrollment_status NOT NULL DEFAULT 'active',

  -- Unused until a payment sprint wires them up; present now so that sprint
  -- is a code change, not another schema migration.
  payment_provider TEXT,
  payment_reference TEXT,

  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

DROP TRIGGER IF EXISTS set_enrollments_updated_at ON enrollments;
CREATE TRIGGER set_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Same "users manage their own rows, admins see everything" shape as
-- lesson_progress/practice_sessions. No UPDATE/DELETE policy for
-- `authenticated` — status transitions (e.g. cancellation, or the future
-- pending -> active payment webhook) are an admin/service-role action, not
-- something a student can do to their own row directly.

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own enrollments" ON enrollments;
CREATE POLICY "Users view own enrollments"
  ON enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Users create own enrollments" ON enrollments;
CREATE POLICY "Users create own enrollments"
  ON enrollments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage enrollments" ON enrollments;
CREATE POLICY "Admins manage enrollments"
  ON enrollments FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================================
-- END OF MIGRATION 013
-- ============================================================================
