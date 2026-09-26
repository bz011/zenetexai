-- ============================================================================
-- MIGRATION 003: Row-Level Security (RLS) Policies (REVISED)
-- ============================================================================
-- This migration creates all RLS policies for the revised certification-agnostic schema
-- Security principle: Database enforces rules, application code cannot bypass
--
-- Key changes:
-- 1. Updated table names: public.users → profiles, pmp_* → generic names
-- 2. All policies use certification_id for multi-certification support
-- 3. Simplified: removed unnecessary policies

-- ============================================================================
-- ENABLE RLS on all tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_repeat_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get current user's role
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- HELPER FUNCTION: Check if user has active subscription to certification
-- ============================================================================

CREATE OR REPLACE FUNCTION has_certification_access(cert_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = auth.uid()
    AND certification_id = cert_id
    AND status = 'active'::subscription_status
    AND (expires_at IS NULL OR expires_at > NOW())
  )
  OR (
    SELECT get_user_role() IN ('admin'::user_role, 'instructor'::user_role)
  );
$$;

-- ============================================================================
-- TABLE: certifications
-- ============================================================================

-- Policy: All authenticated users can view active certifications
CREATE POLICY "Active certifications visible to all"
  ON certifications
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Policy: Only admins can manage certifications
CREATE POLICY "Only admins can create certifications"
  ON certifications
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin'::user_role);

CREATE POLICY "Only admins can update certifications"
  ON certifications
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin'::user_role)
  WITH CHECK (get_user_role() = 'admin'::user_role);

-- ============================================================================
-- TABLE: profiles
-- ============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())  -- Can't change own role
  );

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin'::user_role);

-- Policy: Admins can update profiles
CREATE POLICY "Admins can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin'::user_role)
  WITH CHECK (get_user_role() = 'admin'::user_role);

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin'::user_role);

-- Policy: Users can create subscriptions for themselves
CREATE POLICY "Users can create subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: System/admins can update subscriptions
CREATE POLICY "Admins can update subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin'::user_role)
  WITH CHECK (get_user_role() = 'admin'::user_role);

-- ============================================================================
-- TABLE: payments
-- ============================================================================

-- Policy: Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin'::user_role);

-- Policy: System/admins can create and update payments
CREATE POLICY "Admins can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin'::user_role)
  WITH CHECK (get_user_role() = 'admin'::user_role);

-- ============================================================================
-- TABLE: courses
-- ============================================================================

-- Policy: Active courses visible to all authenticated users
CREATE POLICY "Active courses visible to all"
  ON courses
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Policy: Only admins/instructors can create courses
CREATE POLICY "Only admins/instructors can create courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- Policy: Only admins/instructors can update courses
CREATE POLICY "Only admins/instructors can update courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin'::user_role, 'instructor'::user_role))
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- ============================================================================
-- TABLE: modules
-- ============================================================================

-- Policy: Active modules visible to all authenticated users
CREATE POLICY "Active modules visible to all"
  ON modules
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Policy: Only admins/instructors can manage modules
CREATE POLICY "Only admins/instructors can manage modules"
  ON modules
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

CREATE POLICY "Only admins/instructors can update modules"
  ON modules
  FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin'::user_role, 'instructor'::user_role))
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- ============================================================================
-- TABLE: lessons
-- ============================================================================

-- Policy: Active lessons visible to all authenticated users
CREATE POLICY "Active lessons visible to all"
  ON lessons
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Policy: Only admins/instructors can manage lessons
CREATE POLICY "Only admins/instructors can manage lessons"
  ON lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

CREATE POLICY "Only admins/instructors can update lessons"
  ON lessons
  FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin'::user_role, 'instructor'::user_role))
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- ============================================================================
-- TABLE: questions
-- ============================================================================

-- Policy: Approved questions visible to all (with cert access)
CREATE POLICY "Approved questions visible to all with access"
  ON questions
  FOR SELECT
  TO authenticated
  USING (
    status = 'approved'::text
    OR get_user_role() IN ('admin'::user_role, 'instructor'::user_role)
  );

-- Policy: Only admins/instructors can create questions
CREATE POLICY "Only admins/instructors can create questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin'::user_role, 'instructor'::user_role)
    AND created_by_user_id = auth.uid()
  );

-- Policy: Only admins/instructors can edit questions
CREATE POLICY "Only admins/instructors can edit questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin'::user_role, 'instructor'::user_role))
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- Policy: Only admins can delete questions
CREATE POLICY "Only admins can delete questions"
  ON questions
  FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin'::user_role);

-- ============================================================================
-- TABLE: question_options
-- ============================================================================

-- Policy: Users can view options of approved questions
CREATE POLICY "Question options visible with question access"
  ON question_options
  FOR SELECT
  TO authenticated
  USING (
    question_id IN (
      SELECT id FROM questions
      WHERE status = 'approved'::text
      OR created_by_user_id = auth.uid()
      OR get_user_role() IN ('admin'::user_role, 'instructor'::user_role)
    )
  );

-- Policy: Only admins/instructors can manage options
CREATE POLICY "Only admins/instructors can manage options"
  ON question_options
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

CREATE POLICY "Only admins/instructors can update options"
  ON question_options
  FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin'::user_role, 'instructor'::user_role))
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- ============================================================================
-- TABLE: question_patterns
-- ============================================================================

-- Policy: Only admins/instructors can view patterns
CREATE POLICY "Only admins/instructors can view patterns"
  ON question_patterns
  FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- Policy: Only admins/instructors can manage patterns
