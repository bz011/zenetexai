-- ============================================================================
-- MIGRATION 001: Initial Schema (REVISED - Certification-Agnostic)
-- ============================================================================
-- This migration creates all Phase 1 tables with certification support
-- Run this FIRST after setting up Supabase project
--
-- Key changes from original:
-- 1. Renamed public.users → profiles (extends auth.users)
-- 2. Removed pmp_ table prefixes (using generic names + certification_id)
-- 3. Removed unnecessary tables: audit_logs, pmp_ai_conversations, pmp_stripe_customers
-- 4. Added certifications table (PMP is one certification)
-- 5. Simplified schema while keeping Phase 2 readiness

-- ============================================================================
-- ENUMS (Custom Types)
-- ============================================================================

CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE assessment_type AS ENUM ('checkpoint', 'module', 'mock', 'practice', 'adaptive');
CREATE TYPE assessment_attempt_status AS ENUM ('in_progress', 'submitted', 'graded');
CREATE TYPE course_progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'paused', 'expired');

-- ============================================================================
-- TABLE 1: certifications
-- ============================================================================
-- Represents different certifications the platform supports
-- Phase 1: PMP only
-- Future: CAPM, CISSP, CISM, etc.

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Certification metadata
  name VARCHAR(100) NOT NULL UNIQUE,  -- PMP, CAPM, CISSP, etc.
  code VARCHAR(20) NOT NULL UNIQUE,   -- PMP, CAPM, CISSP, etc.
  description TEXT,
  
  -- Version/Edition info
  exam_version VARCHAR(100),          -- July 2026 ECO, 7th Edition, etc.
  exam_duration_minutes INT DEFAULT 240,
  total_questions INT DEFAULT 180,
  
  -- Domain configuration (stored as JSON for flexibility)
  domains JSONB,  -- e.g., [{"name": "PEOPLE", "weight": 0.42}, ...]
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT name_not_empty CHECK (name != ''),
  CONSTRAINT code_not_empty CHECK (code != '')
);

CREATE INDEX idx_certifications_code ON certifications(code);
CREATE INDEX idx_certifications_is_active ON certifications(is_active);

-- ============================================================================
-- TABLE 2: profiles (extends auth.users)
-- ============================================================================
-- User profile data - extends Supabase's auth.users table

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email (denormalized from auth.users for convenience)
  email VARCHAR(255) NOT NULL,
  
  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  
  -- Role & Status
  role user_role NOT NULL DEFAULT 'student',
  status user_status NOT NULL DEFAULT 'active',
  
  -- Preferences
  preferred_language VARCHAR(5) DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
  
  -- Stripe integration
  stripe_customer_id VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,  -- Soft delete
  
  CONSTRAINT email_not_empty CHECK (email != ''),
  UNIQUE(email)
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_stripe ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ============================================================================
-- TABLE 3: subscriptions
-- ============================================================================
-- Student subscription/access to certifications

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES certifications(id),
  
  -- Subscription info
  status subscription_status DEFAULT 'active',
  stripe_subscription_id VARCHAR(255),
  
  -- Dates
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, certification_id),
  CONSTRAINT expires_after_started CHECK (expires_at IS NULL OR expires_at > started_at)
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_certification ON subscriptions(certification_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- TABLE 4: payments
-- ============================================================================
-- Payment records for subscription management

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Payment info
  stripe_payment_intent_id VARCHAR(255),
  amount_cents INT NOT NULL,  -- Amount in cents
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',  -- pending, succeeded, failed, cancelled
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT amount_positive CHECK (amount_cents > 0)
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================================
-- TABLE 5: courses
-- ============================================================================
-- Course structure within a certification

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  certification_id UUID NOT NULL REFERENCES certifications(id),
  
  -- Metadata (Bilingual)
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description_en TEXT,
  description_ar TEXT,
  
  -- Structure
  order_index INT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT title_not_empty CHECK (title_en != '')
);

