import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

const ORIGIN = 'http://localhost:5173';

describe('GET /api/v1/health', () => {
  const app = createApp({ FRONTEND_ORIGIN: ORIGIN });

  it('returns 200 with the success envelope', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(res.body.data.timestamp))).toBe(false);
  });

  it('does not expose the x-powered-by header', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('unknown routes', () => {
  const app = createApp({ FRONTEND_ORIGIN: ORIGIN });

  it('returns 404 with the error envelope', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
    });
  });
});

describe('CORS', () => {
  const app = createApp({ FRONTEND_ORIGIN: ORIGIN });

  it('allows the configured frontend origin', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', ORIGIN);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
  });

  it('does not allow other origins', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://evil.example');
    expect(res.headers['access-control-allow-origin']).not.toBe('http://evil.example');
  });
});

describe('error handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 500 without leaking internals for unexpected errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = express();
    app.get('/boom', () => {
      throw new Error('secret internal detail');
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
    expect(JSON.stringify(res.body)).not.toContain('secret internal detail');
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });

  it('returns 400 for malformed JSON bodies', async () => {
    const app = createApp({ FRONTEND_ORIGIN: ORIGIN });
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});
