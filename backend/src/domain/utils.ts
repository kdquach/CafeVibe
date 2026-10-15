import type { Place, SearchIntent } from './schemas.js';

const TIMEZONE_OFFSET_MINUTES = 7 * 60; // UTC+7

function getVietnamTime(date: Date): Date {
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utcTime + TIMEZONE_OFFSET_MINUTES * 60 * 1000);
}

export function isOpenNow(place: Place, clock: () => Date): boolean {
  const now = getVietnamTime(clock());
  const currentHour = now.getHours();
  return currentHour >= place.openHour && currentHour < place.closeHour;
}

export function evaluateConstraints(intent: SearchIntent, place: Place): boolean {
  if (intent.districts && intent.districts.length > 0 && !intent.districts.includes(place.district)) {
    return false;
  }

  if (intent.priceRange) {
    const [min, max] = intent.priceRange;
    if (place.priceLevel < min || place.priceLevel > max) {
      return false;
    }
  }

  if (intent.amenities && intent.amenities.length > 0) {
    const hasAmenity = intent.amenities.some((amenity) => place.amenities.includes(amenity));
    if (!hasAmenity) {
      return false;
    }
  }

  if (intent.minRating && place.rating < intent.minRating) {
    return false;
  }

  return true;
}

export function calculateStrength(intent: SearchIntent, place: Place, clock: () => Date): number {
  let strength = 50;

  if (intent.districts && intent.districts.includes(place.district)) {
    strength += 15;
  }

  if (intent.priceRange) {
    const [min, max] = intent.priceRange;
    const midPrice = (min + max) / 2;
    const distance = Math.abs(place.priceLevel - midPrice);
    strength += Math.max(0, 10 - distance * 3);
  }

  if (intent.amenities && intent.amenities.length > 0) {
    const matchedAmenities = intent.amenities.filter((amenity) => place.amenities.includes(amenity));
    strength += matchedAmenities.length * 5;
  }

  if (intent.minRating && place.rating >= intent.minRating) {
    strength += Math.min(10, place.rating - intent.minRating);
  }

  if (intent.openNow && isOpenNow(place, clock)) {
    strength += 20;
  }

  return Math.min(100, strength);
}
