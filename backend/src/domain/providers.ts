import type { Place, ResultSource } from './schemas.js';
import { PlaceProviderError, RateLimitError, TimeoutError } from './errors.js';
import { CAFES } from './fixtures.js';

export interface PlaceProvider {
  readonly source: ResultSource;
  getPlaces(): Promise<Place[]>;
}

export class MockPlaceProvider implements PlaceProvider {
  readonly source: ResultSource = 'mock';
  private requestCount = 0;
  private simulateError: 'timeout' | 'provider' | 'ratelimit' | null = null;

  constructor(private places: Place[] = CAFES) {}

  setSimulateError(error: 'timeout' | 'provider' | 'ratelimit' | null) {
    this.simulateError = error;
  }

  async getPlaces(): Promise<Place[]> {
    this.requestCount += 1;

    if (this.simulateError === 'timeout') {
      throw new TimeoutError('Mock provider timeout');
    }

    if (this.simulateError === 'provider') {
      throw new PlaceProviderError('Mock provider error');
    }

    if (this.simulateError === 'ratelimit') {
      throw new RateLimitError('Mock provider rate limit exceeded');
    }

    return this.places;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  resetRequestCount() {
    this.requestCount = 0;
  }
}
