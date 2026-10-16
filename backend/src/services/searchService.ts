import type { PlaceProvider } from '../domain/providers.js';
import type { SearchIntent, SearchResult } from '../domain/schemas.js';
import { evaluateConstraints } from '../domain/utils.js';

export interface SearchServiceDeps {
  placeProvider: PlaceProvider;
  clock: () => Date;
}

export class SearchService {
  constructor(private deps: SearchServiceDeps) {}

  async search(intent: SearchIntent): Promise<SearchResult[]> {
    const places = await this.deps.placeProvider.getPlaces();

    const results: SearchResult[] = [];

    for (const place of places) {
      const { constraints, hasUnmetRequired } = evaluateConstraints(intent, place);

      results.push({
        id: place.id,
        name: place.name,
        district: place.district,
        address: place.address,
        priceLevel: place.priceLevel,
        constraints,
        hasUnmetRequired,
      });
    }

    // Sort: places without unmet required first, then by count of 'met' constraints
    return results.sort((a, b) => {
      if (a.hasUnmetRequired !== b.hasUnmetRequired) {
        return a.hasUnmetRequired ? 1 : -1;
      }
      const aMetCount = a.constraints.filter((c) => c.status === 'met').length;
      const bMetCount = b.constraints.filter((c) => c.status === 'met').length;
      return bMetCount - aMetCount;
    });
  }
}

export function createSearchService(
  placeProvider: PlaceProvider,
  clock: () => Date,
): SearchService {
  return new SearchService({ placeProvider, clock });
}
