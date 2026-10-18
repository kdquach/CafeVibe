import type { Place, SearchIntent, Constraint, ConstraintDetail } from './schemas.js';

const TIMEZONE_OFFSET_MINUTES = 7 * 60; // UTC+7 Asia/Ho_Chi_Minh

function getVietnamTime(date: Date): Date {
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utcTime + TIMEZONE_OFFSET_MINUTES * 60 * 1000);
}

/**
 * Returns whether a place is currently open.
 * Supports overnight hours: when closeHour <= openHour (e.g. 18:00–02:00),
 * the place is open if currentHour >= openHour OR currentHour < closeHour.
 * Returns null when either openHour or closeHour is unknown.
 * All comparisons use Asia/Ho_Chi_Minh (UTC+7).
 */
export function isOpenNow(place: Place, now: Date): boolean | null {
  const openHourAttr = place.openHour;
  const closeHourAttr = place.closeHour;

  if (openHourAttr.type === 'unknown' || closeHourAttr.type === 'unknown') {
    return null;
  }

  const vnNow = getVietnamTime(now);
  const currentHour = vnNow.getHours();
  const openHour = openHourAttr.value;
  const closeHour = closeHourAttr.value;

  if (closeHour <= openHour) {
    // Overnight span: open when past openHour OR before closeHour
    return currentHour >= openHour || currentHour < closeHour;
  }
  return currentHour >= openHour && currentHour < closeHour;
}

export function evaluateConstraints(
  intent: SearchIntent,
  place: Place,
  now: Date,
): {
  constraints: Constraint[];
  constraintDetails: ConstraintDetail[];
  hasUnmetRequired: boolean;
  excluded: boolean;
} {
  const constraints: Constraint[] = [];
  const constraintDetails: ConstraintDetail[] = [];
  let hasUnmetRequired = false;
  let excluded = false;

  // District constraint — one constraintDetail per district entry
  if (intent.districts && intent.districts.length > 0) {
    for (const district of intent.districts) {
      const status: 'met' | 'not_met' = district.name === place.district ? 'met' : 'not_met';
      constraintDetails.push({ name: `district:${district.name}`, status });
    }
    const districtMatch = intent.districts.find((d) => d.name === place.district);
    const locationStatus: 'met' | 'not_met' = districtMatch ? 'met' : 'not_met';
    constraints.push({ name: 'location', status: locationStatus });
    if (locationStatus === 'not_met' && intent.districts.some((d) => d.strength === 'required')) {
      hasUnmetRequired = true;
      excluded = true;
    }
  }

  // Budget constraint — VND comparison only; priceLevel never mapped to VND (ADR-002)
  if (intent.budget) {
    const minVnd = place.minPriceVnd;
    let status: 'met' | 'not_met' | 'unknown';
    const detail: ConstraintDetail = { name: 'budget', status: 'unknown' };
    if (minVnd.type === 'unknown') {
      status = 'unknown';
    } else {
      status = minVnd.value <= intent.budget.maxVnd ? 'met' : 'not_met';
      detail.evidence = { value: minVnd.value, source: minVnd.source };
    }
    detail.status = status;
    constraints.push({ name: 'budget', status });
    constraintDetails.push(detail);
    if (status !== 'met' && intent.budget.strength === 'required') {
      hasUnmetRequired = true;
      if (status === 'not_met') excluded = true;
    }
  }

  // Price range constraint (uses priceLevel attribute)
  if (intent.priceRange) {
    const priceLvl = place.priceLevel;
    let status: 'met' | 'not_met' | 'unknown';
    const detail: ConstraintDetail = { name: 'priceRange', status: 'unknown' };
    if (priceLvl.type === 'unknown') {
      status = 'unknown';
    } else {
      const { min, max } = intent.priceRange;
      status = priceLvl.value >= min && priceLvl.value <= max ? 'met' : 'not_met';
      detail.evidence = { value: priceLvl.value, source: priceLvl.source };
    }
    detail.status = status;
    constraints.push({ name: 'budget', status });
    constraintDetails.push(detail);
    if (status !== 'met' && intent.priceRange.strength === 'required') {
      hasUnmetRequired = true;
      if (status === 'not_met') excluded = true;
    }
  }

  // Amenities — one constraintDetail per amenity; absence of a tag is never not_met (ADR-002)
  if (intent.amenities && intent.amenities.length > 0) {
    const amenitiesAttr = place.amenities;
    let anyAmenityMet = false;
    for (const amenity of intent.amenities) {
      if (amenitiesAttr.type === 'unknown') {
        constraintDetails.push({ name: `amenity:${amenity.name}`, status: 'unknown' });
      } else {
        const hasIt = amenitiesAttr.value.includes(amenity.name);
        if (hasIt) {
          anyAmenityMet = true;
          constraintDetails.push({
            name: `amenity:${amenity.name}`,
            status: 'met',
            evidence: { value: amenity.name, source: amenitiesAttr.source },
          });
        } else {
          // Absence of a tag is not evidence of absence
          constraintDetails.push({ name: `amenity:${amenity.name}`, status: 'unknown' });
        }
      }
    }
    const combinedStatus: 'met' | 'unknown' = anyAmenityMet ? 'met' : 'unknown';
    constraints.push({ name: 'amenities', status: combinedStatus });
    if (combinedStatus === 'unknown' && intent.amenities.some((a) => a.strength === 'required')) {
      hasUnmetRequired = true;
    }
  }

  // openNow constraint — wired to isOpenNow (Asia/Ho_Chi_Minh)
  if (intent.openNow) {
    const openResult = isOpenNow(place, now);
    let status: 'met' | 'not_met' | 'unknown';
    const detail: ConstraintDetail = { name: 'openNow', status: 'unknown' };
    if (openResult === null) {
      status = 'unknown';
    } else {
      status = openResult === intent.openNow.value ? 'met' : 'not_met';
      const openHourAttr = place.openHour;
      if (openHourAttr.type === 'known') {
        detail.evidence = { value: openResult, source: openHourAttr.source };
      }
    }
    detail.status = status;
    constraints.push({ name: 'openNow', status });
    constraintDetails.push(detail);
    if (status !== 'met' && intent.openNow.strength === 'required') {
      hasUnmetRequired = true;
      if (status === 'not_met') excluded = true;
    }
  }

  // Rating constraint
  if (intent.minRating) {
    const status: 'met' | 'not_met' = place.rating >= intent.minRating.value ? 'met' : 'not_met';
    constraints.push({ name: 'rating', status });
    constraintDetails.push({ name: 'rating', status });
    if (status === 'not_met' && intent.minRating.strength === 'required') {
      hasUnmetRequired = true;
      excluded = true;
    }
  }

  return { constraints, constraintDetails, hasUnmetRequired, excluded };
}
