import type { RequestHandler } from 'express';
import type { SearchService } from '../services/searchService.js';
import { SearchIntentSchema } from '../domain/schemas.js';
import { HttpError } from '../middlewares/errorHandler.js';
import { PlaceProviderError, RateLimitError, TimeoutError } from '../domain/errors.js';

const SearchRequestSchema = SearchIntentSchema;

export function createSearchHandler(searchService: SearchService): RequestHandler {
  return async (req, res, next) => {
    try {
      const parsed = SearchRequestSchema.safeParse(req.body?.intent);
      if (!parsed.success) {
        throw new HttpError(400, 'INVALID_REQUEST', 'Request must include a valid intent object.');
      }

      const response = await searchService.search(parsed.data);
      res.json({ data: response });
    } catch (err) {
      if (err instanceof HttpError) {
        next(err);
        return;
      }

      if (err instanceof RateLimitError) {
        next(new HttpError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.'));
        return;
      }

      if (err instanceof TimeoutError) {
        next(new HttpError(504, 'SERVICE_UNAVAILABLE', 'A required service is unavailable.'));
        return;
      }

      if (err instanceof PlaceProviderError) {
        next(new HttpError(502, 'SERVICE_UNAVAILABLE', 'A required service is unavailable.'));
        return;
      }

      next(err);
    }
  };
}
