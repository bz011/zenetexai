-- ============================================================================
-- MIGRATION 028: Course completion certificates
-- ============================================================================
-- New, dedicated table for student course-completion certificates (ZentexAI
-- Academy "Certificate of Completion" — explicitly NOT a PMP/PMI exam
-- certification). The existing `certifications` table (migrations 001/007)
-- is exam-body metadata (PMP/CAPM/etc. name+code+domains, used by the
-- question bank) and is unrelated to this — reusing it would conflate two
-- different concepts, so this migration adds a new table instead.
--
-- Eligibility (all published course lessons completed + every module quiz
-- passed at least once + an active course entitlement) is computed and
-- enforced entirely in application code (certificateService.ts) at
-- issuance time, using the service-role client so a client can never forge
-- eligibility. This table only PERSISTS the result of that check — a
-- one-time, point-in-time record — so a certificate, once issued, keeps
-- representing "complete as of issued_at" even if a later quiz retake
-- fails, lesson content changes, or passing_score config changes. There is
-- deliberately no re-check on read.
--
-- student_name is a SNAPSHOT of the student's display name at issuance
-- time (not a live join to profiles), for the same point-in-time reasoning
-- as issued_at: a certificate already issued must not silently change if
-- the student edits their profile name afterward.
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- e.g. "ZTX-PMP-2026-A1B2C3D4" — the public, unguessable identifier used
  -- by the public verification page. Never derived from a sequential id.
  certificate_number TEXT NOT NULL UNIQUE,

  -- Snapshot at issuance — see header comment. Never blank (certificateService
  -- refuses to issue without a usable name).
  student_name TEXT NOT NULL CHECK (student_name != ''),

  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One certificate per (user, course), ever. This is the idempotency
  -- backstop: certificateService does an application-level existence check
  -- first, but this constraint is what makes a concurrent double-issuance
  -- request safe even under a race (INSERT ... ON CONFLICT DO NOTHING).
  CONSTRAINT course_certificates_user_course_unique UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_certificates_user ON course_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_course ON course_certificates(course_id);
-- certificate_number already has a unique index from the UNIQUE constraint
-- above; the public verification lookup uses that automatically.

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Reuses get_user_role() (migration 003/005) — do not redefine it here.

ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;

-- Students read only their own certificate; admins/instructors read all
-- (support/verification tooling). No policy grants a student visibility
-- into another student's row.
DROP POLICY IF EXISTS "Users view own certificate" ON course_certificates;
CREATE POLICY "Users view own certificate"
  ON course_certificates FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() IN ('admin', 'instructor'));

-- Deliberately NO INSERT/UPDATE/DELETE policy for `authenticated`, on
-- purpose — exactly the same pattern as learning_assessment_answer_key
-- (migration 006): a certificate is a server-verified, point-in-time
-- record of eligibility, never something a client (including the owning
-- student) can create or edit directly. All writes go through
-- certificateService.ts using the service-role client, which independently
-- re-verifies entitlement + lesson completion + quiz passes server-side
-- before ever inserting a row — a client can never forge eligibility by
-- calling this table directly, because it simply has no write access to it
-- at all.
--
-- The public verification page (/verify/[certificateNumber]) does NOT get
-- an RLS policy either — it reads via a server-side function
-- (certificateService.getPublicCertificateByNumber) using the service-role
-- client, which returns only the small, explicitly whitelisted set of
-- public-safe fields (student_name, course title, issued_at,
-- certificate_number) to the page. This avoids ever needing an `anon`-role
-- SELECT policy on this table, which would otherwise risk exposing
-- user_id or other columns to an unauthenticated caller querying the
-- table directly via the REST API.

-- ============================================================================
-- END OF MIGRATION 028
-- ============================================================================
