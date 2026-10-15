import type { Place } from './schemas.js';
import { PlaceProviderError, RateLimitError, TimeoutError } from './errors.js';
import { CAFES } from './fixtures.js';

export interface PlaceProvider {
  getPlaces(): Promise<Place[]>;
}

export class MockPlaceProvider implements PlaceProvider {
  private requestCount = 0;
  private simulateError: 'timeout' | 'provider' | 'ratelimit' | null = null;

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

    return CAFES;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  resetRequestCount() {
    this.requestCount = 0;
  }
}
