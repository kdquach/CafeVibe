import type { Place, SearchIntent, Constraint } from './schemas.js';

const TIMEZONE_OFFSET_MINUTES = 7 * 60; // UTC+7 Asia/Ho_Chi_Minh

function getVietnamTime(date: Date): Date {
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utcTime + TIMEZONE_OFFSET_MINUTES * 60 * 1000);
}

export function isOpenNow(place: Place, clock: () => Date): boolean | null {
  if (place.openHour === null || place.closeHour === null) {
    return null;
  }
  const now = getVietnamTime(clock());
  const currentHour = now.getHours();
  return currentHour >= place.openHour && currentHour < place.closeHour;
}

export function evaluateConstraints(intent: SearchIntent, place: Place): { constraints: Constraint[]; hasUnmetRequired: boolean; excluded: boolean } {
  const constraints: Constraint[] = [];
  let hasUnmetRequired = false;
  let excluded = false;

  // District constraint
  if (intent.districts && intent.districts.length > 0) {
    const districtMatch = intent.districts.find(d => d.name === place.district);
    const status = districtMatch ? 'met' : 'not_met';
    constraints.push({ name: 'location', status });
    if (status === 'not_met' && intent.districts.some(d => d.strength === 'required')) {
      hasUnmetRequired = true;
      excluded = true;
    }
  }

  // Budget constraint (VND only; never map VND to priceLevel).
  if (intent.budget) {
    let status: 'met' | 'not_met' | 'unknown';
    if (place.minPriceVnd === null) {
      status = 'unknown';
    } else {
      status = place.minPriceVnd <= intent.budget.maxVnd ? 'met' : 'not_met';
    }
    constraints.push({ name: 'budget', status });
    if (status !== 'met' && intent.budget.strength === 'required') {
      hasUnmetRequired = true;
      if (status === 'not_met') excluded = true;
    }
  }

  // Price range constraint
  if (intent.priceRange) {
    let status: 'met' | 'not_met' | 'unknown';
    if (place.priceLevel === null) {
      status = 'unknown';
    } else {
      const { min, max } = intent.priceRange;
      status = place.priceLevel >= min && place.priceLevel <= max ? 'met' : 'not_met';
    }
    constraints.push({ name: 'budget', status });
    if (status !== 'met' && intent.priceRange.strength === 'required') {
      hasUnmetRequired = true;
      if (status === 'not_met') excluded = true;
    }
  }

  // Amenities constraint: a missing tag is not evidence of absence, so never not_met.
  if (intent.amenities && intent.amenities.length > 0) {
    const hasAmenity = intent.amenities.some(a => place.amenities.includes(a.name));
    const status = hasAmenity ? 'met' : 'unknown';
    constraints.push({ name: 'amenities', status });
    if (status === 'unknown' && intent.amenities.some(a => a.strength === 'required')) {
      hasUnmetRequired = true;
    }
  }

  // Open now constraint: isOpenNow not wired yet (Phase 5), always unknown.
  if (intent.openNow) {
    constraints.push({ name: 'openNow', status: 'unknown' });
    if (intent.openNow.strength === 'required') {
      hasUnmetRequired = true;
    }
  }

  // Rating constraint
  if (intent.minRating) {
    const status = place.rating >= intent.minRating.value ? 'met' : 'not_met';
    constraints.push({ name: 'rating', status });
    if (status === 'not_met' && intent.minRating.strength === 'required') {
      hasUnmetRequired = true;
      excluded = true;
    }
  }

  return { constraints, hasUnmetRequired, excluded };
}

