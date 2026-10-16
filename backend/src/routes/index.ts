import { Router } from 'express';
import type { SearchService } from '../services/searchService.js';
import type { IntentBuilder } from '../services/intentBuilder.js';
import type { IntentExtractor } from '../services/intentExtractor.js';
import { getHealth } from '../controllers/healthController.js';
import { createSearchHandler } from '../controllers/searchController.js';
import { createIntentHandler } from '../controllers/intentController.js';

export function createApiRouter(
  searchService: SearchService,
  intentBuilder: IntentBuilder,
  intentExtractor: IntentExtractor,
) {
  const apiRouter = Router();

  apiRouter.get('/health', getHealth);
  apiRouter.post('/search', createSearchHandler(searchService, intentBuilder));
  apiRouter.post('/search/intent', createIntentHandler(intentExtractor));

  return apiRouter;
}
