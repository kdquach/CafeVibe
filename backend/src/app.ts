import cors from 'cors';
import express, { type Express } from 'express';
import type { Env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';

/**
 * Builds the Express app without starting a server, so tests can import it via Supertest.
 */
export function createApp(env: Pick<Env, 'FRONTEND_ORIGIN'>): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
