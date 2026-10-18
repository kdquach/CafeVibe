import type { PlaceProvider } from '../domain/providers.js';
import type { SearchIntent, SearchResponse } from '../domain/schemas.js';
import { areas } from '../domain/fixtures.js';
import { evaluateConstraints } from '../domain/utils.js';

export interface SearchServiceDeps {
  placeProvider: PlaceProvider;
  clock: () => Date;
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

    const now = this.deps.clock();
    const places = await this.deps.placeProvider.getPlaces();
    const results = [];
    for (const place of places) {
      const { constraints, constraintDetails, hasUnmetRequired, excluded } = evaluateConstraints(
        intent,
        place,
        now,
      );
      if (excluded) continue;
      results.push({
        id: place.id,
        name: place.name,
        district: place.district,
        address: place.address,
        // Serialize Attribute<number> → number|null to preserve the existing /search contract
        priceLevel: place.priceLevel.type === 'known' ? place.priceLevel.value : null,
        source: this.deps.placeProvider.source,
        constraints,
        hasUnmetRequired,
        constraintDetails,
      });
    }

    return { results, warnings: [] };
  }
}

/**
 * @param placeProvider - data source
 * @param clock - injectable clock; defaults to system clock (() => new Date())
 */
export function createSearchService(
  placeProvider: PlaceProvider,
  clock: () => Date = () => new Date(),
): SearchService {
  return new SearchService({ placeProvider, clock });
}
