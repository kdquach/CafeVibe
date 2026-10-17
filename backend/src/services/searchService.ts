import type { PlaceProvider } from '../domain/providers.js';
import type { SearchIntent, SearchResponse } from '../domain/schemas.js';
import { areas } from '../domain/fixtures.js';
import { evaluateConstraints } from '../domain/utils.js';

export interface SearchServiceDeps {
  placeProvider: PlaceProvider;
}

export class SearchService {
  constructor(private deps: SearchServiceDeps) {}

  async search(intent: SearchIntent): Promise<SearchResponse> {
    const unsupported = (intent.districts ?? []).filter((d) => !areas.includes(d.name));
    if (unsupported.length > 0) {
      return {
        results: [],
        warnings: [
          {
            code: 'LOCATION_NOT_SUPPORTED',
            message: `Unsupported area(s): ${unsupported.map((d) => d.name).join(', ')}.`,
          },
        ],
      };
    }

    const places = await this.deps.placeProvider.getPlaces();
    const results = [];
    for (const place of places) {
      const { constraints, hasUnmetRequired, excluded } = evaluateConstraints(intent, place);
      if (excluded) continue;
      results.push({
        id: place.id,
        name: place.name,
        district: place.district,
        address: place.address,
        priceLevel: place.priceLevel,
        source: this.deps.placeProvider.source,
        constraints,
        hasUnmetRequired,
      });
    }

    return { results, warnings: [] };
  }
}

export function createSearchService(placeProvider: PlaceProvider): SearchService {
  return new SearchService({ placeProvider });
}
