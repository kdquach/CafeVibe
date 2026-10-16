import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import { SearchIntentSchema } from '../domain/schemas.js';
import type { IntentExtractor } from '../services/intentExtractor.js';

const ORIGIN = 'http://localhost:5173';
const TEST_ENV = {
  NODE_ENV: 'test' as const,
  PORT: 4000,
  FRONTEND_ORIGIN: ORIGIN,
  PLACE_PROVIDER: 'mock' as const,
};

describe('POST /api/v1/search/intent', () => {
  const app = createApp(TEST_ENV);

  it('extracts district, budget, quiet and work from a Vietnamese query', async () => {
    const query = 'Quán yên tĩnh để làm việc ở Gò Vấp, dưới 70.000đ';
    const res = await request(app).post('/api/v1/search/intent').send({ query });
    expect(res.status).toBe(200);
    expect(SearchIntentSchema.safeParse(res.body.data).success).toBe(true);
    expect(res.body.data.districts).toEqual([{ name: 'Gò Vấp', strength: 'required' }]);
    expect(res.body.data.budget).toEqual({ maxVnd: 70000, strength: 'required' });
    expect(res.body.data.amenities).toEqual(
      expect.arrayContaining([
        { name: 'quiet', strength: 'preferred' },
        { name: 'work-friendly', strength: 'preferred' },
      ]),
    );
  });

  it('extracts conditions from an English query', async () => {
    const query = 'quiet cafe with wifi in District 3 under 100k, open now';
    const res = await request(app).post('/api/v1/search/intent').send({ query });
    expect(res.status).toBe(200);
    expect(SearchIntentSchema.safeParse(res.body.data).success).toBe(true);
    expect(res.body.data.districts).toEqual([{ name: 'District 3', strength: 'required' }]);
    expect(res.body.data.budget).toEqual({ maxVnd: 100000, strength: 'required' });
    expect(res.body.data.openNow).toEqual({ value: true, strength: 'required' });
    expect(res.body.data.amenities).toEqual(
      expect.arrayContaining([
        { name: 'quiet', strength: 'preferred' },
        { name: 'wifi', strength: 'preferred' },
      ]),
    );
  });

  it('extracts conditions from an unaccented Vietnamese query', async () => {
    const query = 'quan yen tinh de lam viec o go vap, duoi 70 nghin';
    const res = await request(app).post('/api/v1/search/intent').send({ query });
    expect(res.status).toBe(200);
    expect(res.body.data.districts).toEqual([{ name: 'Gò Vấp', strength: 'required' }]);
    expect(res.body.data.budget).toEqual({ maxVnd: 70000, strength: 'required' });
    expect(res.body.data.amenities).toEqual(
      expect.arrayContaining([
        { name: 'quiet', strength: 'preferred' },
        { name: 'work-friendly', strength: 'preferred' },
      ]),
    );
  });

  it('returns 400 for empty, missing, or oversized query', async () => {
    const empty = await request(app).post('/api/v1/search/intent').send({ query: '' });
    const missing = await request(app).post('/api/v1/search/intent').send({});
    const long = await request(app)
      .post('/api/v1/search/intent')
      .send({ query: 'a'.repeat(501) });
    expect(empty.status).toBe(400);
    expect(empty.body.error.code).toBe('INVALID_REQUEST');
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('INVALID_REQUEST');
    expect(long.status).toBe(400);
    expect(long.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 502 when extractor output fails schema validation', async () => {
    const badExtractor: IntentExtractor = {
      extract: async (query) => ({ query, minRating: { value: 99, strength: 'preferred' } }) as never,
    };
    const badApp = createApp(TEST_ENV, { intentExtractor: badExtractor });
    const res = await request(badApp).post('/api/v1/search/intent').send({ query: 'cafe' });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('INTENT_EXTRACTION_FAILED');
  });

  it('returns 502 without leaking internals when extractor throws', async () => {
    const throwingExtractor: IntentExtractor = {
      extract: async () => {
        throw new Error('secret llm failure');
      },
    };
    const throwingApp = createApp(TEST_ENV, { intentExtractor: throwingExtractor });
    const res = await request(throwingApp).post('/api/v1/search/intent').send({ query: 'cafe' });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('INTENT_EXTRACTION_FAILED');
    expect(JSON.stringify(res.body)).not.toContain('secret llm failure');
  });

  it('omits undetected fields for a vague query instead of fabricating', async () => {
    const res = await request(app)
      .post('/api/v1/search/intent')
      .send({ query: 'somewhere nice' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ query: 'somewhere nice' });
  });
});
