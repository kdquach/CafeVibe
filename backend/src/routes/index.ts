import { Router } from 'express';
import type { SearchService } from '../services/searchService.js';
import { getHealth } from '../controllers/healthController.js';
import { createSearchHandler } from '../controllers/searchController.js';

export function createApiRouter(searchService: SearchService) {
  const apiRouter = Router();

  apiRouter.get('/health', getHealth);
  apiRouter.post('/search', createSearchHandler(searchService));

  return apiRouter;
}
