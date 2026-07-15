import { z } from "zod";

/**
 * Deliberately plain z.number()/z.boolean() - NOT z.coerce.number()/
 * z.coerce.boolean(). FormData values are explicitly converted to their
 * real types (checkbox -> boolean, number input -> number) by the
 * form*InputFromFormData() helpers in courseAdminService.ts BEFORE this
 * schema ever sees them - see that file for why. Keeping conversion out of
 * the schema means this schema only ever validates business rules (min
 * length, regex, min value), and a mismatch between "what type did we
 * convert to" and "what type does the schema expect" is a type error at
 * compile time instead of a silent runtime coercion.
 */
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
  order_index: z.number().int().min(0),
  is_published: z.boolean(),
});

export const moduleFormSchema = z.object({
  title_en: z.string().trim().min(1, "required"),
  title_ar: z.string().trim().optional(),
  description_en: z.string().trim().optional(),
  description_ar: z.string().trim().optional(),
  order_index: z.number().int().min(0),
  is_published: z.boolean(),
});

export const lessonFormSchema = z.object({
  title_en: z.string().trim().min(1, "required"),
  title_ar: z.string().trim().optional(),
  content_en: z.string().trim().optional(),
  content_ar: z.string().trim().optional(),
  video_provider: z.enum(["youtube", "vimeo", "none"]),
  video_url: z.string().trim().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  order_index: z.number().int().min(0),
  is_published: z.boolean(),
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
