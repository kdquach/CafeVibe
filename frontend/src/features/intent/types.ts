// Nguồn sự thật: ./schemas.ts. File này re-export kiểu để code cũ dùng tiếp.
export type {
  AmenityIntent,
  BudgetIntent,
  ConstraintStrength,
  DistrictIntent,
  MinRatingIntent,
  OpenNowIntent,
  PriceRangeIntent,
  SearchIntent,
} from './schemas';

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
