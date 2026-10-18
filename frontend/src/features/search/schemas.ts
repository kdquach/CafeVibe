import { z } from 'zod';

// Mirror backend SearchResponseSchema. Chỉ chứa response của /search.
export const constraintStatusSchema = z.enum(['met', 'not_met', 'unknown']);
export type ConstraintStatus = z.infer<typeof constraintStatusSchema>;

export const searchConstraintSchema = z.object({
  name: z.string().min(1),
  status: constraintStatusSchema,
});
export type SearchConstraint = z.infer<typeof searchConstraintSchema>;

export const searchResultSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  district: z.string().min(1),
  address: z.string().min(1),
  priceLevel: z.union([z.number().int().min(1).max(4), z.null()]),
  source: z.enum(['mock', 'provider']),
  constraints: z.array(searchConstraintSchema),
  hasUnmetRequired: z.boolean(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchWarningSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});
export type SearchWarning = z.infer<typeof searchWarningSchema>;

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
  warnings: z.array(searchWarningSchema),
});
export type SearchResponse = z.infer<typeof searchResponseSchema>;
