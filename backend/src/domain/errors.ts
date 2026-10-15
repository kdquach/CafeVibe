export class SearchError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'SearchError';
  }
}

export class PlaceProviderError extends SearchError {
  constructor(message: string) {
    super('PROVIDER_ERROR', message, 502);
  }
}

export class TimeoutError extends SearchError {
  constructor(message: string) {
    super('PROVIDER_TIMEOUT', message, 504);
  }
}

export class RateLimitError extends SearchError {
  constructor(message: string) {
    super('RATE_LIMITED', message, 429);
  }
}

export class DownstreamError extends SearchError {
  constructor(
    message: string,
    statusCode: 502 | 504 = 502,
  ) {
    super('SERVICE_UNAVAILABLE', message, statusCode);
  }
}
