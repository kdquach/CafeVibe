import { describe, it, expect } from 'vitest';
import { isOpenNow, evaluateConstraints } from './utils.js';
import { known, unknown } from './schemas.js';
import type { Place, SearchIntent } from './schemas.js';

/** Returns a Date where Vietnam time (UTC+7) equals the given hour on 2026-10-17. */
function vnAt(hour: number): Date {
  const d = new Date('2026-10-17T00:00:00Z');
  d.setUTCHours(hour - 7); // adjust so VN local = hour
  return d;
}

const basePlace: Place = {
  id: 'cafe-1',
  name: 'Test Cafe',
  address: 'Test Address',
  latitude: 10.8,
  longitude: 106.7,
  district: 'District 1',
  openHour: known(7, 'mock'),
  closeHour: known(22, 'mock'),
  rating: 4.5,
  tags: [],
  priceLevel: known(2, 'mock'),
  minPriceVnd: known(60000, 'mock'),
  amenities: known(['wifi', 'parking'], 'mock'),
};

const fixedNow = vnAt(10); // VN 10:00 — within cafe-1 hours

describe('isOpenNow', () => {
  it('returns true when cafe is currently open (VN 10:00, hours 7–22)', () => {
    expect(isOpenNow(basePlace, vnAt(10))).toBe(true);
  });

  it('returns false when cafe is closed (VN 23:00, hours 7–22)', () => {
    expect(isOpenNow(basePlace, vnAt(23))).toBe(false);
  });

  it('returns null when openHour is unknown', () => {
    const place: Place = { ...basePlace, openHour: unknown() };
    expect(isOpenNow(place, vnAt(10))).toBeNull();
  });

  it('returns null when closeHour is unknown even if openHour is known', () => {
    const place: Place = { ...basePlace, closeHour: unknown() };
    expect(isOpenNow(place, vnAt(10))).toBeNull();
  });

  it('overnight hours: open before midnight (18:00–02:00, VN 23:00)', () => {
    const nightOwl: Place = { ...basePlace, openHour: known(18, 'mock'), closeHour: known(2, 'mock') };
    expect(isOpenNow(nightOwl, vnAt(23))).toBe(true);
  });

  it('overnight hours: open after midnight (18:00–02:00, VN 01:00)', () => {
    const nightOwl: Place = { ...basePlace, openHour: known(18, 'mock'), closeHour: known(2, 'mock') };
    expect(isOpenNow(nightOwl, vnAt(1))).toBe(true);
  });

  it('overnight hours: closed during day (18:00–02:00, VN 10:00)', () => {
    const nightOwl: Place = { ...basePlace, openHour: known(18, 'mock'), closeHour: known(2, 'mock') };
    expect(isOpenNow(nightOwl, vnAt(10))).toBe(false);
  });

  it('uses UTC+7 timezone: UTC 17:00 = VN 00:00, cafe (7–22) is closed', () => {
    const utc17 = new Date('2026-10-17T17:00:00Z'); // VN midnight = 00:00
    expect(isOpenNow(basePlace, utc17)).toBe(false);
  });
});

