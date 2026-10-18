import { z } from 'zod';

export const ConstraintStatusSchema = z.enum(['met', 'not_met', 'unknown']);
export type ConstraintStatus = z.infer<typeof ConstraintStatusSchema>;

export const ConstraintSchema = z.object({
  name: z.string().min(1),
  status: ConstraintStatusSchema,
});
export type Constraint = z.infer<typeof ConstraintSchema>;

/**
 * ADR-002 defines provider | user_submitted | inferred.
 * 'mock' is an extension for fixture data to record provenance clearly.
 * See docs/api-contract.md for rationale.
 */
export const AttributeSourceSchema = z.enum(['provider', 'user_submitted', 'inferred', 'mock']);
export type AttributeSource = z.infer<typeof AttributeSourceSchema>;

export type Attribute<T> =
  | { type: 'known'; value: T; source: AttributeSource }
  | { type: 'unknown' };

/** Zod schema factory for Attribute<T>. */
export function attributeSchema<T>(valueSchema: z.ZodType<T>) {
  return z.discriminatedUnion('type', [
    z.object({ type: z.literal('known'), value: valueSchema, source: AttributeSourceSchema }),
    z.object({ type: z.literal('unknown') }),
  ]);
}

/** Construct a known attribute with explicit provenance. */
export function known<T>(value: T, source: AttributeSource): Attribute<T> {
  return { type: 'known', value, source };
}

/** Construct an unknown attribute (data not available). */
export function unknown(): { type: 'unknown' } {
  return { type: 'unknown' };
}

export const PlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  district: z.string().min(1),
  openHour: attributeSchema(z.number().int().min(0).max(23)),
  closeHour: attributeSchema(z.number().int().min(0).max(23)),
  rating: z.number().min(0).max(5),
  tags: z.array(z.string()),
  priceLevel: attributeSchema(z.number().int().min(1).max(4)),
  minPriceVnd: attributeSchema(z.number().int().positive()),
  amenities: attributeSchema(z.array(z.string())),
});

export type Place = z.infer<typeof PlaceSchema>;

export const ConstraintStrengthSchema = z.enum(['required', 'preferred']);
export type ConstraintStrength = z.infer<typeof ConstraintStrengthSchema>;

export const SearchIntentSchema = z.object({
  query: z.string().min(1),
  districts: z
    .array(
      z.object({
        name: z.string().min(1),
        strength: ConstraintStrengthSchema,
      }),
    )
    .optional(),
  priceRange: z
    .object({
      min: z.number(),
      max: z.number(),
      strength: ConstraintStrengthSchema,
    })
    .optional(),
  budget: z
    .object({
      maxVnd: z.number().int().positive(),
      strength: ConstraintStrengthSchema,
    })
    .optional(),
  amenities: z
    .array(
      z.object({
        name: z.string().min(1),
        strength: ConstraintStrengthSchema,
      }),
    )
    .optional(),
  openNow: z
    .object({
      value: z.boolean(),
      strength: ConstraintStrengthSchema,
    })
    .optional(),
  minRating: z
    .object({
      value: z.number().min(0).max(5),
      strength: ConstraintStrengthSchema,
    })
    .optional(),
});

export type SearchIntent = z.infer<typeof SearchIntentSchema>;

export const ResultSourceSchema = z.enum(['mock', 'provider']);
export type ResultSource = z.infer<typeof ResultSourceSchema>;

/**
 * Per-constraint detail with optional evidence (value + provenance source).
 * Names: 'budget', 'openNow', 'rating', 'district:<name>', 'amenity:<name>'.
 * Used by Phase 5b for grounded explanations.
 */
export const ConstraintDetailSchema = z.object({
  name: z.string().min(1),
  status: ConstraintStatusSchema,
  evidence: z
    .object({
      value: z.unknown(),
      source: AttributeSourceSchema,
    })
    .optional(),
});
export type ConstraintDetail = z.infer<typeof ConstraintDetailSchema>;

export const SearchResultSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  district: z.string().min(1),
  address: z.string().min(1),
  /** Serialized from Attribute<number>: number when known, null when unknown. */
  priceLevel: z.union([z.number().int().min(1).max(4), z.null()]),
  source: ResultSourceSchema,
  constraints: z.array(ConstraintSchema),
  hasUnmetRequired: z.boolean(),
  /** Per-item constraint details with evidence. Optional field added in Phase 5a. */
  constraintDetails: z.array(ConstraintDetailSchema).optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const SearchWarningSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});
export type SearchWarning = z.infer<typeof SearchWarningSchema>;

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  warnings: z.array(SearchWarningSchema),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
