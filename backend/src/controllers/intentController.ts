import { z } from 'zod';
import type { RequestHandler } from 'express';
import type { IntentExtractor } from '../services/intentExtractor.js';
import { SearchIntentSchema } from '../domain/schemas.js';
import { HttpError } from '../middlewares/errorHandler.js';

const IntentRequestSchema = z.object({
  query: z.string().min(1).max(500),
});

export function createIntentHandler(intentExtractor: IntentExtractor): RequestHandler {
  return async (req, res, next) => {
    try {
      const parsed = IntentRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, 'INVALID_REQUEST', 'Request must include a query string.');
      }

      const intent = await intentExtractor.extract(parsed.data.query);
      const validated = SearchIntentSchema.safeParse(intent);
      if (!validated.success) {
        throw new HttpError(
          502,
          'INTENT_EXTRACTION_FAILED',
          'Could not extract intent. Please try again.',
        );
      }

      res.json({ data: validated.data });
    } catch (err) {
      if (err instanceof HttpError) {
        next(err);
        return;
      }
      next(
        new HttpError(
          502,
          'INTENT_EXTRACTION_FAILED',
          'Could not extract intent. Please try again.',
        ),
      );
    }
  };
}
