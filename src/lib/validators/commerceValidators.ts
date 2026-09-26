import { z } from "zod";

export const productFlagsSchema = z.object({
  is_active: z.boolean(),
  is_published: z.boolean(),
});

export const regularPriceSchema = z.object({
  amount_minor_units: z.number().int().min(0, "must be 0 or more"),
});

export const promoPriceSchema = z
  .object({
    amount_minor_units: z.number().int().min(0, "must be 0 or more"),
    valid_from: z.string().min(1, "required"),
    valid_until: z.string().min(1, "required"),
    access_duration_days: z.number().int().min(1).optional(),
    is_active: z.boolean(),
  })
  .refine((v) => new Date(v.valid_until).getTime() > new Date(v.valid_from).getTime(), {
    message: "valid_until must be after valid_from",
    path: ["valid_until"],
  });

export const grantEntitlementSchema = z.object({
  email: z.string().trim().email("invalid_email"),
  duration_days: z.number().int().min(1).optional(),
});

export type ProductFlagsValues = z.infer<typeof productFlagsSchema>;
export type RegularPriceValues = z.infer<typeof regularPriceSchema>;
export type PromoPriceValues = z.infer<typeof promoPriceSchema>;
export type GrantEntitlementValues = z.infer<typeof grantEntitlementSchema>;
