import { z } from "zod";

export const publishPostSchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
  body: z.string().trim().min(1),
  meta_title: z.string().trim().min(1).max(255),
  meta_description: z.string().trim().min(1).max(500),
});

/** Delete only ever accepts a slug shaped like a real post identifier - never an arbitrary string passed straight to a WHERE clause value. */
export const deletePostSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
});

export type PublishPostValues = z.infer<typeof publishPostSchema>;
export type DeletePostValues = z.infer<typeof deletePostSchema>;