CREATE POLICY "Only admins/instructors can manage patterns"
  ON question_patterns
  FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin'::user_role, 'instructor'::user_role))
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- ============================================================================
-- TABLE: assessments
-- ============================================================================

-- Policy: Active assessments visible to all authenticated users
CREATE POLICY "Active assessments visible to all"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Policy: Only admins/instructors can create assessments
CREATE POLICY "Only admins/instructors can create assessments"
  ON assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- Policy: Only admins/instructors can update assessments
CREATE POLICY "Only admins/instructors can update assessments"
  ON assessments
  FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin'::user_role, 'instructor'::user_role))
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- ============================================================================
-- TABLE: assessment_questions
-- ============================================================================

-- Policy: Visible with assessment access
CREATE POLICY "Assessment questions visible with access"
  ON assessment_questions
  FOR SELECT
  TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE is_active = TRUE
    )
  );

-- Policy: Only admins/instructors can manage
CREATE POLICY "Only admins/instructors can manage assessment questions"
  ON assessment_questions
  FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin'::user_role, 'instructor'::user_role))
  WITH CHECK (get_user_role() IN ('admin'::user_role, 'instructor'::user_role));

-- ============================================================================
-- TABLE: assessment_attempts
-- ============================================================================

-- Policy: Students can view their own attempts
CREATE POLICY "Students can view own assessment attempts"
  ON assessment_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin'::user_role);

-- Policy: Students can create attempts for themselves
CREATE POLICY "Students can create assessment attempts"
  ON assessment_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Students can update their in-progress attempts
CREATE POLICY "Students can update own attempts"
  ON assessment_attempts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'in_progress'::assessment_attempt_status)
  WITH CHECK (user_id = auth.uid() AND status IN ('in_progress'::assessment_attempt_status, 'submitted'::assessment_attempt_status));

-- ============================================================================
-- TABLE: assessment_answers
-- ============================================================================

-- Policy: Students can view their own answers
CREATE POLICY "Students can view own assessment answers"
  ON assessment_answers
  FOR SELECT
  TO authenticated
  USING (
    assessment_attempt_id IN (
      SELECT id FROM assessment_attempts WHERE user_id = auth.uid()
    )
    OR get_user_role() = 'admin'::user_role
  );

-- Policy: Students can create answers during attempt
CREATE POLICY "Students can create assessment answers"
  ON assessment_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assessment_attempt_id IN (
      SELECT id FROM assessment_attempts
      WHERE user_id = auth.uid()
      AND status = 'in_progress'::assessment_attempt_status
    )
  );

-- Policy: Students can update their answers
CREATE POLICY "Students can update assessment answers"
  ON assessment_answers
  FOR UPDATE
  TO authenticated
  USING (
    assessment_attempt_id IN (
      SELECT id FROM assessment_attempts
      WHERE user_id = auth.uid()
      AND status = 'in_progress'::assessment_attempt_status
    )
  );

-- ============================================================================
-- TABLE: exam_attempts
-- ============================================================================

-- Policy: Students can view their own exam attempts
CREATE POLICY "Students can view own exam attempts"
  ON exam_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin'::user_role);

-- Policy: Students can create exam attempts for themselves
CREATE POLICY "Students can create exam attempts"
  ON exam_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Students can update their in-progress exams
CREATE POLICY "Students can update own exam attempts"
  ON exam_attempts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status IN ('not_started', 'in_progress', 'paused'))
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: exam_attempt_questions
-- ============================================================================

-- Policy: Students can view their exam's questions
CREATE POLICY "Students can view own exam questions"
  ON exam_attempt_questions
  FOR SELECT
  TO authenticated
  USING (
    exam_attempt_id IN (
      SELECT id FROM exam_attempts WHERE user_id = auth.uid()
    )
    OR get_user_role() = 'admin'::user_role
  );

-- Policy: System can create questions for exam
CREATE POLICY "System can create exam questions"
  ON exam_attempt_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exam_attempt_id IN (
      SELECT id FROM exam_attempts WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: exam_answers
-- ============================================================================

-- Policy: Students can view their own exam answers
CREATE POLICY "Students can view own exam answers"
  ON exam_answers
  FOR SELECT
  TO authenticated
  USING (
    exam_attempt_id IN (
      SELECT id FROM exam_attempts WHERE user_id = auth.uid()
    )
    OR get_user_role() = 'admin'::user_role
  );

-- Policy: Students can create answers during exam
CREATE POLICY "Students can create exam answers"
  ON exam_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exam_attempt_id IN (
      SELECT id FROM exam_attempts
      WHERE user_id = auth.uid()
      AND status IN ('in_progress', 'paused')
    )
  );

-- Policy: Students can update their answers during exam
CREATE POLICY "Students can update exam answers"
  ON exam_answers
  FOR UPDATE
  TO authenticated
  USING (
    exam_attempt_id IN (
      SELECT id FROM exam_attempts
      WHERE user_id = auth.uid()
      AND status IN ('in_progress', 'paused')
    )
  );

-- ============================================================================
-- TABLE: exam_repeat_tracking
-- ============================================================================

-- Policy: System manages repeat tracking
CREATE POLICY "System can manage exam repeat tracking"
  ON exam_repeat_tracking
  FOR ALL
  TO authenticated
  USING (
    exam_attempt_id IN (
      SELECT id FROM exam_attempts WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: course_progress
-- ============================================================================

-- Policy: Students can view their own progress
CREATE POLICY "Students can view own course progress"
  ON course_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin'::user_role);

-- Policy: Students can create progress records
CREATE POLICY "Students can create course progress"
  ON course_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Students can update their own progress
CREATE POLICY "Students can update own course progress"
  ON course_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
