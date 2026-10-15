const DEFAULT_API_BASE_URL = 'http://localhost:4000';

/** Base URL of the CafeVibe backend, without a trailing slash. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  '',
);
