import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import { MockIntentExtractor } from '../services/intentExtractor.js';

const ORIGIN = 'http://localhost:5173';
const TEST_ENV = {
  NODE_ENV: 'test' as const,
  PORT: 4000,
  FRONTEND_ORIGIN: ORIGIN,
  PLACE_PROVIDER: 'mock' as const,
};

describe('POST /api/v1/search', () => {
  const app = createApp(TEST_ENV);

  it('returns 200 with results and warnings for a valid intent', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .send({ intent: { query: 'cafe', districts: [{ name: 'District 1', strength: 'required' }] } });
    expect(res.status).toBe(200);
    expect(res.body.data.results).toBeInstanceOf(Array);
    expect(res.body.data.warnings).toEqual([]);
    expect(res.body.data.results[0]).toHaveProperty('source', 'mock');
    expect(res.body.data.results[0]).toHaveProperty('constraints');
  });

  it('returns 400 for the legacy query-only body', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .send({ query: 'cafe in district 1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 for a missing intent', async () => {
    const res = await request(app).post('/api/v1/search').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 200 empty results with LOCATION_NOT_SUPPORTED for unsupported area', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .send({ intent: { query: 'cafe', districts: [{ name: 'Gò Vấp', strength: 'required' }] } });
    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual([]);
    expect(res.body.data.warnings).toEqual([
      { code: 'LOCATION_NOT_SUPPORTED', message: expect.any(String) },
    ]);
  });

  it('extracted intent for a quiet cafe in District 1 under 70k returns real results', async () => {
    const extractor = new MockIntentExtractor();
    const intent = await extractor.extract('Quán yên tĩnh ở Quận 1 dưới 70k');
    expect(intent.districts).toEqual([{ name: 'District 1', strength: 'required' }]);
    const res = await request(app).post('/api/v1/search').send({ intent });
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBeGreaterThan(0);
    expect(res.body.data.warnings).toEqual([]);
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
      .send({ intent: { query: largeQuery } });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
