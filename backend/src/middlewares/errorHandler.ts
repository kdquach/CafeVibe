import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody } from '../types/api.js';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ApiErrorBody = {
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
  };
  res.status(404).json(body);
};

/**
 * Last-resort error handler. Never leaks stack traces or internal messages for unexpected errors.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ApiErrorBody = { error: { code: err.code, message: err.message } };
    res.status(err.status).json(body);
    return;
  }

  // Malformed JSON or oversized bodies surface from express.json() as errors.
  if (typeof err === 'object' && err !== null && 'type' in err) {
    if (err.type === 'entity.parse.failed') {
      const body: ApiErrorBody = {
        error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' },
      };
      res.status(400).json(body);
      return;
    }
    if (err.type === 'entity.too.large') {
      const body: ApiErrorBody = {
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds maximum size (100 KB).' },
      };
      res.status(413).json(body);
      return;
    }
  }

  console.error('Unhandled error:', err);
  const body: ApiErrorBody = {
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  };
  res.status(500).json(body);
};