describe('evaluateConstraints', () => {
  it('excludes required location not_met; keeps preferred without flag', () => {
    const required: SearchIntent = {
      query: 'test',
      districts: [{ name: 'District 3', strength: 'required' }],
    };
    const req = evaluateConstraints(required, basePlace, fixedNow);
    expect(req.constraints.find((c) => c.name === 'location')?.status).toBe('not_met');
    expect(req.constraintDetails.find((d) => d.name === 'district:District 3')?.status).toBe('not_met');
    expect(req.excluded).toBe(true);
    expect(req.hasUnmetRequired).toBe(true);

    const preferred: SearchIntent = {
      query: 'test',
      districts: [{ name: 'District 3', strength: 'preferred' }],
    };
    const pref = evaluateConstraints(preferred, basePlace, fixedNow);
    expect(pref.excluded).toBe(false);
    expect(pref.hasUnmetRequired).toBe(false);
  });

  it('compares budget in VND: met within limit, not_met above, excluded when required', () => {
    const met = evaluateConstraints(
      { query: 'test', budget: { maxVnd: 70000, strength: 'preferred' } },
      basePlace,
      fixedNow,
    );
    expect(met.constraints.find((c) => c.name === 'budget')?.status).toBe('met');
    expect(met.excluded).toBe(false);

    const over = evaluateConstraints(
      { query: 'test', budget: { maxVnd: 50000, strength: 'required' } },
      basePlace,
      fixedNow,
    );
    expect(over.constraints.find((c) => c.name === 'budget')?.status).toBe('not_met');
    expect(over.excluded).toBe(true);
  });

  it('returns unknown for budget when minPriceVnd unknown; keeps place with flag', () => {
    const place: Place = { ...basePlace, minPriceVnd: unknown() };
    const { constraints, hasUnmetRequired, excluded } = evaluateConstraints(
      { query: 'test', budget: { maxVnd: 70000, strength: 'required' } },
      place,
      fixedNow,
    );
    expect(constraints.find((c) => c.name === 'budget')?.status).toBe('unknown');
    expect(hasUnmetRequired).toBe(true);
    expect(excluded).toBe(false);
  });

  it('amenity unknown (never not_met) for missing tag; amenity met when tag present', () => {
    const intent: SearchIntent = {
      query: 'test',
      amenities: [
        { name: 'wifi', strength: 'preferred' }, // present in basePlace
        { name: 'quiet', strength: 'required' }, // absent
      ],
    };
    const { constraints, constraintDetails, hasUnmetRequired, excluded } = evaluateConstraints(
      intent,
      basePlace,
      fixedNow,
    );
    expect(constraintDetails.find((d) => d.name === 'amenity:wifi')?.status).toBe('met');
    expect(constraintDetails.find((d) => d.name === 'amenity:quiet')?.status).toBe('unknown');
    // Combined: anyMet=true → 'met' overall
    expect(constraints.find((c) => c.name === 'amenities')?.status).toBe('met');
    // quiet is required+unknown but combined status is met → no flag
    expect(hasUnmetRequired).toBe(false);
    expect(excluded).toBe(false);
  });

  it('openNow met when cafe is open and openNow.value=true', () => {
    const { constraints, constraintDetails, hasUnmetRequired } = evaluateConstraints(
      { query: 'test', openNow: { value: true, strength: 'required' } },
      basePlace,
      vnAt(10), // VN 10:00 — within 7:00–22:00
    );
    expect(constraints.find((c) => c.name === 'openNow')?.status).toBe('met');
    expect(constraintDetails.find((d) => d.name === 'openNow')?.status).toBe('met');
    expect(hasUnmetRequired).toBe(false);
  });

  it('openNow unknown when openHour/closeHour attribute is unknown', () => {
    const place: Place = { ...basePlace, openHour: unknown(), closeHour: unknown() };
    const { constraints, hasUnmetRequired, excluded } = evaluateConstraints(
      { query: 'test', openNow: { value: true, strength: 'required' } },
      place,
      fixedNow,
    );
    expect(constraints.find((c) => c.name === 'openNow')?.status).toBe('unknown');
    expect(hasUnmetRequired).toBe(true);
    expect(excluded).toBe(false); // unknown required → keep with flag, not excluded
  });

  it('openNow not_met excludes place when required and cafe is closed', () => {
    const { constraints, excluded } = evaluateConstraints(
      { query: 'test', openNow: { value: true, strength: 'required' } },
      basePlace,
      vnAt(23), // VN 23:00 — outside 7:00–22:00
    );
    expect(constraints.find((c) => c.name === 'openNow')?.status).toBe('not_met');
    expect(excluded).toBe(true);
  });

  it('constraintDetails budget evidence has value and mock source', () => {
    const { constraintDetails } = evaluateConstraints(
      { query: 'test', budget: { maxVnd: 70000, strength: 'preferred' } },
      basePlace,
      fixedNow,
    );
    const budgetDetail = constraintDetails.find((d) => d.name === 'budget');
    expect(budgetDetail?.evidence?.value).toBe(60000);
    expect(budgetDetail?.evidence?.source).toBe('mock');
  });

  it('constraintDetails contains one entry per district and per amenity', () => {
    const intent: SearchIntent = {
      query: 'test',
      districts: [
        { name: 'District 1', strength: 'required' },
        { name: 'District 3', strength: 'preferred' },
      ],
      amenities: [
        { name: 'wifi', strength: 'preferred' },
        { name: 'quiet', strength: 'preferred' },
      ],
    };
    const { constraintDetails } = evaluateConstraints(intent, basePlace, fixedNow);
    expect(constraintDetails.find((d) => d.name === 'district:District 1')?.status).toBe('met');
    expect(constraintDetails.find((d) => d.name === 'district:District 3')?.status).toBe('not_met');
    expect(constraintDetails.find((d) => d.name === 'amenity:wifi')?.status).toBe('met');
    expect(constraintDetails.find((d) => d.name === 'amenity:quiet')?.status).toBe('unknown');
  });
});
