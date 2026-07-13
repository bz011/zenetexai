import { z } from "zod";

export const courseFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "required")
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
  title_en: z.string().trim().min(1, "required"),
  title_ar: z.string().trim().optional(),
  description_en: z.string().trim().optional(),
  description_ar: z.string().trim().optional(),
  order_index: z.coerce.number().int().min(0),
  is_published: z.coerce.boolean(),
});

export const moduleFormSchema = z.object({
  title_en: z.string().trim().min(1, "required"),
  title_ar: z.string().trim().optional(),
  description_en: z.string().trim().optional(),
  description_ar: z.string().trim().optional(),
  order_index: z.coerce.number().int().min(0),
  is_published: z.coerce.boolean(),
});

export const lessonFormSchema = z.object({
  title_en: z.string().trim().min(1, "required"),
  title_ar: z.string().trim().optional(),
  content_en: z.string().trim().optional(),
  content_ar: z.string().trim().optional(),
  video_provider: z.enum(["youtube", "vimeo", "none"]),
  video_url: z.string().trim().optional(),
  duration_minutes: z.coerce.number().int().min(0).optional(),
  order_index: z.coerce.number().int().min(0),
  is_published: z.coerce.boolean(),
});

/**
 * Unified quiz submission schema — one shape for every interaction type.
 * This only validates the ENVELOPE (right fields, right basic types). The
 * authoritative interaction_type used to decide which of these fields
 * actually matters for grading is always re-derived server-side from the
 * database, never trusted from `source`/an implied type here — a client
 * could otherwise claim a different question type to dodge grading.
 */
export const quizSubmitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      source: z.enum(["legacy", "bank"]),
      selectedOptionIds: z.array(z.string()).optional(),
      matchingPairs: z.array(z.object({ leftItemId: z.string(), rightItemId: z.string() })).optional(),
      dragDropOrder: z.array(z.string()).optional(),
      hotspotClick: z.object({ xPct: z.number().min(0).max(100), yPct: z.number().min(0).max(100) }).optional(),
    })
  ),
});

export const saveLessonNoteSchema = z.object({
  noteText: z.string().max(10000, "note_too_long"),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;
export type ModuleFormValues = z.infer<typeof moduleFormSchema>;
export type LessonFormValues = z.infer<typeof lessonFormSchema>;
export type QuizSubmitValues = z.infer<typeof quizSubmitSchema>;
export type SaveLessonNoteValues = z.infer<typeof saveLessonNoteSchema>;
