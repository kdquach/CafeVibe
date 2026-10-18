import { describe, it, expect } from 'vitest';
import { attributeSchema, known, unknown } from './schemas.js';
import { z } from 'zod';

describe('known / unknown helpers', () => {
  it('known() returns a known attribute with value and source', () => {
    expect(known(60000, 'provider')).toEqual({ type: 'known', value: 60000, source: 'provider' });
  });

  it('unknown() returns an unknown attribute', () => {
    expect(unknown()).toEqual({ type: 'unknown' });
  });
});

describe('attributeSchema', () => {
  const numAttr = attributeSchema(z.number());

  it('accepts a valid known attribute', () => {
    const result = numAttr.safeParse({ type: 'known', value: 42, source: 'mock' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid unknown attribute', () => {
    const result = numAttr.safeParse({ type: 'unknown' });
    expect(result.success).toBe(true);
  });

  it('rejects a known attribute missing value', () => {
    const result = numAttr.safeParse({ type: 'known', source: 'provider' });
    expect(result.success).toBe(false);
  });

  it('rejects a known attribute missing source', () => {
    const result = numAttr.safeParse({ type: 'known', value: 42 });
    expect(result.success).toBe(false);
  });

  it('rejects an unrecognised source value', () => {
    const result = numAttr.safeParse({ type: 'known', value: 42, source: 'database' });
    expect(result.success).toBe(false);
  });
});
