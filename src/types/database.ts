/**
 * Database Types
 *
 * These are auto-generated from Supabase schema.
 * To regenerate: npx supabase gen types typescript --local > src/types/database.ts
 *
 * For now, this is a skeleton of the main types.
 * After running migrations, regenerate this file.
 */

export type UserRole = "student" | "instructor" | "admin";
export type UserStatus = "active" | "suspended" | "banned";
export type PmpDomain = "PEOPLE" | "PROCESS" | "BUSINESS_ENVIRONMENT";
export type QuestionType = "multiple_choice" | "multiple_select";
export type QuestionStatus = "draft" | "pending_review" | "approved" | "archived";
export type ExamType = 
  | "official_mock_1"
  | "official_mock_2"
  | "official_mock_3"
  | "official_mock_4"
  | "official_mock_5"
  | "practice"
  | "adaptive";
export type ExamStatus = "not_started" | "in_progress" | "paused" | "submitted" | "graded";
export type AssessmentType = "checkpoint" | "module" | "mock" | "adaptive";
export type AssessmentAttemptStatus = "in_progress" | "submitted" | "graded";
export type CourseProgressStatus = "not_started" | "in_progress" | "completed";

// ============================================================================
// User Profile
// ============================================================================

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  preferred_language: "en" | "ar";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================================================
// Questions
// ============================================================================

export interface PmpQuestion {
  id: string;
  question_text_en: string;
  question_text_ar: string | null;
  option_a_en: string;
  option_b_en: string;
  option_c_en: string;
  option_d_en: string;
  correct_answer: "A" | "B" | "C" | "D";
  option_a_ar: string | null;
  option_b_ar: string | null;
  option_c_ar: string | null;
  option_d_ar: string | null;
  explanation_en: string | null;
  explanation_ar: string | null;
  domain: PmpDomain;
  subdomain: string | null;
  difficulty_level: number | null;
  question_type: QuestionType;
  is_predictive: boolean;
  is_agile: boolean;
  is_hybrid: boolean;
  pattern_id: string | null;
  embedding: unknown | null; // vector(1536)
  similarity_score: number | null;
  quality_score: number | null;
  ai_generated: boolean;
  times_attempted: number;
  times_correct: number;
  average_time_to_answer_ms: number | null;
  discrimination_index: number | null;
  source: string | null;
  created_by_user_id: string | null;
  reviewed_by_user_id: string | null;
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================================================
// Exams
// ============================================================================

export interface PmpExam {
  id: string;
  student_id: string;
  exam_type: ExamType;
  status: ExamStatus;
  started_at: string | null;
  submitted_at: string | null;
  duration_minutes: number;
  time_remaining_ms: number | null;
  total_questions: number;
  questions_answered: number;
  score_raw: number | null;
  score_percentile: number | null;
  passing_score: number;
  passed: boolean | null;
  domain_people_score: number | null;
  domain_process_score: number | null;
  domain_business_score: number | null;
  review_started_at: string | null;
  review_completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PmpExamAnswer {
  id: string;
  exam_id: string;
  question_id: string;
  selected_answer: "A" | "B" | "C" | "D" | null;
  correct_answer: "A" | "B" | "C" | "D" | null;
  is_correct: boolean | null;
  flagged: boolean;
  time_to_answer_ms: number | null;
  student_note: string | null;
  ai_explanation_requested: boolean;
  ai_explanation_provided: string | null;
  cognitive_difficulty_estimate: number | null;
  student_ability_estimate: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Assessments
// ============================================================================

export interface PmpAssessment {
  id: string;
  name: string;
  assessment_type: AssessmentType;
  description: string | null;
  domain: PmpDomain | null;
  total_questions: number;
  question_count_people: number;
  question_count_process: number;
  question_count_business: number;
  time_limit_minutes: number | null;
  passing_score: number | null;
  show_answers_immediately: boolean;
  randomize_questions: boolean;
  randomize_options: boolean;
  status: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PmpAssessmentAttempt {
  id: string;
  assessment_id: string;
  student_id: string;
  status: AssessmentAttemptStatus;
  questions_answered: number;
  score: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  time_taken_ms: number | null;
  reviewed_at: string | null;
  instructor_feedback: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Courses
// ============================================================================

export interface PmpCourse {
  id: string;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  domain: PmpDomain | null;
  order_index: number | null;
  modules: unknown | null; // JSONB
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PmpCourseProgress {
  id: string;
  student_id: string;
  course_id: string;
  status: CourseProgressStatus;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string;
  weak_areas: unknown | null; // JSONB
  recommended_questions: unknown | null; // JSONB
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Payment
// ============================================================================

export interface PmpStripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface AuditLog {
  id: number;
  action: string;
  table_name: string;
  record_id: string | null;
  user_id: string | null;
  changes: unknown | null; // JSONB
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  created_at: string;
}
