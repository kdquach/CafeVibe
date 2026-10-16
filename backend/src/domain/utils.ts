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

export function evaluateConstraints(intent: SearchIntent, place: Place): { constraints: Constraint[]; hasUnmetRequired: boolean } {
  const constraints: Constraint[] = [];
  let hasUnmetRequired = false;

  // District constraint
  if (intent.districts && intent.districts.length > 0) {
    const districtMatch = intent.districts.find(d => d.name === place.district);
    const status = districtMatch ? 'met' : 'not_met';
    constraints.push({ name: 'location', status });
    if (status === 'not_met') {
      const hasRequired = intent.districts.some(d => d.strength === 'required');
      if (hasRequired) {
        hasUnmetRequired = true;
      }
    }
  }

  // Price range constraint
  if (intent.priceRange) {
    let status: 'met' | 'not_met' | 'unknown';
    if (place.priceLevel === null) {
      status = 'unknown';
      if (intent.priceRange.strength === 'required') {
        hasUnmetRequired = true;
      }
    } else {
      const { min, max } = intent.priceRange;
      status = place.priceLevel >= min && place.priceLevel <= max ? 'met' : 'not_met';
      if (status === 'not_met' && intent.priceRange.strength === 'required') {
        hasUnmetRequired = true;
      }
    }
    constraints.push({ name: 'budget', status });
  }

  // Amenities constraint
  if (intent.amenities && intent.amenities.length > 0) {
    const hasAmenity = intent.amenities.some(a => place.amenities.includes(a.name));
    const status = hasAmenity ? 'met' : 'not_met';
    constraints.push({ name: 'amenities', status });
    if (status === 'not_met' && intent.amenities.some(a => a.strength === 'required')) {
      hasUnmetRequired = true;
    }
  }

  // Open now constraint
  if (intent.openNow) {
    const openStatus = isOpenNow(place, () => new Date());
    let status: 'met' | 'not_met' | 'unknown';
    if (openStatus === null) {
      status = 'unknown';
      if (intent.openNow.strength === 'required') {
        hasUnmetRequired = true;
      }
    } else {
      status = openStatus ? 'met' : 'not_met';
      if (status === 'not_met' && intent.openNow.strength === 'required') {
        hasUnmetRequired = true;
      }
    }
    constraints.push({ name: 'openNow', status });
  }

  // Rating constraint
  if (intent.minRating) {
    const status = place.rating >= intent.minRating.value ? 'met' : 'not_met';
    constraints.push({ name: 'rating', status });
    if (status === 'not_met' && intent.minRating.strength === 'required') {
      hasUnmetRequired = true;
    }
  }

  return { constraints, hasUnmetRequired };
}

