import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService, createSearchService } from './searchService.js';
import type { PlaceProvider } from '../domain/providers.js';
import type { SearchIntent } from '../domain/schemas.js';

describe('SearchService', () => {
  let mockProvider: PlaceProvider;
  let service: SearchService;
  const mockClock = () => new Date('2026-10-17T10:00:00Z');

  beforeEach(() => {
    mockProvider = {
      getPlaces: async () => [
        {
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
          amenities: ['wifi'],
        },
        {
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
          amenities: ['parking'],
        },
      ],
    };
    service = createSearchService(mockProvider, mockClock);
  });

  it('returns search results with constraints', async () => {
    const intent: SearchIntent = {
      query: 'cafe',
      districts: [{ name: 'District 1', strength: 'required' }],
    };
    const results = await service.search(intent);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('constraints');
    expect(results[0]).toHaveProperty('hasUnmetRequired');
  });

  it('marks results with unmet required constraints', async () => {
    const intent: SearchIntent = {
      query: 'cafe',
      priceRange: { min: 3, max: 4, strength: 'required' },
      districts: [{ name: 'District 1', strength: 'required' }],
    };
    const results = await service.search(intent);
    expect(results.length).toBeGreaterThan(0);
    const hasUnmetRequired = results.some(r => r.hasUnmetRequired);
    expect(hasUnmetRequired).toBe(true);
  });
});
