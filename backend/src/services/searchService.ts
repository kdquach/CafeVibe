import type { PlaceProvider } from '../domain/providers.js';
import type { SearchIntent, SearchResult } from '../domain/schemas.js';
import { evaluateConstraints, calculateStrength } from '../domain/utils.js';

export interface SearchServiceDeps {
  placeProvider: PlaceProvider;
  clock: () => Date;
}

export class SearchService {
  constructor(private deps: SearchServiceDeps) {}

  async search(intent: SearchIntent): Promise<SearchResult[]> {
    const places = await this.deps.placeProvider.getPlaces();

    const matched = places.filter((place) => evaluateConstraints(intent, place));

    const withStrength = matched.map((place) => ({
      place,
      strength: calculateStrength(intent, place, this.deps.clock),
    }));

    const sorted = withStrength.sort((a, b) => {
      if (a.strength !== b.strength) {
        return b.strength - a.strength;
      }
      return a.place.name.localeCompare(b.place.name);
    });

    return sorted.map(({ place, strength }) => ({
      id: place.id,
      name: place.name,
      district: place.district,
      address: place.address,
      priceLevel: place.priceLevel,
      strength,
    }));
  }
}

export function createSearchService(
  placeProvider: PlaceProvider,
  clock: () => Date,
): SearchService {
  return new SearchService({ placeProvider, clock });
}
