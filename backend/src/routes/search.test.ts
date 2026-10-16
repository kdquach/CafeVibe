import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

const ORIGIN = 'http://localhost:5173';
const TEST_ENV = {
  NODE_ENV: 'test' as const,
  PORT: 4000,
  FRONTEND_ORIGIN: ORIGIN,
  PLACE_PROVIDER: 'mock' as const,
};

describe('POST /api/v1/search', () => {
  const app = createApp(TEST_ENV);

  it('returns 200 with search results for valid query', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .send({ query: 'cafe in district 1' });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0]).toHaveProperty('constraints');
    expect(res.body.data[0]).toHaveProperty('hasUnmetRequired');
  });

  it('returns 400 for empty query', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .send({ query: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 for missing query', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .set('Content-Type', 'application/json')
      .send('{not valid json}');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('returns 413 for oversized body', async () => {
    const largeQuery = 'a'.repeat(101 * 1024);
    const res = await request(app)
      .post('/api/v1/search')
      .send({ query: largeQuery });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
