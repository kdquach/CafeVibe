import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService, createSearchService } from './searchService.js';
import { PlaceProviderError } from '../domain/errors.js';
import { MockPlaceProvider, type PlaceProvider } from '../domain/providers.js';
import { TEST_CAFES_UNKNOWN_PRICE } from '../domain/fixtures.js';
import type { Place, SearchIntent } from '../domain/schemas.js';

const cafeA: Place = {
  id: 'cafe-1',
  name: '[MOCK] Cafe A',
  address: '[MOCK] Address A',
  latitude: 10.8,
  longitude: 106.7,
  district: 'District 1',
  openHour: 7,
  closeHour: 22,
  rating: 4.5,
  tags: [],
  priceLevel: 2,
  minPriceVnd: 60000,
  amenities: ['wifi'],
};

const cafeB: Place = {
  id: 'cafe-2',
  name: '[MOCK] Cafe B',
  address: '[MOCK] Address B',
  latitude: 10.8,
  longitude: 106.7,
  district: 'District 3',
  openHour: 8,
  closeHour: 21,
  rating: 4.0,
  tags: [],
  priceLevel: 1,
  minPriceVnd: 35000,
  amenities: ['parking'],
};

describe('SearchService', () => {
  let mockProvider: PlaceProvider;
  let service: SearchService;

  beforeEach(() => {
    mockProvider = { source: 'mock', getPlaces: async () => [cafeA, cafeB] };
    service = createSearchService(mockProvider);
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
    const injectedService = createSearchService(injected);
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
    await expect(createSearchService(failing).search({ query: 'cafe' })).rejects.toThrow(
      PlaceProviderError,
    );
  });
});
