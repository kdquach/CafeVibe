import { describe, expect, it } from 'vitest';
import { EnvValidationError, parseEnv } from '../src/config/env.js';

describe('parseEnv', () => {
  it('accepts a valid environment and applies defaults', () => {
    const env = parseEnv({ FRONTEND_ORIGIN: 'http://localhost:5173' });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(4000);
    expect(env.FRONTEND_ORIGIN).toBe('http://localhost:5173');
  });

  it('coerces PORT from a string', () => {
    const env = parseEnv({ FRONTEND_ORIGIN: 'http://localhost:5173', PORT: '8080' });
    expect(env.PORT).toBe(8080);
  });

  it('throws a readable error when FRONTEND_ORIGIN is missing', () => {
    expect(() => parseEnv({})).toThrow(EnvValidationError);
    try {
      parseEnv({});
    } catch (error) {
      expect((error as EnvValidationError).message).toContain('FRONTEND_ORIGIN');
    }
  });

  it('rejects an invalid PORT', () => {
    expect(() => parseEnv({ FRONTEND_ORIGIN: 'http://localhost:5173', PORT: 'abc' })).toThrow(
      EnvValidationError,
    );
    expect(() => parseEnv({ FRONTEND_ORIGIN: 'http://localhost:5173', PORT: '70000' })).toThrow(
      EnvValidationError,
    );
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() =>
      parseEnv({ FRONTEND_ORIGIN: 'http://localhost:5173', NODE_ENV: 'staging' }),
    ).toThrow(EnvValidationError);
  });

  it('rejects a FRONTEND_ORIGIN that is not a URL', () => {
    expect(() => parseEnv({ FRONTEND_ORIGIN: 'not-a-url' })).toThrow(EnvValidationError);
  });
});
