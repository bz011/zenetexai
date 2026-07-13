export type VideoProvider = "youtube" | "vimeo" | "none";
export type LearningAssessmentType = "checkpoint" | "module_assessment";

export interface Course {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  cover_image_url: string | null;
  order_index: number;
  is_published: boolean;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  order_index: number;
  is_published: boolean;
}

export interface Lesson {
  id: string;
  module_id: string;
  title_en: string;
  title_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  video_provider: VideoProvider;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_published: boolean;
}

export interface LearningAssessment {
  id: string;
  type: LearningAssessmentType;
  lesson_id: string | null;
  module_id: string | null;
  title_en: string;
  title_ar: string | null;
  passing_score: number;
  order_index: number;
  is_published: boolean;
}

/** Module or course with lessons annotated with the current user's completion. */
export interface ModuleWithLessons extends CourseModule {
  lessons: (Lesson & { completed: boolean })[];
  moduleAssessment: LearningAssessment | null;
}

export interface CourseWithProgress extends Course {
  modules: ModuleWithLessons[];
  totalLessons: number;
  completedLessons: number;
}

// ============================================================================
// Learning Quiz Experience (Sprint 6) — unified across legacy per-assessment
// questions and bank-linked questions (migration 007's 6 interaction types).
// A single QuizQuestion shape means QuizRunner never needs to know which
// source a question came from; quizService.ts is the only place that cares.
// ============================================================================

export type QuizSource = "legacy" | "bank";
export type QuestionInteractionTypeValue = "standard" | "graphic_based" | "matching" | "drag_and_drop" | "hotspot";
export type QuestionAnswerTypeValue = "single" | "multiple_response";

export interface QuizOption {
  id: string;
  textEn: string;
  textAr: string | null;
}

export interface QuizImage {
  imagePath: string;
  altEn: string | null;
  altAr: string | null;
}

export interface QuizMatchingItem {
  id: string;
  textEn: string;
  textAr: string | null;
}

export interface QuizDragDropItem {
  id: string;
  textEn: string;
  textAr: string | null;
  category: string | null;
}

/** Question shape sent to the client — deliberately has no correctness info,
 * regardless of source (never option is_correct, never matching/drag-drop
 * answer keys, never hotspot coordinates). */
export interface QuizQuestion {
  id: string;
  source: QuizSource;
  interactionType: QuestionInteractionTypeValue;
  answerType: QuestionAnswerTypeValue;
  orderIndex: number;
  questionTextEn: string;
  questionTextAr: string | null;
  options: QuizOption[];
  images: QuizImage[];
  matchingLeft: QuizMatchingItem[];
  matchingRight: QuizMatchingItem[];
  dragDropItems: QuizDragDropItem[];
}

export interface QuizSubmitAnswer {
  questionId: string;
  source: QuizSource;
  selectedOptionIds?: string[];
  matchingPairs?: { leftItemId: string; rightItemId: string }[];
  dragDropOrder?: string[];
  /** Normalized 0-100 position relative to the hotspot image's natural dimensions. */
  hotspotClick?: { xPct: number; yPct: number };
}

export interface QuizQuestionResult {
  questionId: string;
  isCorrect: boolean;
  explanationEn: string | null;
  explanationAr: string | null;
}

export interface QuizSubmitResult {
  success: boolean;
  attemptId?: string;
  score?: number;
  passed?: boolean;
  results?: QuizQuestionResult[];
  error?: string;
}

export interface StudentLessonNote {
  lessonId: string;
  noteText: string;
  updatedAt: string | null;
}

export interface ContinueLearningInfo {
  courseSlug: string;
  courseTitleEn: string;
  courseTitleAr: string | null;
  lessonId: string;
  lessonTitleEn: string;
  lessonTitleAr: string | null;
  lastVisitedAt: string;
}

export interface DashboardStats {
  totalLessons: number;
  completedLessons: number;
  totalModules: number;
  completedModules: number;
  totalCourses: number;
  completedCourses: number;
  overallProgressPct: number;
  quizzesAttempted: number;
  quizzesPassed: number;
  studyStreakDays: number;
  totalStudyMinutes: number;
}

/** Past attempt, listed on a quiz history page — no answer content, just outcome. */
export interface QuizAttemptSummary {
  id: string;
  assessmentId: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

/** Full detail of one past attempt, for review — reuses the same per-question
 * result shape submission already returns, read back from storage instead of
 * freshly graded. */
export interface QuizAttemptDetail extends QuizAttemptSummary {
  questions: (QuizQuestion & { result: QuizQuestionResult; response: QuizSubmitAnswer | null })[];
}
