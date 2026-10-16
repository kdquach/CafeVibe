import { z } from 'zod';

export const ConstraintStatusSchema = z.enum(['met', 'not_met', 'unknown']);
export type ConstraintStatus = z.infer<typeof ConstraintStatusSchema>;

export const ConstraintSchema = z.object({
  name: z.string().min(1),
  status: ConstraintStatusSchema,
});
export type Constraint = z.infer<typeof ConstraintSchema>;

export const AttributeSourceSchema = z.enum(['provider', 'user_submitted', 'inferred']);
export type AttributeSource = z.infer<typeof AttributeSourceSchema>;

export const AttributeSchema = z.union([
  z.object({ type: z.literal('known'), value: z.any(), source: AttributeSourceSchema }),
  z.object({ type: z.literal('unknown') }),
]);
export type Attribute = z.infer<typeof AttributeSchema>;

export const PlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  district: z.string().min(1),
  openHour: z.union([z.number().int().min(0).max(23), z.null()]),
  closeHour: z.union([z.number().int().min(0).max(23), z.null()]),
  rating: z.number().min(0).max(5),
  tags: z.array(z.string()),
  priceLevel: z.union([z.number().int().min(1).max(4), z.null()]),
  amenities: z.array(z.string()),
});

export type Place = z.infer<typeof PlaceSchema>;

export const ConstraintStrengthSchema = z.enum(['required', 'preferred']);
export type ConstraintStrength = z.infer<typeof ConstraintStrengthSchema>;

export const SearchIntentSchema = z.object({
  query: z.string().min(1),
  districts: z.array(z.object({
    name: z.string().min(1),
    strength: ConstraintStrengthSchema,
  })).optional(),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
    strength: ConstraintStrengthSchema,
  }).optional(),
  budget: z.object({
    maxVnd: z.number().int().positive(),
    strength: ConstraintStrengthSchema,
  }).optional(),
  amenities: z.array(z.object({
    name: z.string().min(1),
    strength: ConstraintStrengthSchema,
  })).optional(),
  openNow: z.object({
    value: z.boolean(),
    strength: ConstraintStrengthSchema,
  }).optional(),
  minRating: z.object({
    value: z.number().min(0).max(5),
    strength: ConstraintStrengthSchema,
  }).optional(),
});

export type SearchIntent = z.infer<typeof SearchIntentSchema>;

export const SearchResultSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  district: z.string().min(1),
  address: z.string().min(1),
  priceLevel: z.union([z.number().int().min(1).max(4), z.null()]),
  constraints: z.array(ConstraintSchema),
  hasUnmetRequired: z.boolean(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