CREATE INDEX idx_courses_certification ON courses(certification_id);
CREATE INDEX idx_courses_is_active ON courses(is_active) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE 6: modules
-- ============================================================================
-- Learning modules within a course

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Metadata (Bilingual)
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description_en TEXT,
  description_ar TEXT,
  
  -- Structure
  order_index INT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT title_not_empty CHECK (title_en != '')
);

CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_modules_is_active ON modules(is_active) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE 7: lessons
-- ============================================================================
-- Individual lessons within modules

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Metadata (Bilingual)
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description_en TEXT,
  description_ar TEXT,
  content_en TEXT,
  content_ar TEXT,
  
  -- Structure
  order_index INT,
  
  -- Media (Phase 1.5)
  video_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT title_not_empty CHECK (title_en != '')
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_is_active ON lessons(is_active) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE 8: questions
-- ============================================================================
-- Question bank (supports multiple certifications)

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  certification_id UUID NOT NULL REFERENCES certifications(id),
  
  -- Core Content (Bilingual)
  question_text_en TEXT NOT NULL,
  question_text_ar TEXT,
  
  -- Explanations (Bilingual)
  explanation_en TEXT,
  explanation_ar TEXT,
  
  -- Classification
  domain VARCHAR(100),  -- e.g., PEOPLE, PROCESS, BUSINESS_ENVIRONMENT
  subdomain VARCHAR(100),
  
  -- Question Difficulty & Type
  difficulty_level INT CHECK (difficulty_level IS NULL OR (difficulty_level >= 1 AND difficulty_level <= 5)),
  question_type VARCHAR(50) DEFAULT 'multiple_choice',  -- multiple_choice, multiple_select, fill_blank
  
  -- PMP-specific flags (Optional)
  is_predictive BOOLEAN DEFAULT FALSE,
  is_agile BOOLEAN DEFAULT FALSE,
  is_hybrid BOOLEAN DEFAULT FALSE,
  
  -- Analytics & Tracking
  times_attempted INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  average_time_to_answer_ms INT,
  discrimination_index FLOAT,
  
  -- Phase 2 AI fields (pre-built, not used in Phase 1)
  pattern_id UUID,  -- Will reference question_patterns table
  quality_score INT CHECK (quality_score IS NULL OR (quality_score >= 1 AND quality_score <= 10)),
  ai_generated BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  source VARCHAR(100),  -- official_pmi, custom, ai_generated, etc.
  created_by_user_id UUID REFERENCES profiles(id),
  reviewed_by_user_id UUID REFERENCES profiles(id),
  
  -- Status (MVP requires approval)
  status VARCHAR(50) DEFAULT 'draft',  -- draft, pending_review, approved, archived
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT question_text_not_empty CHECK (question_text_en != ''),
  CONSTRAINT explanation_or_null CHECK (explanation_en IS NULL OR explanation_en != '')
);

CREATE INDEX idx_questions_certification ON questions(certification_id);
CREATE INDEX idx_questions_domain ON questions(domain);
CREATE INDEX idx_questions_status ON questions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_pattern_id ON questions(pattern_id) WHERE pattern_id IS NOT NULL;
CREATE INDEX idx_questions_embedding ON questions USING ivfflat (embedding vector_cosine_ops
-- ============================================================================
-- TABLE 9: question_options
-- ============================================================================
-- Options for multiple-choice/multiple-select questions

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Option content (Bilingual)
  option_en VARCHAR(500) NOT NULL,
  option_ar VARCHAR(500),
  
  -- Ordering
  option_letter VARCHAR(1) NOT NULL CHECK (option_letter IN ('A', 'B', 'C', 'D', 'E')),
  
  -- Correctness
  is_correct BOOLEAN DEFAULT FALSE,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(question_id, option_letter)
);

CREATE INDEX idx_question_options_question ON question_options(question_id);

