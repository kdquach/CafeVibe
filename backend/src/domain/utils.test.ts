import { describe, it, expect } from 'vitest';
import { isOpenNow, evaluateConstraints } from './utils.js';
import type { Place, SearchIntent } from './schemas.js';

describe('isOpenNow', () => {
  const mockClock = (hour: number) => {
    const date = new Date('2026-10-17T00:00:00Z');
    date.setUTCHours(hour - 7); // UTC+7, so subtract 7 to get UTC for that VN hour
    return date;
  };

  it('returns true when cafe is currently open', () => {
    const place: Place = {
      id: 'cafe-1',
      name: 'Test Cafe',
      address: 'Test Address',
      latitude: 10.8,
      longitude: 106.7,
      district: 'District 1',
      openHour: 7,
      closeHour: 22,
      rating: 4.5,
      tags: [],
      priceLevel: 2,
      amenities: [],
    };
    const result = isOpenNow(place, () => mockClock(10));
    expect(result).toBe(true);
  });

  it('returns false when cafe is closed', () => {
    const place: Place = {
      id: 'cafe-1',
      name: 'Test Cafe',
      address: 'Test Address',
      latitude: 10.8,
      longitude: 106.7,
      district: 'District 1',
      openHour: 7,
      closeHour: 22,
      rating: 4.5,
      tags: [],
      priceLevel: 2,
      amenities: [],
    };
    const result = isOpenNow(place, () => mockClock(23));
    expect(result).toBe(false);
  });

  it('returns null when hours are missing (unknown state)', () => {
    const place: Place = {
      id: 'cafe-1',
      name: 'Test Cafe',
      address: 'Test Address',
      latitude: 10.8,
      longitude: 106.7,
      district: 'District 1',
      openHour: null,
      closeHour: 22,
      rating: 4.5,
      tags: [],
      priceLevel: 2,
      amenities: [],
    };
    const result = isOpenNow(place, () => mockClock(10));
    expect(result).toBeNull();
  });
});

describe('evaluateConstraints', () => {
  const basePlace: Place = {
    id: 'cafe-1',
    name: 'Test Cafe',
    address: 'Test Address',
    latitude: 10.8,
    longitude: 106.7,
    district: 'District 1',
    openHour: 7,
    closeHour: 22,
    rating: 4.5,
    tags: [],
    priceLevel: 2,
    amenities: ['wifi', 'parking'],
  };

  it('returns met constraint for matching district', () => {
    const intent: SearchIntent = {
      query: 'test',
      districts: [{ name: 'District 1', strength: 'required' }],
    };
    const { constraints } = evaluateConstraints(intent, basePlace);
    const locationConstraint = constraints.find(c => c.name === 'location');
    expect(locationConstraint?.status).toBe('met');
  });

  it('returns not_met constraint for non-matching district', () => {
    const intent: SearchIntent = {
      query: 'test',
      districts: [{ name: 'District 3', strength: 'required' }],
    };
    const { constraints } = evaluateConstraints(intent, basePlace);
    const locationConstraint = constraints.find(c => c.name === 'location');
    expect(locationConstraint?.status).toBe('not_met');
  });

  it('returns met for budget in range', () => {
    const intent: SearchIntent = {
      query: 'test',
      priceRange: { min: 1, max: 3, strength: 'preferred' },
    };
    const { constraints } = evaluateConstraints(intent, basePlace);
    const budgetConstraint = constraints.find(c => c.name === 'budget');
    expect(budgetConstraint?.status).toBe('met');
  });

  it('returns unknown for missing price level', () => {
    const place: Place = { ...basePlace, priceLevel: null };
    const intent: SearchIntent = {
      query: 'test',
      priceRange: { min: 1, max: 3, strength: 'required' },
    };
    const { constraints, hasUnmetRequired } = evaluateConstraints(intent, place);
    const budgetConstraint = constraints.find(c => c.name === 'budget');
    expect(budgetConstraint?.status).toBe('unknown');
    expect(hasUnmetRequired).toBe(true);
  });

  it('marks hasUnmetRequired=true for required constraint with unknown status', () => {
    const place: Place = { ...basePlace, priceLevel: null };
    const intent: SearchIntent = {
      query: 'test',
      priceRange: { min: 1, max: 3, strength: 'required' },
    };
    const { hasUnmetRequired } = evaluateConstraints(intent, place);
    expect(hasUnmetRequired).toBe(true);
  });

  it('does not mark hasUnmetRequired for preferred constraint with unknown status', () => {
    const place: Place = { ...basePlace, priceLevel: null };
    const intent: SearchIntent = {
      query: 'test',
      priceRange: { min: 1, max: 3, strength: 'preferred' },
    };
    const { hasUnmetRequired } = evaluateConstraints(intent, place);
    expect(hasUnmetRequired).toBe(false);
  });
});
