import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService, createSearchService } from './searchService.js';
import { PlaceProviderError } from '../domain/errors.js';
import { MockPlaceProvider, type PlaceProvider } from '../domain/providers.js';
import { TEST_CAFES_UNKNOWN_PRICE } from '../domain/fixtures.js';
import type { Place, SearchIntent } from '../domain/schemas.js';
import { known, unknown } from '../domain/schemas.js';

const cafeA: Place = {
  id: 'cafe-1',
  name: '[MOCK] Cafe A',
  address: '[MOCK] Address A',
  latitude: 10.8,
  longitude: 106.7,
  district: 'District 1',
  openHour: known(7, 'mock'),
  closeHour: known(22, 'mock'),
  rating: 4.5,
  tags: [],
  priceLevel: known(2, 'mock'),
  minPriceVnd: known(60000, 'mock'),
  amenities: known(['wifi'], 'mock'),
};

const cafeB: Place = {
  id: 'cafe-2',
  name: '[MOCK] Cafe B',
  address: '[MOCK] Address B',
  latitude: 10.8,
  longitude: 106.7,
  district: 'District 3',
  openHour: known(8, 'mock'),
  closeHour: known(21, 'mock'),
  rating: 4.0,
  tags: [],
  priceLevel: known(1, 'mock'),
  minPriceVnd: known(35000, 'mock'),
  amenities: known(['parking'], 'mock'),
};

// UTC 03:00 = VN 10:00 — both cafes are open during their hours
const frozenClock = () => new Date('2026-10-17T03:00:00Z');

describe('SearchService', () => {
  let mockProvider: PlaceProvider;
  let service: SearchService;

  beforeEach(() => {
    mockProvider = { source: 'mock', getPlaces: async () => [cafeA, cafeB] };
    service = createSearchService(mockProvider, frozenClock);
  });

  it('excludes required not_met places and keeps fixture order', async () => {
    const intent: SearchIntent = {
      query: 'cafe',
      districts: [{ name: 'District 1', strength: 'required' }],
    };
    const response = await service.search(intent);
    expect(response.warnings).toEqual([]);
    expect(response.results.map((r) => r.id)).toEqual(['cafe-1']);
    expect(response.results[0]).toMatchObject({ source: 'mock' });
  });

  it('keeps places on preferred conditions without flagging', async () => {
    const intent: SearchIntent = {
      query: 'cafe',
      districts: [{ name: 'District 1', strength: 'preferred' }],
    };
    const response = await service.search(intent);
    expect(response.results.map((r) => r.id)).toEqual(['cafe-1', 'cafe-2']);
    expect(response.results.every((r) => !r.hasUnmetRequired)).toBe(true);
  });

  it('keeps required+unknown places with flag (injected test fixtures)', async () => {
    const injected = new MockPlaceProvider(TEST_CAFES_UNKNOWN_PRICE);
    const injectedService = createSearchService(injected, frozenClock);
    const response = await injectedService.search({
      query: 'cafe',
      budget: { maxVnd: 50000, strength: 'required' },
    });
    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({ id: 'cafe-test-unknown-price', hasUnmetRequired: true });
  });

  it('returns empty results with LOCATION_NOT_SUPPORTED for unsupported area', async () => {
    const intent: SearchIntent = {
      query: 'cafe',
      districts: [{ name: 'Gò Vấp', strength: 'required' }],
    };
    const response = await service.search(intent);
    expect(response.results).toEqual([]);
    expect(response.warnings).toEqual([
      { code: 'LOCATION_NOT_SUPPORTED', message: expect.any(String) },
    ]);
  });

  it('propagates provider errors', async () => {
    const failing: PlaceProvider = {
      source: 'mock',
      getPlaces: async () => {
        throw new PlaceProviderError('down');
      },
    };
    await expect(createSearchService(failing, frozenClock).search({ query: 'cafe' })).rejects.toThrow(
      PlaceProviderError,
    );
  });

  it('serializes priceLevel from Attribute<number> to number|null in response', async () => {
    const withUnknownPrice: Place = {
      ...cafeA,
      id: 'cafe-no-price',
      priceLevel: unknown(),
    };
    const provider: PlaceProvider = {
      source: 'mock',
      getPlaces: async () => [cafeA, withUnknownPrice],
    };
    const response = await createSearchService(provider, frozenClock).search({ query: 'cafe' });
    expect(response.results.find((r) => r.id === 'cafe-1')?.priceLevel).toBe(2);
    expect(response.results.find((r) => r.id === 'cafe-no-price')?.priceLevel).toBeNull();
  });

  it('includes constraintDetails in response when constraints are evaluated', async () => {
    const intent: SearchIntent = {
      query: 'cafe',
      budget: { maxVnd: 70000, strength: 'preferred' },
    };
    const response = await service.search(intent);
    const result = response.results[0];
    expect(result).toBeDefined();
    expect(Array.isArray(result!.constraintDetails)).toBe(true);
    const budgetDetail = result!.constraintDetails?.find((d) => d.name === 'budget');
    expect(budgetDetail?.status).toBe('met');
    expect(budgetDetail?.evidence?.source).toBe('mock');
  });

  it('clock injection: openNow resolved against frozen time (VN 10:00, open 7–22 → met)', async () => {
    const intent: SearchIntent = {
      query: 'cafe',
      openNow: { value: true, strength: 'preferred' },
    };
    const response = await service.search(intent);
    const cafeAResult = response.results.find((r) => r.id === 'cafe-1');
    expect(cafeAResult?.constraints.find((c) => c.name === 'openNow')?.status).toBe('met');
  });
});
