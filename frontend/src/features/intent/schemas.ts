import { z } from 'zod';

// Nguồn sự thật duy nhất cho SearchIntent ở frontend (đồng bộ backend SearchIntentSchema).
// features/intent/types.ts re-export kiểu suy từ schema này.

export const constraintStrengthSchema = z.enum(['required', 'preferred']);
export type ConstraintStrength = z.infer<typeof constraintStrengthSchema>;

export const districtIntentSchema = z.object({
  name: z.string().min(1),
  strength: constraintStrengthSchema,
});
export type DistrictIntent = z.infer<typeof districtIntentSchema>;

export const priceRangeIntentSchema = z.object({
  min: z.number(),
  max: z.number(),
  strength: constraintStrengthSchema,
});
export type PriceRangeIntent = z.infer<typeof priceRangeIntentSchema>;

export const budgetIntentSchema = z.object({
  maxVnd: z.number().int().positive(),
  strength: constraintStrengthSchema,
});
export type BudgetIntent = z.infer<typeof budgetIntentSchema>;

export const amenityIntentSchema = z.object({
  name: z.string().min(1),
  strength: constraintStrengthSchema,
});
export type AmenityIntent = z.infer<typeof amenityIntentSchema>;

export const openNowIntentSchema = z.object({
  value: z.boolean(),
  strength: constraintStrengthSchema,
});
export type OpenNowIntent = z.infer<typeof openNowIntentSchema>;

export const minRatingIntentSchema = z.object({
  value: z.number().min(0).max(5),
  strength: constraintStrengthSchema,
});
export type MinRatingIntent = z.infer<typeof minRatingIntentSchema>;

export const searchIntentSchema = z.object({
  query: z.string().min(1),
  districts: z.array(districtIntentSchema).optional(),
  priceRange: priceRangeIntentSchema.optional(),
  budget: budgetIntentSchema.optional(),
  amenities: z.array(amenityIntentSchema).optional(),
  openNow: openNowIntentSchema.optional(),
  minRating: minRatingIntentSchema.optional(),
});
export type SearchIntent = z.infer<typeof searchIntentSchema>;