-- ============================================================================
-- TABLE 10: question_patterns (Phase 2 prep)
-- ============================================================================
-- AI pattern library for adaptive learning

CREATE TABLE IF NOT EXISTS question_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  certification_id UUID NOT NULL REFERENCES certifications(id),
  
  -- Pattern metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  domain VARCHAR(100),
  
  -- Pattern characteristics
  theme_category VARCHAR(255),
  context_description TEXT,
  common_misconceptions TEXT,
  
  -- AI metadata (Phase 2)
  embedding vector(1536),
  
  -- Status & tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(certification_id, name)
);

CREATE INDEX idx_question_patterns_certification ON question_patterns(certification_id);
CREATE INDEX idx_question_patterns_domain ON question_patterns(domain);

-- ============================================================================
-- TABLE 11: assessments
-- ============================================================================
-- Checkpoint/module/mock templates

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  certification_id UUID NOT NULL REFERENCES certifications(id),
  
  -- Metadata
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description_en TEXT,
  description_ar TEXT,
  
  -- Assessment type
  assessment_type assessment_type NOT NULL,
  
  -- Attachment (flexible linking)
  attached_to_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  attached_to_module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  
  -- Settings
  total_questions INT NOT NULL,
  time_limit_minutes INT,
  passing_score INT,
  show_answers_immediately BOOLEAN DEFAULT FALSE,
  randomize_questions BOOLEAN DEFAULT TRUE,
  randomize_options BOOLEAN DEFAULT TRUE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  created_by_user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT title_not_empty CHECK (title_en != ''),
  CONSTRAINT total_questions_positive CHECK (total_questions > 0)
);

CREATE INDEX idx_assessments_certification ON assessments(certification_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_is_active ON assessments(is_active);
CREATE INDEX idx_assessments_lesson ON assessments(attached_to_lesson_id) WHERE attached_to_lesson_id IS NOT NULL;
CREATE INDEX idx_assessments_module ON assessments(attached_to_module_id) WHERE attached_to_module_id IS NOT NULL;

-- ============================================================================
-- TABLE 12: assessment_questions
-- ============================================================================
-- Questions included in each assessment

CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  
  -- Order
  order_index INT,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(assessment_id, question_id)
);

CREATE INDEX idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX idx_assessment_questions_question ON assessment_questions(question_id);

-- ============================================================================
-- TABLE 13: assessment_attempts
-- ============================================================================
-- Student attempts at assessments (checkpoints, modules, mocks)

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Status & Results
  status assessment_attempt_status DEFAULT 'in_progress',
  questions_answered INT DEFAULT 0,
  score INT,
  passed BOOLEAN,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_taken_ms INT,
  
  -- Review
  reviewed_at TIMESTAMPTZ,
  instructor_feedback TEXT,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessment_attempts_user ON assessment_attempts(user_id);
CREATE INDEX idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX idx_assessment_attempts_status ON assessment_attempts(status);

-- ============================================================================
-- TABLE 14: assessment_answers
-- ============================================================================
-- Student answers during assessment attempts

CREATE TABLE IF NOT EXISTS assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  assessment_attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  
  -- Response
  selected_option_letter VARCHAR(1) CHECK (selected_option_letter IS NULL OR selected_option_letter IN ('A', 'B', 'C', 'D', 'E')),
  is_correct BOOLEAN,
  flagged BOOLEAN DEFAULT FALSE,
  
  -- Timing
  time_to_answer_ms INT,
  
  -- Review & Notes
  student_note TEXT,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessment_answers_attempt ON assessment_answers(assessment_attempt_id);
CREATE INDEX idx_assessment_answers_question ON assessment_answers(question_id);

-- ============================================================================
-- TABLE 15: exam_attempts
-- ============================================================================
-- Official mock exam sessions (PMP exams are 180 questions, 240 minutes)

CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  certification_id UUID NOT NULL REFERENCES certifications(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Exam info
  exam_number INT NOT NULL CHECK (exam_number >= 1 AND exam_number <= 5),  -- PMP has 5 official mocks
  
  -- Session State
  status VARCHAR(50) DEFAULT 'not_started',  -- not_started, in_progress, paused, submitted, graded
  
  -- Timing
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  duration_minutes INT DEFAULT 240,
  time_remaining_ms INT,
  
  -- Scoring
  total_questions INT DEFAULT 180,
  questions_answered INT DEFAULT 0,
  score_raw INT,
  score_percentile INT CHECK (score_percentile IS NULL OR (score_percentile >= 0 AND score_percentile <= 100)),
  passing_score INT,
  passed BOOLEAN,
  
  -- Domain Breakdown (stored as JSONB for flexibility)
  domain_scores JSONB,  -- e.g., {"PEOPLE": 85, "PROCESS": 78, "BUSINESS_ENVIRONMENT": 92}
  
  -- Review Phase
  review_started_at TIMESTAMPTZ,
  review_completed_at TIMESTAMPTZ,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(certification_id, user_id, exam_number)  -- One attempt per exam per user
);

CREATE INDEX idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_certification ON exam_attempts(certification_id);
CREATE INDEX idx_exam_attempts_status ON exam_attempts(status) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE 16: exam_attempt_questions
-- ============================================================================
-- Questions presented during exam attempt (ordered, with timing)

CREATE TABLE IF NOT EXISTS exam_attempt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  
  -- Presentation order
  question_number INT NOT NULL,  -- 1-180
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(exam_attempt_id, question_number),
  UNIQUE(exam_attempt_id, question_id)
);

CREATE INDEX idx_exam_attempt_questions_exam ON exam_attempt_questions(exam_attempt_id);

-- ============================================================================
-- TABLE 17: exam_answers
-- ============================================================================
-- Student answers during official exams

CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  
  -- Response
  selected_option_letter VARCHAR(1) CHECK (selected_option_letter IS NULL OR selected_option_letter IN ('A', 'B', 'C', 'D', 'E')),
  correct_option_letter VARCHAR(1),  -- Cached for review
  is_correct BOOLEAN,
  flagged BOOLEAN DEFAULT FALSE,
  
  -- Timing
  time_to_answer_ms INT,
  
  -- Review & AI (Phase 2)
  student_note TEXT,
  ai_explanation_requested BOOLEAN DEFAULT FALSE,
  ai_explanation TEXT,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_answers_exam ON exam_answers(exam_attempt_id);
CREATE INDEX idx_exam_answers_question ON exam_answers(question_id);

-- ============================================================================
-- TABLE 18: exam_repeat_tracking
-- ============================================================================
-- Prevents showing same question twice in same exam (max 45 repeats allowed for Phase 1)

CREATE TABLE IF NOT EXISTS exam_repeat_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  
  -- Count
  repeat_count INT DEFAULT 1,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(exam_attempt_id, question_id)
);

CREATE INDEX idx_exam_repeat_tracking_exam ON exam_repeat_tracking(exam_attempt_id);

-- ============================================================================
-- TABLE 19: course_progress
-- ============================================================================
-- Student progress through courses

CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id),
  
  -- Progress
  status course_progress_status DEFAULT 'not_started',
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Adaptive data (Phase 2)
  weak_areas JSONB,  -- e.g., ["PEOPLE", "BUSINESS_ENVIRONMENT"]
  recommended_questions JSONB,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_progress_user ON course_progress(user_id);
CREATE INDEX idx_course_progress_course ON course_progress(course_id);
CREATE INDEX idx_course_progress_status ON course_progress(status);

-- ============================================================================
-- Trigger: Auto-create profile on auth.users insert
-- ============================================================================
-- When a user signs up via Supabase Auth, create their profile automatically

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    status
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'student'::user_role,
    'active'::user_status
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
