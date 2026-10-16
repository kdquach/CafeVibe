import type { SearchIntent } from '@/features/intent/types';

/** Dữ liệu mẫu cục bộ để dựng giao diện (4b). Chưa nối API — việc nối API để 4c. */
export const SAMPLE_INTENT: SearchIntent = {
  query: 'Quán yên tĩnh để làm việc ở Gò Vấp, dưới 70.000đ',
  districts: [{ name: 'Gò Vấp', strength: 'required' }],
  budget: { maxVnd: 70000, strength: 'required' },
  amenities: [
    { name: 'quiet', strength: 'preferred' },
    { name: 'work-friendly', strength: 'preferred' },
  ],
};
