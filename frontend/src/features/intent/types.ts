// Đồng bộ với backend/src/domain/schemas.ts (SearchIntentSchema).
// Nếu backend đổi schema, cập nhật file này theo.
export type ConstraintStrength = 'required' | 'preferred';

export interface DistrictIntent {
  name: string;
  strength: ConstraintStrength;
}

export interface BudgetIntent {
  maxVnd: number;
  strength: ConstraintStrength;
}

export interface PriceRangeIntent {
  min: number;
  max: number;
  strength: ConstraintStrength;
}

export interface AmenityIntent {
  name: string;
  strength: ConstraintStrength;
}

export interface OpenNowIntent {
  value: boolean;
  strength: ConstraintStrength;
}

export interface MinRatingIntent {
  value: number;
  strength: ConstraintStrength;
}

export interface SearchIntent {
  query: string;
  districts?: DistrictIntent[];
  priceRange?: PriceRangeIntent;
  budget?: BudgetIntent;
  amenities?: AmenityIntent[];
  openNow?: OpenNowIntent;
  minRating?: MinRatingIntent;
}

export type IntentStatus = 'loading' | 'error' | 'ready' | 'empty';

/** Tiện ích mà MockIntentExtractor (backend) đang nhận diện. */
export const KNOWN_AMENITIES = [
  'wifi',
  'parking',
  'work-friendly',
  'quiet',
  'power-outlets',
  'late-night',
] as const;

/** Khu vực mà MockIntentExtractor (backend) đang nhận diện. */
export const KNOWN_DISTRICTS = [
  'District 1',
  'District 3',
  'District 5',
  'District 7',
  'Gò Vấp',
  'Thủ Đức',
  'Bình Thạnh',
  'Phú Nhuận',
  'Tân Bình',
] as const;
