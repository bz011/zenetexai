/**
 * Known-valid enum values for the question bank. Update these lists as new
 * legitimate values are introduced by content authors - do not loosen a
 * check just to make a validation error go away without confirming the new
 * value is intentional.
 */

export const REQUIRED_SHEETS = [
  "questions",
  "question_options",
  "matching_pairs",
  "hotspots",
  "drag_and_drop",
  "question_images",
] as const;

export const VALID_DOMAINS = ["People", "Process", "Business Environment"];

export const VALID_APPROACHES = ["Predictive", "Agile", "Hybrid", "Mixed"];

export const VALID_DIFFICULTIES = ["Easy", "Moderate", "Difficult", "Expert"];

export const VALID_INTERACTION_TYPES = [
  "standard",
  "graphic_based",
  "drag_and_drop",
  "hotspot",
  "matching",
];

export const VALID_ANSWER_TYPES = ["single", "multiple_response"];

/** Only "Mock" has been observed so far - expand as new assessment types appear. */
export const VALID_ASSESSMENT_TYPES = ["Mock"];

export const VALID_STATUSES = ["Approved", "Needs Review", "Draft", "Rejected"];

/** Only "Original" has been observed so far - expand as new sources appear. */
export const VALID_SOURCES = ["Original"];

export const VALID_IMAGE_EXTENSIONS = /\.(png|jpe?g|svg|webp)$/i;
