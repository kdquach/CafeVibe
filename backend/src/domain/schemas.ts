import { z } from 'zod';

export const StrengthSchema = z.enum(['must', 'should', 'could']);
export type Strength = z.infer<typeof StrengthSchema>;

export const PlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  district: z.string().min(1),
  openHour: z.number().int().min(0).max(23),
  closeHour: z.number().int().min(0).max(23),
  rating: z.number().min(0).max(5),
  tags: z.array(z.string()),
  priceLevel: z.number().int().min(1).max(4),
  amenities: z.array(z.string()),
});

export type Place = z.infer<typeof PlaceSchema>;

export const SearchIntentSchema = z.object({
  query: z.string().min(1),
  districts: z.array(z.string()).optional(),
  priceRange: z.tuple([z.number(), z.number()]).optional(),
  amenities: z.array(z.string()).optional(),
  openNow: z.boolean().optional(),
  minRating: z.number().min(0).max(5).optional(),
});

export type SearchIntent = z.infer<typeof SearchIntentSchema>;

export const SearchResultSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  district: z.string().min(1),
  address: z.string().min(1),
  priceLevel: z.number().int().min(1).max(4),
  strength: z.number().min(0).max(100),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
