import { z } from 'zod';
import type { RequestHandler } from 'express';
import type { SearchService } from '../services/searchService.js';
import type { IntentBuilder } from '../services/intentBuilder.js';
import { HttpError } from '../middlewares/errorHandler.js';
import { PlaceProviderError, RateLimitError, TimeoutError } from '../domain/errors.js';

const QueryRequestSchema = z.object({
  query: z.string().min(1),
});

export function createSearchHandler(
  searchService: SearchService,
  intentBuilder: IntentBuilder,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const parsed = QueryRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, 'INVALID_REQUEST', 'Request must include a query string.');
      }

      const intent = await intentBuilder.fromQuery(parsed.data.query);
      const results = await searchService.search(intent);
      res.json({ data: results });
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
