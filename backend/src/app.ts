import cors from 'cors';
import express, { type Express } from 'express';
import type { Env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { MockPlaceProvider } from './domain/providers.js';
import { createSearchService } from './services/searchService.js';
import { MockIntentExtractor, type IntentExtractor } from './services/intentExtractor.js';
import { createApiRouter } from './routes/index.js';

export interface AppDependencies {
  intentExtractor?: IntentExtractor;
}

/**
 * Builds the Express app without starting a server, so tests can import it via Supertest.
 */
export function createApp(env: Env, deps: AppDependencies = {}): Express {
  const app = express();

  const placeProvider = new MockPlaceProvider();
  const searchService = createSearchService(placeProvider);
  const intentExtractor = deps.intentExtractor || new MockIntentExtractor();

  app.disable('x-powered-by');
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1', createApiRouter(searchService, intentExtractor));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
