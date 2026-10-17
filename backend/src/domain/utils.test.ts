import { describe, it, expect } from 'vitest';
import { isOpenNow, evaluateConstraints } from './utils.js';
import type { Place, SearchIntent } from './schemas.js';

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
  minPriceVnd: 60000,
  amenities: ['wifi', 'parking'],
};

describe('isOpenNow', () => {
  const mockClock = (hour: number) => {
    const date = new Date('2026-10-17T00:00:00Z');
    date.setUTCHours(hour - 7); // UTC+7, so subtract 7 to get UTC for that VN hour
    return date;
  };

  it('returns true when cafe is currently open', () => {
    expect(isOpenNow(basePlace, () => mockClock(10))).toBe(true);
  });

  it('returns false when cafe is closed', () => {
    expect(isOpenNow(basePlace, () => mockClock(23))).toBe(false);
  });

  it('returns null when hours are missing (unknown state)', () => {
    const place: Place = { ...basePlace, openHour: null };
    expect(isOpenNow(place, () => mockClock(10))).toBeNull();
  });
});

describe('evaluateConstraints', () => {
  it('excludes required location not_met, keeps preferred without flag', () => {
    const required: SearchIntent = {
      query: 'test',
      districts: [{ name: 'District 3', strength: 'required' }],
    };
    const req = evaluateConstraints(required, basePlace);
    expect(req.constraints.find((c) => c.name === 'location')?.status).toBe('not_met');
    expect(req.excluded).toBe(true);
    expect(req.hasUnmetRequired).toBe(true);

    const preferred: SearchIntent = {
      query: 'test',
      districts: [{ name: 'District 3', strength: 'preferred' }],
    };
    const pref = evaluateConstraints(preferred, basePlace);
    expect(pref.excluded).toBe(false);
    expect(pref.hasUnmetRequired).toBe(false);
  });

  it('compares budget in VND: met within, not_met above, excluded when required', () => {
    const met = evaluateConstraints(
      { query: 'test', budget: { maxVnd: 70000, strength: 'preferred' } },
      basePlace,
    );
    expect(met.constraints.find((c) => c.name === 'budget')?.status).toBe('met');
    expect(met.excluded).toBe(false);

    const over = evaluateConstraints(
      { query: 'test', budget: { maxVnd: 50000, strength: 'required' } },
      basePlace,
    );
    expect(over.constraints.find((c) => c.name === 'budget')?.status).toBe('not_met');
    expect(over.excluded).toBe(true);
  });

  it('returns unknown for budget when only priceLevel exists, keeps place with flag', () => {
    const place: Place = { ...basePlace, minPriceVnd: null };
    const intent: SearchIntent = {
      query: 'test',
      budget: { maxVnd: 70000, strength: 'required' },
    };
    const { constraints, hasUnmetRequired, excluded } = evaluateConstraints(intent, place);
    expect(constraints.find((c) => c.name === 'budget')?.status).toBe('unknown');
    expect(hasUnmetRequired).toBe(true);
    expect(excluded).toBe(false);
  });

  it('returns unknown (never not_met) for missing amenity tag, keeps place with flag', () => {
    const intent: SearchIntent = {
      query: 'test',
      amenities: [{ name: 'quiet', strength: 'required' }],
    };
    const { constraints, hasUnmetRequired, excluded } = evaluateConstraints(intent, basePlace);
    expect(constraints.find((c) => c.name === 'amenities')?.status).toBe('unknown');
    expect(hasUnmetRequired).toBe(true);
    expect(excluded).toBe(false);
  });

  it('returns unknown for openNow (not wired yet) and flags required', () => {
    const intent: SearchIntent = {
      query: 'test',
      openNow: { value: true, strength: 'required' },
    };
    const { constraints, hasUnmetRequired, excluded } = evaluateConstraints(intent, basePlace);
    expect(constraints.find((c) => c.name === 'openNow')?.status).toBe('unknown');
    expect(hasUnmetRequired).toBe(true);
    expect(excluded).toBe(false);
  });
});
